import React from "react";
import {
  Circle,
  Document,
  G,
  Image,
  Line,
  Page,
  Path,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import { calculateContainerBalance } from "@/lib/containerBalance";

const IN_TO_CM = 2.54;
const LB_TO_KG = 0.453592;
const CUFT_TO_CBM = 0.0283168;

const BRAND_NAVY = "#0f172a";
const BRAND_BLUE = "#007BFF";
const BRAND_BLUE_LIGHT = "#eff6ff";
const SLATE_50 = "#f8fafc";
const SLATE_100 = "#f1f5f9";
const SLATE_200 = "#e2e8f0";
const SLATE_500 = "#64748b";
const SLATE_700 = "#334155";
const SLATE_900 = "#0f172a";

interface ContainerSpec {
  id: string;
  name: string;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  maxPayloadLbs: number;
  volumeCuFt: number;
  tare: number;
}

interface PlacedBox {
  cargoId: string;
  cargoName: string;
  color: string;
  x: number;
  y: number;
  z: number;
  l: number;
  w: number;
  h: number;
  weight: number;
  rotation: string;
  stackable: boolean;
}

interface LoadingResult {
  placed: PlacedBox[];
  unplaced: { name: string; qty: number }[];
  totalWeight: number;
  totalVolume: number;
  containerVolume: number;
  maxPayload: number;
  volumeUtil: number;
  weightUtil: number;
  floorArea: number;
  containerFloorArea: number;
  piecesLoaded: number;
  piecesTotal: number;
}

interface CargoSummaryRow {
  name: string;
  qty: number;
  l: number;
  w: number;
  h: number;
  weightPer: number;
  totalWeight: number;
  stackable: boolean;
  rotation: string;
  color: string;
  volPer: number;
  totalVol: number;
}

interface SnapshotImages {
  iso: string;
  top: string;
  sideA: string;
  front: string;
}

export interface ContainerReportBrand {
  /** Paid-account branding is supplied only after entitlement checks. */
  name?: string;
  domainSuffix?: string;
  tagline?: string;
  logoDataUrl?: string;
  accentColor?: string;
}

export interface ContainerReportPlan {
  label: string;
  containerSpec: ContainerSpec;
  result: LoadingResult;
}

export const ACCESS_TO_NORTH_REPORT_BRAND: Required<Omit<ContainerReportBrand, "logoDataUrl">> = {
  name: "AccessToNorth",
  domainSuffix: ".com",
  tagline: "Container loading calculator",
  accentColor: BRAND_BLUE,
};

export function resolveContainerReportBrand(brand?: ContainerReportBrand) {
  return {
    ...ACCESS_TO_NORTH_REPORT_BRAND,
    ...brand,
    name: brand?.name?.trim() || ACCESS_TO_NORTH_REPORT_BRAND.name,
    accentColor: /^#[0-9a-f]{6}$/i.test(brand?.accentColor ?? "")
      ? brand!.accentColor!
      : ACCESS_TO_NORTH_REPORT_BRAND.accentColor,
  };
}

interface PDFReportProps {
  containerSpec: ContainerSpec;
  cargoRows: CargoSummaryRow[];
  result: LoadingResult;
  totalContainers: number;
  unitSystem: "imperial" | "metric";
  images: SnapshotImages;
  containerPlans?: ContainerReportPlan[];
  brand?: ContainerReportBrand;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingHorizontal: 30,
    paddingBottom: 42,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: SLATE_900,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: -30,
    marginTop: -28,
    marginBottom: 18,
    paddingHorizontal: 30,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
    backgroundColor: "#ffffff",
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 300,
  },
  headerIcon: {
    width: 34,
    height: 34,
    marginRight: 9,
  },
  customLogo: {
    width: 116,
    height: 34,
    objectFit: "contain" as const,
    objectPosition: "left center" as const,
  },
  wordmark: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  wordmarkMain: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    letterSpacing: -0.45,
    color: BRAND_NAVY,
  },
  wordmarkDomain: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    letterSpacing: -0.45,
  },
  headerMeta: {
    width: 205,
    alignItems: "flex-end",
  },
  headerTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: BRAND_NAVY,
    textAlign: "right" as const,
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 6.8,
    color: SLATE_500,
    textAlign: "right" as const,
  },
  footer: {
    position: "absolute" as const,
    left: 30,
    right: 30,
    bottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 5,
    borderTopWidth: 0.6,
    borderTopColor: SLATE_200,
  },
  footerText: {
    fontSize: 6.2,
    color: SLATE_500,
  },
  eyebrow: {
    marginBottom: 5,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    letterSpacing: 0.65,
    textTransform: "uppercase" as const,
    color: BRAND_BLUE,
  },
  pageTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
    letterSpacing: -0.4,
    color: BRAND_NAVY,
  },
  pageIntro: {
    maxWidth: 430,
    marginTop: 5,
    marginBottom: 14,
    fontSize: 8.2,
    lineHeight: 1.45,
    color: SLATE_500,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
    marginBottom: 7,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: BRAND_NAVY,
  },
  sectionMeta: {
    fontSize: 6.7,
    color: SLATE_500,
  },
  decisionBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
    padding: 12,
    borderWidth: 0.8,
    borderRadius: 7,
  },
  decisionCopy: {
    maxWidth: 390,
  },
  decisionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  decisionText: {
    marginTop: 3,
    fontSize: 7.4,
    lineHeight: 1.35,
    color: SLATE_700,
  },
  decisionBadge: {
    minWidth: 90,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    textAlign: "center" as const,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: BRAND_NAVY,
  },
  metricGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 15,
  },
  metricCard: {
    flex: 1,
    minHeight: 61,
    padding: 9,
    borderWidth: 0.7,
    borderColor: SLATE_200,
    borderRadius: 7,
    backgroundColor: SLATE_50,
  },
  metricLabel: {
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 6.2,
    letterSpacing: 0.45,
    textTransform: "uppercase" as const,
    color: SLATE_500,
  },
  metricValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: SLATE_900,
  },
  metricSub: {
    marginTop: 3,
    fontSize: 6.5,
    lineHeight: 1.2,
    color: SLATE_500,
  },
  equipmentGrid: {
    flexDirection: "row",
    flexWrap: "wrap" as const,
    gap: 8,
    marginBottom: 13,
  },
  equipmentCard: {
    width: "49.2%",
    minHeight: 78,
    padding: 9,
    borderWidth: 0.7,
    borderColor: SLATE_200,
    borderRadius: 7,
    backgroundColor: "#ffffff",
  },
  equipmentTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  equipmentIconWrap: {
    width: 82,
    height: 42,
    marginRight: 7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: BRAND_BLUE_LIGHT,
  },
  equipmentIcon: {
    width: 74,
    height: 38,
  },
  equipmentName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.3,
    color: SLATE_900,
  },
  equipmentType: {
    marginTop: 2,
    fontSize: 6.6,
    color: SLATE_500,
  },
  equipmentPieces: {
    marginTop: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: BRAND_BLUE,
  },
  progressRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  progressMetric: {
    flex: 1,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  progressLabel: {
    fontSize: 5.8,
    color: SLATE_500,
  },
  progressTrack: {
    height: 4,
    overflow: "hidden",
    borderRadius: 2,
    backgroundColor: SLATE_100,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  noteGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  noteCard: {
    flex: 1,
    padding: 9,
    borderWidth: 0.7,
    borderColor: SLATE_200,
    borderRadius: 7,
    backgroundColor: SLATE_50,
  },
  noteTitle: {
    marginBottom: 5,
    fontFamily: "Helvetica-Bold",
    fontSize: 7.3,
    color: SLATE_900,
  },
  noteLine: {
    marginBottom: 3,
    fontSize: 6.5,
    lineHeight: 1.3,
    color: SLATE_700,
  },
  table: {
    marginBottom: 12,
    borderWidth: 0.7,
    borderColor: SLATE_200,
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 23,
    paddingHorizontal: 7,
    paddingVertical: 6,
    backgroundColor: BRAND_NAVY,
  },
  tableHeaderText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.1,
    letterSpacing: 0.25,
    textTransform: "uppercase" as const,
    color: "#ffffff",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 24,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: SLATE_200,
    backgroundColor: "#ffffff",
  },
  tableRowAlt: {
    backgroundColor: SLATE_50,
  },
  tableCell: {
    paddingRight: 4,
    fontSize: 6.8,
    lineHeight: 1.25,
    color: SLATE_700,
  },
  tableCellStrong: {
    paddingRight: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 6.8,
    lineHeight: 1.25,
    color: SLATE_900,
  },
  totalsRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 27,
    paddingHorizontal: 7,
    paddingVertical: 6,
    backgroundColor: BRAND_BLUE_LIGHT,
  },
  swatch: {
    width: 9,
    height: 9,
    borderRadius: 3,
  },
  containerHero: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
    padding: 11,
    borderWidth: 0.8,
    borderColor: "#bfdbfe",
    borderRadius: 8,
    backgroundColor: "#f8fbff",
  },
  containerHeroIcon: {
    width: 112,
    height: 58,
    marginRight: 13,
  },
  containerHeroLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    color: SLATE_900,
  },
  containerHeroType: {
    marginTop: 3,
    fontSize: 8,
    color: SLATE_500,
  },
  containerHeroDims: {
    marginTop: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: BRAND_BLUE,
  },
  planFrame: {
    marginBottom: 13,
    padding: 10,
    borderWidth: 0.8,
    borderColor: SLATE_200,
    borderRadius: 8,
    backgroundColor: SLATE_50,
  },
  planLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  balancePanel: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
    marginBottom: 12,
    padding: 9,
    borderWidth: 0.7,
    borderColor: SLATE_200,
    borderRadius: 7,
    backgroundColor: SLATE_50,
  },
  balanceStatus: {
    width: 94,
    justifyContent: "center",
    padding: 7,
    borderRadius: 6,
  },
  balanceStatusText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
  },
  balanceMetric: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 8,
    borderLeftWidth: 0.5,
    borderLeftColor: SLATE_200,
  },
  balanceLabel: {
    marginBottom: 3,
    fontSize: 5.8,
    textTransform: "uppercase" as const,
    color: SLATE_500,
  },
  balanceValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    lineHeight: 1.25,
    color: SLATE_900,
  },
  warning: {
    marginBottom: 12,
    padding: 9,
    borderWidth: 0.8,
    borderColor: "#fed7aa",
    borderRadius: 7,
    backgroundColor: "#fff7ed",
  },
  warningTitle: {
    marginBottom: 3,
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: "#c2410c",
  },
  warningText: {
    fontSize: 6.7,
    lineHeight: 1.35,
    color: "#9a3412",
  },
  snapshotLarge: {
    width: "100%",
    height: 260,
    objectFit: "contain" as const,
    borderWidth: 0.7,
    borderColor: SLATE_200,
    borderRadius: 7,
    backgroundColor: SLATE_50,
  },
  snapshotGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  snapshotSmall: {
    flex: 1,
    height: 150,
    objectFit: "contain" as const,
    borderWidth: 0.7,
    borderColor: SLATE_200,
    borderRadius: 7,
    backgroundColor: SLATE_50,
  },
  snapshotLabel: {
    marginTop: 4,
    fontSize: 6.5,
    textAlign: "center" as const,
    color: SLATE_500,
  },
});

function cuInToCuFt(cuIn: number) {
  return cuIn / 1728;
}

function clampPct(value: number) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function shorten(value: string, max: number) {
  const normalized = value.trim() || "Unnamed cargo";
  return normalized.length <= max ? normalized : `${normalized.slice(0, Math.max(1, max - 3))}...`;
}

function chunks<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [[]];
  const pages: T[][] = [];
  for (let index = 0; index < items.length; index += size) pages.push(items.slice(index, index + size));
  return pages;
}

function fmtDim(value: number, metric: boolean, decimals = 1) {
  return metric ? `${(value * IN_TO_CM).toFixed(decimals)} cm` : `${value.toFixed(decimals)} in`;
}

function fmtDimValue(value: number, metric: boolean, decimals = 1) {
  return metric ? (value * IN_TO_CM).toFixed(decimals) : value.toFixed(decimals);
}

function fmtWeight(value: number, metric: boolean) {
  return metric
    ? `${Math.round(value * LB_TO_KG).toLocaleString()} kg`
    : `${Math.round(value).toLocaleString()} lbs`;
}

function fmtVolume(valueCuFt: number, metric: boolean) {
  return metric ? `${(valueCuFt * CUFT_TO_CBM).toFixed(2)} m3` : `${valueCuFt.toFixed(1)} ft3`;
}

function ReportBrandMark({ brand: brandInput }: { brand?: ContainerReportBrand }) {
  const brand = resolveContainerReportBrand(brandInput);
  return (
    <View style={styles.headerBrand}>
      {brandInput?.logoDataUrl ? (
        <Image src={brandInput.logoDataUrl} style={styles.headerIcon} />
      ) : (
        <Svg style={styles.headerIcon} viewBox="0 0 24 24">
          <Rect x="0" y="0" width="24" height="24" rx="5.25" fill={brand.accentColor} />
          <G transform="translate(4.5 4.5) scale(0.625)" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <Path d="m9 12 2 2 4-4" />
          </G>
        </Svg>
      )}
      <View style={styles.wordmark}>
        <Text style={styles.wordmarkMain}>{brand.name}</Text>
        {brand.domainSuffix ? <Text style={[styles.wordmarkDomain, { color: brand.accentColor }]}>{brand.domainSuffix}</Text> : null}
      </View>
    </View>
  );
}

function ReportHeader({
  brand,
  title,
  subtitle,
}: {
  brand?: ContainerReportBrand;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.header} fixed>
      <ReportBrandMark brand={brand} />
      <View style={styles.headerMeta}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function ReportFooter({ brand }: { brand?: ContainerReportBrand }) {
  const resolved = resolveContainerReportBrand(brand);
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>Generated by {resolved.name}{resolved.domainSuffix} - verify the plan before loading</Text>
      <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={styles.metricCard} wrap={false}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSub}>{sub}</Text>
    </View>
  );
}

function ContainerIllustration({ container, style }: { container: ContainerSpec; style: any }) {
  const short = container.id.startsWith("20") || container.lengthIn < 300;
  const start = short ? 26 : 8;
  const front = start + 20;
  const ribXs = Array.from(
    { length: short ? 5 : 7 },
    (_, index) => front + 10 + index * ((112 - front - 16) / (short ? 4 : 6)),
  );
  return (
    <Svg viewBox="0 0 120 66" style={style}>
      <Path d="M12 58 C38 63 88 63 114 56" fill="none" stroke="#cbd5e1" strokeWidth="3" opacity={0.55} />
      <Path d={`M${start} 18 91 7l21 10-66 13Z`} fill="#dbeafe" stroke={BRAND_BLUE} strokeWidth="1.7" />
      <Path d={`M${front} 30 112 17v31L${front} 60Z`} fill="#eff6ff" stroke={BRAND_BLUE} strokeWidth="1.7" />
      <Path d={`M${start} 18l${front - start} 12v30L${start} 49Z`} fill="#bfdbfe" stroke={BRAND_BLUE} strokeWidth="1.7" />
      {ribXs.map((x) => (
        <Path key={x} d={`M${x} ${30 - (x - front) * 0.19}v29`} fill="none" stroke="#93c5fd" strokeWidth="1.1" />
      ))}
      <Path d={`M${start + 10} 24v30M${start} 33l${front - start} 11`} fill="none" stroke="#60a5fa" strokeWidth="1" />
      <Path d={`M${start + 6} 37v7m8-3v7`} fill="none" stroke={BRAND_BLUE} strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  );
}

function ProgressMetric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.progressMetric}>
      <View style={styles.progressLabels}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressLabel}>{value.toFixed(0)}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${clampPct(value)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function EquipmentCard({ plan, index }: { plan: ContainerReportPlan; index: number }) {
  return (
    <View style={styles.equipmentCard} wrap={false}>
      <View style={styles.equipmentTop}>
        <View style={styles.equipmentIconWrap}>
          <ContainerIllustration container={plan.containerSpec} style={styles.equipmentIcon} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.equipmentName}>{plan.label || `Container ${index + 1}`}</Text>
          <Text style={styles.equipmentType}>{plan.containerSpec.name}</Text>
          <Text style={styles.equipmentPieces}>{plan.result.piecesLoaded} pieces assigned</Text>
        </View>
      </View>
      <View style={styles.progressRow}>
        <ProgressMetric label="Volume" value={plan.result.volumeUtil} color="#8b5cf6" />
        <ProgressMetric label="Payload" value={plan.result.weightUtil} color="#10b981" />
      </View>
    </View>
  );
}

function OverviewPage(props: PDFReportProps) {
  const { cargoRows, brand } = props;
  const metric = props.unitSystem === "metric";
  const plans = props.containerPlans?.length
    ? props.containerPlans
    : [{ label: "Container 1", containerSpec: props.containerSpec, result: props.result }];
  const totalPieces = cargoRows.reduce((sum, row) => sum + row.qty, 0);
  const totalEnteredWeight = cargoRows.reduce((sum, row) => sum + row.totalWeight, 0);
  const totalEnteredVolume = cargoRows.reduce((sum, row) => sum + row.totalVol, 0);
  const loadedPieces = plans.reduce((sum, plan) => sum + plan.result.piecesLoaded, 0);
  const loadedWeight = plans.reduce((sum, plan) => sum + plan.result.totalWeight, 0);
  const loadedVolume = plans.reduce((sum, plan) => sum + plan.result.totalVolume, 0);
  const payloadCapacity = plans.reduce((sum, plan) => sum + plan.result.maxPayload, 0);
  const volumeCapacity = plans.reduce((sum, plan) => sum + plan.result.containerVolume, 0);
  const complete = loadedPieces >= totalPieces;
  const visiblePlans = plans.slice(0, 6);

  return (
    <Page size="A4" style={styles.page}>
      <ReportHeader brand={brand} title="Container Loading Report" subtitle={new Date().toLocaleString()} />

      <Text style={styles.eyebrow}>Complete loading plan</Text>
      <Text style={styles.pageTitle}>Loading plan overview</Text>
      <Text style={styles.pageIntro}>
        A practical summary of the selected equipment, assigned cargo, utilization, and operator checks. Measurements are planning values and must be confirmed against the actual container.
      </Text>

      <View style={[
        styles.decisionBanner,
        complete
          ? { borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" }
          : { borderColor: "#fed7aa", backgroundColor: "#fff7ed" },
      ]} wrap={false}>
        <View style={styles.decisionCopy}>
          <Text style={[styles.decisionTitle, { color: complete ? "#15803d" : "#c2410c" }]}>
            {complete ? "All cargo assigned" : "Operator review required"}
          </Text>
          <Text style={styles.decisionText}>
            {complete
              ? `${loadedPieces} of ${totalPieces} pieces are assigned across ${plans.length} container${plans.length === 1 ? "" : "s"}.`
              : `${Math.max(0, totalPieces - loadedPieces)} piece(s) remain unassigned. Review dimensions, rotation, stacking, or equipment selection.`}
          </Text>
        </View>
        <Text style={styles.decisionBadge}>{plans.length} container{plans.length === 1 ? "" : "s"}</Text>
      </View>

      <View style={styles.metricGrid}>
        <MetricCard label="Pieces assigned" value={`${loadedPieces} / ${totalPieces}`} sub={complete ? "Complete allocation" : "Exceptions remain"} />
        <MetricCard label="Gross cargo weight" value={fmtWeight(totalEnteredWeight, metric)} sub={`${fmtWeight(loadedWeight, metric)} assigned`} />
        <MetricCard label="Payload used" value={`${(payloadCapacity > 0 ? loadedWeight / payloadCapacity * 100 : 0).toFixed(1)}%`} sub={`${fmtWeight(payloadCapacity, metric)} capacity`} />
        <MetricCard label="Volume used" value={`${(volumeCapacity > 0 ? loadedVolume / volumeCapacity * 100 : 0).toFixed(1)}%`} sub={`${fmtVolume(totalEnteredVolume, metric)} entered`} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Equipment plan</Text>
        <Text style={styles.sectionMeta}>{plans.length} unit{plans.length === 1 ? "" : "s"} selected</Text>
      </View>
      <View style={styles.equipmentGrid}>
        {visiblePlans.map((plan, index) => <EquipmentCard key={`${plan.containerSpec.id}-${index}`} plan={plan} index={index} />)}
      </View>
      {plans.length > visiblePlans.length ? (
        <Text style={[styles.sectionMeta, { marginTop: -7, marginBottom: 10 }]}>+ {plans.length - visiblePlans.length} additional units are detailed on the following pages.</Text>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Operational checks</Text>
        <Text style={styles.sectionMeta}>Complete before loading</Text>
      </View>
      <View style={styles.noteGrid} wrap={false}>
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Verify equipment</Text>
          <Text style={styles.noteLine}>- Confirm internal and door-opening dimensions.</Text>
          <Text style={styles.noteLine}>- Check floor and point-load limits.</Text>
        </View>
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Load and secure</Text>
          <Text style={styles.noteLine}>- Confirm lifting and unloading access.</Text>
          <Text style={styles.noteLine}>- Engineer blocking, bracing, and lashing separately.</Text>
        </View>
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Handover</Text>
          <Text style={styles.noteLine}>- Verify final count and gross weight.</Text>
          <Text style={styles.noteLine}>- Photograph and sign off the secured load.</Text>
        </View>
      </View>

      <ReportFooter brand={brand} />
    </Page>
  );
}

const MANIFEST_COLUMNS = {
  name: "29%",
  qty: "7%",
  dims: "23%",
  weight: "15%",
  stack: "10%",
  rotation: "10%",
  key: "6%",
} as const;

function CargoManifestPage({
  rows,
  allRows,
  pageIndex,
  pageCount,
  unitSystem,
  brand,
}: {
  rows: CargoSummaryRow[];
  allRows: CargoSummaryRow[];
  pageIndex: number;
  pageCount: number;
  unitSystem: "imperial" | "metric";
  brand?: ContainerReportBrand;
}) {
  const metric = unitSystem === "metric";
  const dimUnit = metric ? "cm" : "in";
  const weightUnit = metric ? "kg" : "lbs";
  const totalQty = allRows.reduce((sum, row) => sum + row.qty, 0);
  const totalWeight = allRows.reduce((sum, row) => sum + row.totalWeight, 0);
  const totalVolume = allRows.reduce((sum, row) => sum + row.totalVol, 0);

  return (
    <Page size="A4" style={styles.page}>
      <ReportHeader brand={brand} title="Cargo Details" subtitle={`Manifest page ${pageIndex + 1} of ${pageCount}`} />
      <Text style={styles.eyebrow}>Packing list</Text>
      <Text style={styles.pageTitle}>Cargo manifest</Text>
      <Text style={styles.pageIntro}>Dimensions are outside dimensions. Weight is the total gross weight entered for each cargo row and is divided across its quantity for placement calculations.</Text>

      {pageIndex === 0 ? (
        <View style={styles.metricGrid}>
          <MetricCard label="Cargo rows" value={String(allRows.length)} sub={`${totalQty} total pieces`} />
          <MetricCard label="Gross weight" value={fmtWeight(totalWeight, metric)} sub="Entered total" />
          <MetricCard label="Cargo volume" value={fmtVolume(totalVolume, metric)} sub="Theoretical total" />
          <MetricCard label="Units" value={`${dimUnit} / ${weightUnit}`} sub="Report measurement system" />
        </View>
      ) : null}

      <View style={styles.table}>
        <View style={styles.tableHeader} fixed>
          <Text style={[styles.tableHeaderText, { width: MANIFEST_COLUMNS.name }]}>Cargo</Text>
          <Text style={[styles.tableHeaderText, { width: MANIFEST_COLUMNS.qty, textAlign: "center" }]}>Qty</Text>
          <Text style={[styles.tableHeaderText, { width: MANIFEST_COLUMNS.dims, textAlign: "center" }]}>L x W x H ({dimUnit})</Text>
          <Text style={[styles.tableHeaderText, { width: MANIFEST_COLUMNS.weight, textAlign: "right" }]}>Total {weightUnit}</Text>
          <Text style={[styles.tableHeaderText, { width: MANIFEST_COLUMNS.stack, textAlign: "center" }]}>Stack</Text>
          <Text style={[styles.tableHeaderText, { width: MANIFEST_COLUMNS.rotation, textAlign: "center" }]}>Rotate</Text>
          <Text style={[styles.tableHeaderText, { width: MANIFEST_COLUMNS.key, textAlign: "right" }]}>Key</Text>
        </View>
        {rows.map((row, index) => (
          <View key={`${row.name}-${index}`} style={[styles.tableRow, index % 2 ? styles.tableRowAlt : {}]} wrap={false}>
            <Text style={[styles.tableCellStrong, { width: MANIFEST_COLUMNS.name }]}>{row.name || "Unnamed cargo"}</Text>
            <Text style={[styles.tableCell, { width: MANIFEST_COLUMNS.qty, textAlign: "center" }]}>{row.qty}</Text>
            <Text style={[styles.tableCell, { width: MANIFEST_COLUMNS.dims, textAlign: "center" }]}>{fmtDimValue(row.l, metric)} x {fmtDimValue(row.w, metric)} x {fmtDimValue(row.h, metric)}</Text>
            <Text style={[styles.tableCell, { width: MANIFEST_COLUMNS.weight, textAlign: "right" }]}>{Math.round(row.totalWeight * (metric ? LB_TO_KG : 1)).toLocaleString()}</Text>
            <Text style={[styles.tableCell, { width: MANIFEST_COLUMNS.stack, textAlign: "center" }]}>{row.stackable ? "Yes" : "No"}</Text>
            <Text style={[styles.tableCell, { width: MANIFEST_COLUMNS.rotation, textAlign: "center" }]}>{row.rotation}</Text>
            <View style={{ width: MANIFEST_COLUMNS.key, alignItems: "flex-end" }}><View style={[styles.swatch, { backgroundColor: row.color }]} /></View>
          </View>
        ))}
        {pageIndex === pageCount - 1 ? (
          <View style={styles.totalsRow} wrap={false}>
            <Text style={[styles.tableCellStrong, { width: MANIFEST_COLUMNS.name, color: BRAND_BLUE }]}>Manifest totals</Text>
            <Text style={[styles.tableCellStrong, { width: MANIFEST_COLUMNS.qty, textAlign: "center" }]}>{totalQty}</Text>
            <Text style={[styles.tableCell, { width: MANIFEST_COLUMNS.dims }]}></Text>
            <Text style={[styles.tableCellStrong, { width: MANIFEST_COLUMNS.weight, textAlign: "right" }]}>{Math.round(totalWeight * (metric ? LB_TO_KG : 1)).toLocaleString()}</Text>
            <Text style={[styles.tableCell, { width: MANIFEST_COLUMNS.stack }]}></Text>
            <Text style={[styles.tableCell, { width: MANIFEST_COLUMNS.rotation }]}></Text>
            <Text style={[styles.tableCell, { width: MANIFEST_COLUMNS.key }]}></Text>
          </View>
        ) : null}
      </View>

      <ReportFooter brand={brand} />
    </Page>
  );
}

function balanceAppearance(status: ReturnType<typeof calculateContainerBalance>["status"]) {
  if (status === "balanced") return { label: "Well balanced", backgroundColor: "#dcfce7", color: "#15803d" };
  if (status === "caution") return { label: "Balance caution", backgroundColor: "#fef3c7", color: "#b45309" };
  if (status === "review") return { label: "Review balance", backgroundColor: "#ffe4e6", color: "#be123c" };
  return { label: "No weight data", backgroundColor: SLATE_100, color: SLATE_500 };
}

function ContainerPlanPage({
  plan,
  index,
  count,
  unitSystem,
  brand,
}: {
  plan: ContainerReportPlan;
  index: number;
  count: number;
  unitSystem: "imperial" | "metric";
  brand?: ContainerReportBrand;
}) {
  const { containerSpec, result } = plan;
  const metric = unitSystem === "metric";
  const balance = calculateContainerBalance(result.placed, containerSpec);
  const appearance = balanceAppearance(balance.status);
  const groups = Array.from(result.placed.reduce((map, box) => {
    const current = map.get(box.cargoId) ?? { name: box.cargoName || "Cargo", color: box.color, pieces: 0, weight: 0 };
    current.pieces += 1;
    current.weight += box.weight;
    map.set(box.cargoId, current);
    return map;
  }, new Map<string, { name: string; color: string; pieces: number; weight: number }>()).values());
  const planHeight = Math.max(130, Math.min(188, containerSpec.widthIn / containerSpec.lengthIn * 510));
  const dimText = `${fmtDim(containerSpec.lengthIn, metric)} x ${fmtDim(containerSpec.widthIn, metric)} x ${fmtDim(containerSpec.heightIn, metric)}`;

  return (
    <Page size="A4" style={styles.page}>
      <ReportHeader brand={brand} title={`Container ${index + 1} of ${count}`} subtitle={shorten(containerSpec.name, 42)} />

      <View style={styles.containerHero} wrap={false}>
        <ContainerIllustration container={containerSpec} style={styles.containerHeroIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Loading plan</Text>
          <Text style={styles.containerHeroLabel}>{plan.label || `Container ${index + 1}`}</Text>
          <Text style={styles.containerHeroType}>{containerSpec.name}</Text>
          <Text style={styles.containerHeroDims}>{dimText}</Text>
        </View>
      </View>

      <View style={styles.metricGrid}>
        <MetricCard label="Pieces assigned" value={String(result.piecesLoaded)} sub={result.unplaced.length ? "Exceptions require review" : "Assigned to this unit"} />
        <MetricCard label="Gross weight" value={fmtWeight(result.totalWeight, metric)} sub={`${result.weightUtil.toFixed(1)}% of payload`} />
        <MetricCard label="Cargo volume" value={fmtVolume(result.totalVolume, metric)} sub={`${result.volumeUtil.toFixed(1)}% of capacity`} />
        <MetricCard label="Load footprint" value={`${(result.containerFloorArea > 0 ? result.floorArea / result.containerFloorArea * 100 : 0).toFixed(1)}%`} sub="Projected floor use" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top-down loading plan</Text>
        <Text style={styles.sectionMeta}>Closed end at left - doors at right</Text>
      </View>
      <View style={styles.planFrame} wrap={false}>
        <Svg viewBox={`0 0 ${containerSpec.lengthIn} ${containerSpec.widthIn}`} style={{ width: "100%", height: planHeight }}>
          <Rect x={0} y={0} width={containerSpec.lengthIn} height={containerSpec.widthIn} rx={2} fill="#e9eff5" stroke="#475569" strokeWidth={1.5} />
          <Line x1={containerSpec.lengthIn / 2} y1={0} x2={containerSpec.lengthIn / 2} y2={containerSpec.widthIn} stroke="#cbd5e1" strokeWidth={0.7} strokeDasharray="4 3" />
          {[...result.placed].sort((a, b) => a.y - b.y).map((box, boxIndex) => (
            <Rect
              key={`${box.cargoId}-${boxIndex}`}
              x={box.x + 0.7}
              y={box.z + 0.7}
              width={Math.max(1, box.l - 1.4)}
              height={Math.max(1, box.w - 1.4)}
              rx={1}
              fill={box.color}
              fillOpacity={0.88}
              stroke="#ffffff"
              strokeWidth={0.8}
            />
          ))}
          <Line x1={containerSpec.lengthIn - 1.5} y1={1} x2={containerSpec.lengthIn - 1.5} y2={containerSpec.widthIn - 1} stroke={resolveContainerReportBrand(brand).accentColor} strokeWidth={2.2} strokeDasharray="5 3" />
          {result.placed.some((box) => box.weight > 0) ? (
            <>
              <Circle cx={balance.centerXIn} cy={balance.centerZIn} r={5} fill="#ffffff" stroke={BRAND_NAVY} strokeWidth={1.2} />
              <Circle cx={balance.centerXIn} cy={balance.centerZIn} r={2} fill={resolveContainerReportBrand(brand).accentColor} />
            </>
          ) : null}
        </Svg>
        <View style={styles.planLegend}>
          <Text style={styles.footerText}>Colored blocks: assigned cargo</Text>
          <Text style={styles.footerText}>Dashed blue line: doors | ring: calculated COG</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Cargo breakdown</Text>
        <Text style={styles.sectionMeta}>{groups.length} cargo type{groups.length === 1 ? "" : "s"}</Text>
      </View>
      <View style={styles.table} wrap={false}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: "54%" }]}>Cargo</Text>
          <Text style={[styles.tableHeaderText, { width: "14%", textAlign: "right" }]}>Pieces</Text>
          <Text style={[styles.tableHeaderText, { width: "25%", textAlign: "right" }]}>Weight</Text>
          <Text style={[styles.tableHeaderText, { width: "7%", textAlign: "right" }]}>Key</Text>
        </View>
        {groups.slice(0, 8).map((group, groupIndex) => (
          <View key={`${group.name}-${groupIndex}`} style={[styles.tableRow, groupIndex % 2 ? styles.tableRowAlt : {}]}>
            <Text style={[styles.tableCellStrong, { width: "54%" }]}>{group.name}</Text>
            <Text style={[styles.tableCell, { width: "14%", textAlign: "right" }]}>{group.pieces}</Text>
            <Text style={[styles.tableCell, { width: "25%", textAlign: "right" }]}>{fmtWeight(group.weight, metric)}</Text>
            <View style={{ width: "7%", alignItems: "flex-end" }}><View style={[styles.swatch, { backgroundColor: group.color }]} /></View>
          </View>
        ))}
      </View>

      <View style={styles.balancePanel} wrap={false}>
        <View style={[styles.balanceStatus, { backgroundColor: appearance.backgroundColor }]}>
          <Text style={[styles.balanceStatusText, { color: appearance.color }]}>{appearance.label}</Text>
        </View>
        <View style={styles.balanceMetric}>
          <Text style={styles.balanceLabel}>COG from closed end</Text>
          <Text style={styles.balanceValue}>{fmtDim(balance.centerXIn, metric)} ({balance.longitudinalPct.toFixed(0)}%)</Text>
        </View>
        <View style={styles.balanceMetric}>
          <Text style={styles.balanceLabel}>COG from Side A</Text>
          <Text style={styles.balanceValue}>{fmtDim(balance.centerZIn, metric)} ({balance.lateralPct.toFixed(0)}%)</Text>
        </View>
        <View style={styles.balanceMetric}>
          <Text style={styles.balanceLabel}>End weight split</Text>
          <Text style={styles.balanceValue}>{balance.closedEndWeightPct.toFixed(0)} / {balance.doorEndWeightPct.toFixed(0)}%</Text>
        </View>
      </View>

      {result.unplaced.length > 0 ? (
        <View style={styles.warning} wrap={false}>
          <Text style={styles.warningTitle}>Unplaced cargo requires review</Text>
          <Text style={styles.warningText}>{result.unplaced.map((item) => `${item.name}: ${item.qty}`).join(" | ")}</Text>
        </View>
      ) : null}

      <ReportFooter brand={brand} />
    </Page>
  );
}

const PLACEMENT_COLUMNS = {
  seq: "8%",
  cargo: "28%",
  position: "22%",
  dims: "23%",
  weight: "12%",
  rotation: "7%",
} as const;

function PlacementPage({
  plan,
  containerIndex,
  containerCount,
  rows,
  pageIndex,
  pageCount,
  unitSystem,
  brand,
}: {
  plan: ContainerReportPlan;
  containerIndex: number;
  containerCount: number;
  rows: { box: PlacedBox; sequence: number }[];
  pageIndex: number;
  pageCount: number;
  unitSystem: "imperial" | "metric";
  brand?: ContainerReportBrand;
}) {
  const metric = unitSystem === "metric";
  const dimUnit = metric ? "cm" : "in";
  return (
    <Page size="A4" style={styles.page}>
      <ReportHeader brand={brand} title={`Container ${containerIndex + 1} Placement List`} subtitle={`${plan.label} - page ${pageIndex + 1} of ${pageCount}`} />
      <Text style={styles.eyebrow}>Loading sequence</Text>
      <Text style={styles.pageTitle}>Item placement details</Text>
      <Text style={styles.pageIntro}>Sequence runs from the closed end toward the doors. Coordinates use the closed-end floor corner as the origin. Confirm the working sequence with the loading crew.</Text>

      <View style={styles.containerHero} wrap={false}>
        <ContainerIllustration container={plan.containerSpec} style={styles.containerHeroIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.containerHeroLabel}>{plan.label}</Text>
          <Text style={styles.containerHeroType}>{plan.containerSpec.name} - container {containerIndex + 1} of {containerCount}</Text>
          <Text style={styles.containerHeroDims}>{plan.result.piecesLoaded} assigned pieces | {fmtWeight(plan.result.totalWeight, metric)} | {plan.result.volumeUtil.toFixed(1)}% volume</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader} fixed>
          <Text style={[styles.tableHeaderText, { width: PLACEMENT_COLUMNS.seq }]}>Seq.</Text>
          <Text style={[styles.tableHeaderText, { width: PLACEMENT_COLUMNS.cargo }]}>Cargo</Text>
          <Text style={[styles.tableHeaderText, { width: PLACEMENT_COLUMNS.position }]}>X / Y / Z ({dimUnit})</Text>
          <Text style={[styles.tableHeaderText, { width: PLACEMENT_COLUMNS.dims }]}>L x W x H ({dimUnit})</Text>
          <Text style={[styles.tableHeaderText, { width: PLACEMENT_COLUMNS.weight, textAlign: "right" }]}>Weight</Text>
          <Text style={[styles.tableHeaderText, { width: PLACEMENT_COLUMNS.rotation, textAlign: "right" }]}>Rot.</Text>
        </View>
        {rows.map(({ box, sequence }, index) => (
          <View key={`${box.cargoId}-${sequence}`} style={[styles.tableRow, index % 2 ? styles.tableRowAlt : {}]} wrap={false}>
            <Text style={[styles.tableCellStrong, { width: PLACEMENT_COLUMNS.seq }]}>{sequence}</Text>
            <Text style={[styles.tableCellStrong, { width: PLACEMENT_COLUMNS.cargo }]}>{box.cargoName || "Unnamed cargo"}</Text>
            <Text style={[styles.tableCell, { width: PLACEMENT_COLUMNS.position }]}>{fmtDimValue(box.x, metric, 0)} / {fmtDimValue(box.y, metric, 0)} / {fmtDimValue(box.z, metric, 0)}</Text>
            <Text style={[styles.tableCell, { width: PLACEMENT_COLUMNS.dims }]}>{fmtDimValue(box.l, metric)} x {fmtDimValue(box.w, metric)} x {fmtDimValue(box.h, metric)}</Text>
            <Text style={[styles.tableCell, { width: PLACEMENT_COLUMNS.weight, textAlign: "right" }]}>{Math.round(box.weight * (metric ? LB_TO_KG : 1)).toLocaleString()}</Text>
            <Text style={[styles.tableCell, { width: PLACEMENT_COLUMNS.rotation, textAlign: "right" }]}>{box.rotation}</Text>
          </View>
        ))}
      </View>

      <View style={styles.warning} wrap={false}>
        <Text style={styles.warningTitle}>Practical loading note</Text>
        <Text style={styles.warningText}>This sequence is a planning aid. Forklift access, door clearance, blocking, bracing, lashing, cargo compatibility, and warehouse procedures govern the final loading method.</Text>
      </View>

      <ReportFooter brand={brand} />
    </Page>
  );
}

function SnapshotPage({
  containerSpec,
  images,
  brand,
}: Pick<PDFReportProps, "containerSpec" | "images" | "brand">) {
  const smallViews = [
    { label: "Top view", src: images.top },
    { label: "Side view", src: images.sideA },
    { label: "Doors view", src: images.front },
  ].filter((view) => view.src);
  if (!images.iso && smallViews.length === 0) return null;

  return (
    <Page size="A4" style={styles.page}>
      <ReportHeader brand={brand} title="Rendered Plan Views" subtitle={shorten(containerSpec.name, 45)} />
      <Text style={styles.eyebrow}>Visualization</Text>
      <Text style={styles.pageTitle}>Rendered loading plan</Text>
      <Text style={styles.pageIntro}>These images reproduce the active web visualization at export time. Use the top-down diagram and placement tables as the dimensional reference.</Text>

      {images.iso ? (
        <View wrap={false}>
          <Image src={images.iso} style={styles.snapshotLarge} />
          <Text style={styles.snapshotLabel}>Isometric loading-plan view</Text>
        </View>
      ) : null}
      {smallViews.length > 0 ? (
        <View style={styles.snapshotGrid} wrap={false}>
          {smallViews.map((view) => (
            <View key={view.label} style={{ flex: 1 }}>
              <Image src={view.src} style={styles.snapshotSmall} />
              <Text style={styles.snapshotLabel}>{view.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <ReportFooter brand={brand} />
    </Page>
  );
}

function PackingReportDocument(props: PDFReportProps) {
  const plans = props.containerPlans?.length
    ? props.containerPlans
    : [{ label: "Container 1", containerSpec: props.containerSpec, result: props.result }];
  const manifestPages = chunks(props.cargoRows, 12);

  return (
    <Document
      title={`Container Loading Report - ${resolveContainerReportBrand(props.brand).name}`}
      author={resolveContainerReportBrand(props.brand).name}
      subject="Container loading plan, cargo manifest, and placement details"
    >
      <OverviewPage {...props} />
      {manifestPages.map((rows, index) => (
        <CargoManifestPage
          key={`manifest-${index}`}
          rows={rows}
          allRows={props.cargoRows}
          pageIndex={index}
          pageCount={manifestPages.length}
          unitSystem={props.unitSystem}
          brand={props.brand}
        />
      ))}
      {plans.flatMap((plan, index) => {
        const ordered = [...plan.result.placed]
          .sort((a, b) => a.x - b.x || a.y - b.y || a.z - b.z)
          .map((box, sequenceIndex) => ({ box, sequence: sequenceIndex + 1 }));
        const placementPages = ordered.length ? chunks(ordered, 16) : [];
        return [
          <ContainerPlanPage
            key={`plan-${plan.containerSpec.id}-${index}`}
            plan={plan}
            index={index}
            count={plans.length}
            unitSystem={props.unitSystem}
            brand={props.brand}
          />,
          ...placementPages.map((rows, pageIndex) => (
            <PlacementPage
              key={`placement-${plan.containerSpec.id}-${index}-${pageIndex}`}
              plan={plan}
              containerIndex={index}
              containerCount={plans.length}
              rows={rows}
              pageIndex={pageIndex}
              pageCount={placementPages.length}
              unitSystem={props.unitSystem}
              brand={props.brand}
            />
          )),
        ];
      })}
      <SnapshotPage containerSpec={props.containerSpec} images={props.images} brand={props.brand} />
    </Document>
  );
}

export type { ContainerSpec, PlacedBox, LoadingResult, CargoSummaryRow, SnapshotImages, PDFReportProps };

export async function generatePackingReportBlob(props: PDFReportProps): Promise<Blob> {
  return pdf(<PackingReportDocument {...props} />).toBlob();
}

export function buildCargoSummaryRows(
  cargoItems: { name: string; quantity: number; length: number; width: number; height: number; weight: number; stackable: boolean; rotationMode: string; color: string; included: boolean }[],
): CargoSummaryRow[] {
  return cargoItems
    .filter((item) => item.included && item.quantity > 0)
    .map((item) => {
      const volumePerCuFt = cuInToCuFt(item.length * item.width * item.height);
      return {
        name: item.name || "Unnamed cargo",
        qty: item.quantity,
        l: item.length,
        w: item.width,
        h: item.height,
        weightPer: item.quantity > 0 ? item.weight / item.quantity : 0,
        totalWeight: item.weight,
        stackable: item.stackable,
        rotation: item.rotationMode === "all" ? "All" : item.rotationMode === "horizontal" ? "Horiz." : "Fixed",
        color: item.color,
        volPer: volumePerCuFt,
        totalVol: volumePerCuFt * item.quantity,
      };
    });
}
