import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Svg,
  Rect,
  Path,
  Line,
  Circle,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { calculateContainerBalance } from "@/lib/containerBalance";

const IN_TO_CM = 2.54;
const LB_TO_KG = 0.453592;

const BRAND_NAVY = "#0f172a";
const BRAND_GREEN = "#0f7fe5";
const BRAND_GREEN_LIGHT = "#eaf5ff";
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
  /** Paid-account branding is supplied by the server after entitlement checks. */
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
  tagline: "Canadian Import & Business Registration Services",
  accentColor: "#0f7fe5",
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

function cuInToCuFt(cuIn: number) {
  return cuIn / 1728;
}

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 8,
    fontFamily: "Helvetica",
    color: SLATE_900,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
    marginHorizontal: -28,
    marginTop: -28,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 28,
    height: 28,
    marginRight: 8,
    borderRadius: 7,
  },
  headerBrandCopy: {
    flexDirection: "column",
  },
  headerWordmark: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  headerLogo: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: BRAND_NAVY,
    letterSpacing: 0.3,
  },
  headerDomain: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#0f7fe5",
  },
  headerSubtitle: {
    fontSize: 6.8,
    color: SLATE_500,
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerTimestamp: {
    fontSize: 7,
    color: SLATE_500,
  },
  headerTitle: {
    fontSize: 10,
    color: BRAND_NAVY,
    fontFamily: "Helvetica-Bold",
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: BRAND_GREEN,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_GREEN_LIGHT,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: SLATE_100,
    borderRadius: 4,
    padding: 8,
  },
  summaryLabel: {
    fontSize: 6.5,
    color: SLATE_500,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
  },
  summarySub: {
    fontSize: 6.5,
    color: SLATE_500,
    marginTop: 1,
  },
  table: {
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BRAND_NAVY,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tableHeaderText: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: SLATE_200,
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc",
  },
  tableCell: {
    fontSize: 7,
    color: SLATE_700,
  },
  tableCellBold: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
  },
  totalsRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: BRAND_GREEN_LIGHT,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  colorSwatch: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  imageContainer: {
    marginBottom: 12,
  },
  imageLarge: {
    width: "100%",
    borderRadius: 4,
    border: `1 solid ${SLATE_200}`,
  },
  imageLabel: {
    fontSize: 7,
    color: SLATE_500,
    textAlign: "center" as const,
    marginTop: 3,
  },
  smallImagesGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  smallImageWrapper: {
    flex: 1,
  },
  smallImage: {
    width: "100%",
    borderRadius: 3,
    border: `1 solid ${SLATE_200}`,
  },
  footer: {
    position: "absolute" as const,
    bottom: 16,
    left: 28,
    right: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: SLATE_200,
    paddingTop: 4,
  },
  footerText: {
    fontSize: 6,
    color: SLATE_500,
  },
  disclaimer: {
    fontSize: 5.5,
    color: "#94a3b8",
    textAlign: "center" as const,
    marginTop: 2,
  },
  multiContainerBadge: {
    backgroundColor: "#fef3c7",
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 10,
    alignSelf: "flex-start" as const,
  },
  multiContainerText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#92400e",
  },
  balancePanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    marginBottom: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 0.7,
    borderColor: SLATE_200,
    borderRadius: 4,
  },
  balanceStatus: {
    width: 88,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
  balanceStatusLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
  },
  balanceMetric: {
    flex: 1,
    borderLeftWidth: 0.5,
    borderLeftColor: SLATE_200,
    paddingLeft: 8,
  },
  balanceMetricLabel: {
    fontSize: 5.8,
    color: SLATE_500,
    textTransform: "uppercase" as const,
    marginBottom: 2,
  },
  balanceMetricValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
  },
  decisionBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 9,
    marginBottom: 12,
    borderRadius: 5,
    borderWidth: 0.8,
  },
  decisionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  decisionCopy: {
    fontSize: 6.8,
    color: SLATE_700,
    marginTop: 2,
  },
  operationalGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  operationalBox: {
    flex: 1,
    borderWidth: 0.7,
    borderColor: SLATE_200,
    borderRadius: 4,
    padding: 7,
  },
  operationalTitle: {
    fontFamily: "Helvetica-Bold",
    color: BRAND_NAVY,
    fontSize: 7.5,
    marginBottom: 4,
  },
  operationalLine: {
    color: SLATE_700,
    fontSize: 6.5,
    marginBottom: 2,
  },
  planFrame: {
    backgroundColor: "#f8fafc",
    borderWidth: 0.8,
    borderColor: SLATE_200,
    borderRadius: 5,
    padding: 10,
    marginBottom: 12,
  },
  planLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
});

const COL_WIDTHS = {
  name: 80,
  qty: 28,
  dims: 72,
  wPer: 40,
  wTot: 40,
  stack: 30,
  rot: 36,
  color: 20,
  volPer: 40,
  volTot: 42,
};

function fmtDim(v: number, isMetric: boolean) {
  if (isMetric) return `${(v * IN_TO_CM).toFixed(1)} cm`;
  return `${v.toFixed(1)}"`;
}

function fmtDimShort(v: number, isMetric: boolean) {
  if (isMetric) return `${(v * IN_TO_CM).toFixed(0)}`;
  return `${v.toFixed(1)}`;
}

function fmtWt(v: number, isMetric: boolean) {
  if (isMetric) return `${Math.round(v * LB_TO_KG).toLocaleString()} kg`;
  return `${Math.round(v).toLocaleString()} lbs`;
}

function fmtVol(v: number, isMetric: boolean) {
  if (isMetric) return `${(v * 0.0283168).toFixed(3)} m\u00B3`;
  return `${v.toFixed(1)} ft\u00B3`;
}

function fmtVolShort(cuFt: number, isMetric: boolean) {
  if (isMetric) return (cuFt * 0.0283168).toFixed(3);
  return cuFt.toFixed(1);
}

function ReportHeader({
  brand: brandInput,
  title,
  subtitle,
}: {
  brand?: ContainerReportBrand;
  title: string;
  subtitle: string;
}) {
  const brand = resolveContainerReportBrand(brandInput);
  return (
    <View style={styles.headerBar}>
      <View style={styles.headerLeft}>
        {brand.logoDataUrl ? (
          <Image src={brand.logoDataUrl} style={styles.headerIcon} />
        ) : (
          <Svg style={styles.headerIcon} viewBox="0 0 32 32">
            <Rect x="0" y="0" width="32" height="32" rx="8" fill={brand.accentColor} />
            <Path d="M16 6.5l8 3v6.2c0 5-3.3 8.8-8 10.1-4.7-1.3-8-5.1-8-10.1V9.5l8-3z" fill="none" stroke="#fff" strokeWidth="2" />
            <Path d="M12.1 16.1l2.6 2.6 5.4-5.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        )}
        <View style={styles.headerBrandCopy}>
          <View style={styles.headerWordmark}>
            <Text style={styles.headerLogo}>{brand.name}</Text>
            {brand.domainSuffix ? <Text style={[styles.headerDomain, { color: brand.accentColor }]}>{brand.domainSuffix}</Text> : null}
          </View>
          <Text style={styles.headerSubtitle}>{brand.tagline}</Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerTimestamp}>{subtitle}</Text>
      </View>
    </View>
  );
}

function ReportPage1({
  containerSpec,
  cargoRows,
  result,
  unitSystem,
  containerPlans,
  brand,
}: PDFReportProps) {
  const isMetric = unitSystem === "metric";
  const dimUnit = isMetric ? "cm" : "in";
  const wtUnit = isMetric ? "kg" : "lbs";
  const volUnit = isMetric ? "m\u00B3" : "ft\u00B3";

  const totalQty = cargoRows.reduce((s, r) => s + r.qty, 0);
  const totalWt = cargoRows.reduce((s, r) => s + r.totalWeight, 0);
  const totalVolCuFt = cargoRows.reduce((s, r) => s + r.totalVol, 0);
  const plans = containerPlans?.length
    ? containerPlans
    : [{ label: "Container 1", containerSpec, result }];
  const piecesLoaded = plans.reduce((sum, plan) => sum + plan.result.piecesLoaded, 0);
  const loadedWeight = plans.reduce((sum, plan) => sum + plan.result.totalWeight, 0);
  const payloadCapacity = plans.reduce((sum, plan) => sum + plan.result.maxPayload, 0);
  const loadedVolume = plans.reduce((sum, plan) => sum + plan.result.totalVolume, 0);
  const volumeCapacity = plans.reduce((sum, plan) => sum + plan.result.containerVolume, 0);
  const complete = piecesLoaded >= totalQty;
  const balance = calculateContainerBalance(result.placed, containerSpec);
  const balanceAppearance = balance.status === "balanced"
    ? { label: "Well balanced", backgroundColor: "#dcfce7", color: "#15803d" }
    : balance.status === "caution"
      ? { label: "Balance caution", backgroundColor: "#fef3c7", color: "#b45309" }
      : balance.status === "review"
        ? { label: "Review balance", backgroundColor: "#ffe4e6", color: "#be123c" }
        : { label: "No weight data", backgroundColor: SLATE_100, color: SLATE_500 };

  return (
    <Page size="A4" style={styles.page}>
      <ReportHeader brand={brand} title="Container Loading Report" subtitle={new Date().toLocaleString()} />

      <View style={[
        styles.decisionBanner,
        complete
          ? { backgroundColor: "#effaf4", borderColor: "#bbf7d0" }
          : { backgroundColor: "#fff7ed", borderColor: "#fed7aa" },
      ]}>
        <View>
          <Text style={[styles.decisionTitle, { color: complete ? "#15803d" : "#c2410c" }]}>
            {complete ? "Complete loading plan" : "Operator review required"}
          </Text>
          <Text style={styles.decisionCopy}>
            {complete
              ? `${piecesLoaded} of ${totalQty} pieces assigned across ${plans.length} container${plans.length === 1 ? "" : "s"}.`
              : `${Math.max(0, totalQty - piecesLoaded)} piece(s) remain unassigned. Review dimensions, orientation, or equipment.`}
          </Text>
        </View>
        <Text style={[styles.decisionTitle, { color: BRAND_NAVY }]}>{plans.length} × equipment</Text>
      </View>

      <Text style={styles.sectionTitle}>Executive Summary</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Equipment</Text>
          <Text style={styles.summaryValue}>{plans.length}</Text>
          <Text style={styles.summarySub}>{Array.from(new Set(plans.map((plan) => plan.containerSpec.name))).join(", ")}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Pieces Assigned</Text>
          <Text style={styles.summaryValue}>{piecesLoaded} / {totalQty}</Text>
          <Text style={styles.summarySub}>{complete ? "All cargo assigned" : "Unassigned cargo remains"}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Payload Used</Text>
          <Text style={styles.summaryValue}>{payloadCapacity > 0 ? (loadedWeight / payloadCapacity * 100).toFixed(1) : "0.0"}%</Text>
          <Text style={styles.summarySub}>{fmtWt(loadedWeight, isMetric)}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Volume Used</Text>
          <Text style={styles.summaryValue}>{volumeCapacity > 0 ? (loadedVolume / volumeCapacity * 100).toFixed(1) : "0.0"}%</Text>
          <Text style={styles.summarySub}>{fmtVol(loadedVolume, isMetric)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{plans.length > 1 ? "Selected Container Balance" : "Weight Balance"}</Text>
      <View style={styles.balancePanel}>
        <View style={[styles.balanceStatus, { backgroundColor: balanceAppearance.backgroundColor }]}>
          <Text style={[styles.balanceStatusLabel, { color: balanceAppearance.color }]}>{balanceAppearance.label}</Text>
        </View>
        <View style={styles.balanceMetric}>
          <Text style={styles.balanceMetricLabel}>CG from closed end</Text>
          <Text style={styles.balanceMetricValue}>{fmtDim(balance.centerXIn, isMetric)} ({balance.longitudinalPct.toFixed(0)}%)</Text>
        </View>
        <View style={styles.balanceMetric}>
          <Text style={styles.balanceMetricLabel}>Lateral CG from Side A</Text>
          <Text style={styles.balanceMetricValue}>{fmtDim(balance.centerZIn, isMetric)} ({balance.lateralPct.toFixed(0)}%)</Text>
        </View>
        <View style={styles.balanceMetric}>
          <Text style={styles.balanceMetricLabel}>Weight split</Text>
          <Text style={styles.balanceMetricValue}>{balance.closedEndWeightPct.toFixed(0)} / {balance.doorEndWeightPct.toFixed(0)}%</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Cargo Manifest</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: COL_WIDTHS.name }]}>Item</Text>
          <Text style={[styles.tableHeaderText, { width: COL_WIDTHS.qty, textAlign: "center" }]}>Qty</Text>
          <Text style={[styles.tableHeaderText, { width: COL_WIDTHS.dims, textAlign: "center" }]}>L x W x H ({dimUnit})</Text>
          <Text style={[styles.tableHeaderText, { width: COL_WIDTHS.wPer, textAlign: "right" }]}>{wtUnit}/pc</Text>
          <Text style={[styles.tableHeaderText, { width: COL_WIDTHS.wTot, textAlign: "right" }]}>Tot {wtUnit}</Text>
          <Text style={[styles.tableHeaderText, { width: COL_WIDTHS.stack, textAlign: "center" }]}>Stack</Text>
          <Text style={[styles.tableHeaderText, { width: COL_WIDTHS.rot, textAlign: "center" }]}>Rot.</Text>
          <Text style={[styles.tableHeaderText, { width: COL_WIDTHS.color, textAlign: "center" }]}></Text>
          <Text style={[styles.tableHeaderText, { width: COL_WIDTHS.volTot, textAlign: "right" }]}>Vol ({volUnit})</Text>
        </View>

        {cargoRows.map((row, i) => {
          const wtF = isMetric ? LB_TO_KG : 1;
          return (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCellBold, { width: COL_WIDTHS.name }]}>{row.name.substring(0, 28)}</Text>
              <Text style={[styles.tableCell, { width: COL_WIDTHS.qty, textAlign: "center" }]}>{row.qty}</Text>
              <Text style={[styles.tableCell, { width: COL_WIDTHS.dims, textAlign: "center" }]}>
                {fmtDimShort(row.l, isMetric)} x {fmtDimShort(row.w, isMetric)} x {fmtDimShort(row.h, isMetric)}
              </Text>
              <Text style={[styles.tableCell, { width: COL_WIDTHS.wPer, textAlign: "right" }]}>{(row.weightPer * wtF).toFixed(0)}</Text>
              <Text style={[styles.tableCell, { width: COL_WIDTHS.wTot, textAlign: "right" }]}>{(row.totalWeight * wtF).toFixed(0)}</Text>
              <Text style={[styles.tableCell, { width: COL_WIDTHS.stack, textAlign: "center" }]}>{row.stackable ? "Yes" : "No"}</Text>
              <Text style={[styles.tableCell, { width: COL_WIDTHS.rot, textAlign: "center" }]}>{row.rotation}</Text>
              <View style={[{ width: COL_WIDTHS.color, alignItems: "center", justifyContent: "center" }]}>
                <View style={[styles.colorSwatch, { backgroundColor: row.color }]} />
              </View>
              <Text style={[styles.tableCell, { width: COL_WIDTHS.volTot, textAlign: "right" }]}>{fmtVolShort(row.totalVol, isMetric)}</Text>
            </View>
          );
        })}

        <View style={styles.totalsRow}>
          <Text style={[styles.tableCellBold, { width: COL_WIDTHS.name, color: BRAND_GREEN }]}>TOTALS</Text>
          <Text style={[styles.tableCellBold, { width: COL_WIDTHS.qty, textAlign: "center" }]}>{totalQty}</Text>
          <Text style={[styles.tableCell, { width: COL_WIDTHS.dims }]}></Text>
          <Text style={[styles.tableCell, { width: COL_WIDTHS.wPer }]}></Text>
          <Text style={[styles.tableCellBold, { width: COL_WIDTHS.wTot, textAlign: "right" }]}>{(totalWt * (isMetric ? LB_TO_KG : 1)).toFixed(0)}</Text>
          <Text style={[styles.tableCell, { width: COL_WIDTHS.stack }]}></Text>
          <Text style={[styles.tableCell, { width: COL_WIDTHS.rot }]}></Text>
          <Text style={[styles.tableCell, { width: COL_WIDTHS.color }]}></Text>
          <Text style={[styles.tableCellBold, { width: COL_WIDTHS.volTot, textAlign: "right" }]}>{fmtVolShort(totalVolCuFt, isMetric)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Loading &amp; Handover Checks</Text>
      <View style={styles.operationalGrid} wrap={false}>
        <View style={styles.operationalBox}>
          <Text style={styles.operationalTitle}>Before loading</Text>
          <Text style={styles.operationalLine}>- Confirm actual container and door dimensions</Text>
          <Text style={styles.operationalLine}>- Check floor point loads and lifting access</Text>
          <Text style={styles.operationalLine}>- Confirm cargo compatibility and orientation</Text>
        </View>
        <View style={styles.operationalBox}>
          <Text style={styles.operationalTitle}>Securement</Text>
          <Text style={styles.operationalLine}>- Engineer blocking, bracing, and lashing separately</Text>
          <Text style={styles.operationalLine}>- Keep practical forklift and unloading access</Text>
          <Text style={styles.operationalLine}>- Treat calculated COG as guidance, not a loading rule</Text>
        </View>
        <View style={styles.operationalBox}>
          <Text style={styles.operationalTitle}>Sign-off</Text>
          <Text style={styles.operationalLine}>- Verify final count and gross cargo weight</Text>
          <Text style={styles.operationalLine}>- Photograph the final secured load</Text>
          <Text style={styles.operationalLine}>- Obtain carrier / warehouse approval</Text>
        </View>
      </View>

      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>Generated by {resolveContainerReportBrand(brand).name}{resolveContainerReportBrand(brand).domainSuffix} Container Loading Calculator</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </Page>
  );
}

function ReportPage2({
  containerSpec,
  unitSystem,
  images,
  brand,
}: Pick<PDFReportProps, "containerSpec" | "unitSystem" | "images" | "brand">) {
  const isMetric = unitSystem === "metric";
  const dimLabel = `${fmtDim(containerSpec.lengthIn, isMetric)} x ${fmtDim(containerSpec.widthIn, isMetric)} x ${fmtDim(containerSpec.heightIn, isMetric)}`;

  const views = [
    { label: "Top View (Plan)", src: images.top },
    { label: "Right Side View", src: images.sideA },
    { label: "Front / Doors View", src: images.front },
  ].filter((v) => v.src);

  if (views.length === 0) return null;

  return (
    <Page size="A4" style={styles.page}>
      <ReportHeader brand={brand} title="Rendered Load Plan Views" subtitle={`${containerSpec.name} - ${dimLabel}`} />

      <Text style={styles.sectionTitle}>Additional Load Plan Views</Text>

      {views.map((v, i) => (
        <View key={i} style={{ marginBottom: 16 }}>
          <Image src={v.src} style={{ width: "100%", borderRadius: 4, border: `1 solid ${SLATE_200}` }} />
          <Text style={styles.imageLabel}>{v.label}</Text>
        </View>
      ))}

      <View style={{ marginTop: "auto", paddingTop: 8, borderTopWidth: 0.5, borderTopColor: SLATE_200 }}>
        <Text style={styles.disclaimer}>
          Estimates only. Actual loading may vary. Always verify packing plans with your carrier, freight forwarder, or warehouse operator before shipping.
        </Text>
      </View>

      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>Generated by {resolveContainerReportBrand(brand).name}{resolveContainerReportBrand(brand).domainSuffix} Container Loading Calculator</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </Page>
  );
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
  const isMetric = unitSystem === "metric";
  const balance = calculateContainerBalance(result.placed, containerSpec);
  const cargoGroups = Array.from(result.placed.reduce((groups, box) => {
    const current = groups.get(box.cargoName) ?? { name: box.cargoName, color: box.color, pieces: 0, weight: 0 };
    current.pieces += 1;
    current.weight += box.weight;
    groups.set(box.cargoName, current);
    return groups;
  }, new Map<string, { name: string; color: string; pieces: number; weight: number }>()).values());
  const ordered = [...result.placed].sort((a, b) => a.x - b.x || a.y - b.y || a.z - b.z);
  const planHeight = Math.max(112, Math.min(200, containerSpec.widthIn / containerSpec.lengthIn * 470));

  return (
    <Page size="A4" style={styles.page}>
      <ReportHeader brand={brand} title={`Container ${index + 1} of ${count}`} subtitle={containerSpec.name} />

      <Text style={styles.sectionTitle}>Equipment &amp; Utilization</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Container</Text>
          <Text style={styles.summaryValue}>{plan.label}</Text>
          <Text style={styles.summarySub}>{containerSpec.name}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Pieces</Text>
          <Text style={styles.summaryValue}>{result.piecesLoaded}</Text>
          <Text style={styles.summarySub}>{result.unplaced.length ? "Review unplaced cargo" : "Assigned to this unit"}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Payload</Text>
          <Text style={styles.summaryValue}>{result.weightUtil.toFixed(1)}%</Text>
          <Text style={styles.summarySub}>{fmtWt(result.totalWeight, isMetric)}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Volume</Text>
          <Text style={styles.summaryValue}>{result.volumeUtil.toFixed(1)}%</Text>
          <Text style={styles.summarySub}>{fmtVol(result.totalVolume, isMetric)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Top-Down Loading Plan</Text>
      <View style={styles.planFrame} wrap={false}>
        <Svg viewBox={`0 0 ${containerSpec.lengthIn} ${containerSpec.widthIn}`} style={{ width: "100%", height: planHeight }}>
          <Rect x={0} y={0} width={containerSpec.lengthIn} height={containerSpec.widthIn} rx={2} fill="#eef3f8" stroke="#64748b" strokeWidth={1.5} />
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
              fillOpacity={0.84}
              stroke="#ffffff"
              strokeWidth={0.7}
            />
          ))}
          <Line x1={containerSpec.lengthIn - 1.5} y1={1} x2={containerSpec.lengthIn - 1.5} y2={containerSpec.widthIn - 1} stroke={resolveContainerReportBrand(brand).accentColor} strokeWidth={2} strokeDasharray="5 3" />
          {result.placed.some((box) => box.weight > 0) ? (
            <>
              <Circle cx={balance.centerXIn} cy={balance.centerZIn} r={5} fill="#ffffff" stroke="#0f172a" strokeWidth={1.2} />
              <Circle cx={balance.centerXIn} cy={balance.centerZIn} r={2} fill={resolveContainerReportBrand(brand).accentColor} />
            </>
          ) : null}
        </Svg>
        <View style={styles.planLegend}>
          <Text style={styles.footerText}>Closed end - load from this end toward doors</Text>
          <Text style={styles.footerText}>Dashed line: doors | ring: calculated COG</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Cargo Allocation</Text>
      <View style={styles.table} wrap={false}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: "48%" }]}>Cargo</Text>
          <Text style={[styles.tableHeaderText, { width: "16%", textAlign: "right" }]}>Pieces</Text>
          <Text style={[styles.tableHeaderText, { width: "24%", textAlign: "right" }]}>Weight</Text>
          <Text style={[styles.tableHeaderText, { width: "12%", textAlign: "right" }]}>Key</Text>
        </View>
        {cargoGroups.map((group, groupIndex) => (
          <View key={group.name} style={[styles.tableRow, groupIndex % 2 ? styles.tableRowAlt : {}]}>
            <Text style={[styles.tableCellBold, { width: "48%" }]}>{group.name}</Text>
            <Text style={[styles.tableCell, { width: "16%", textAlign: "right" }]}>{group.pieces}</Text>
            <Text style={[styles.tableCell, { width: "24%", textAlign: "right" }]}>{fmtWt(group.weight, isMetric)}</Text>
            <View style={{ width: "12%", alignItems: "flex-end" }}><View style={[styles.colorSwatch, { backgroundColor: group.color }]} /></View>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Loading Sequence Snapshot</Text>
      <Text style={{ fontSize: 6.8, color: SLATE_500, marginBottom: 5 }}>
        Sequence is ordered from the closed end toward the doors. Confirm the working sequence with the loading crew and secure each zone before advancing.
      </Text>
      <View style={styles.table} wrap={false}>
        {ordered.slice(0, 14).map((box, sequenceIndex) => (
          <View key={`${box.cargoId}-${sequenceIndex}`} style={[styles.tableRow, sequenceIndex % 2 ? styles.tableRowAlt : {}]}>
            <Text style={[styles.tableCellBold, { width: "9%" }]}>{sequenceIndex + 1}</Text>
            <Text style={[styles.tableCell, { width: "35%" }]}>{box.cargoName}</Text>
            <Text style={[styles.tableCell, { width: "32%" }]}>X {fmtDim(box.x, isMetric)} | Z {fmtDim(box.z, isMetric)}</Text>
            <Text style={[styles.tableCell, { width: "24%", textAlign: "right" }]}>{fmtDim(box.l, isMetric)} long</Text>
          </View>
        ))}
        {ordered.length > 14 ? (
          <Text style={{ fontSize: 6.5, color: SLATE_500, paddingTop: 4 }}>+ {ordered.length - 14} additional placements; use the detailed digital plan for item-level inspection.</Text>
        ) : null}
      </View>

      <View style={[styles.balancePanel, { marginTop: 2 }]} wrap={false}>
        <View style={styles.balanceMetric}>
          <Text style={styles.balanceMetricLabel}>Calculated COG</Text>
          <Text style={styles.balanceMetricValue}>{fmtDim(balance.centerXIn, isMetric)} from closed end | {fmtDim(balance.centerZIn, isMetric)} from Side A</Text>
        </View>
        <View style={styles.balanceMetric}>
          <Text style={styles.balanceMetricLabel}>Practical note</Text>
          <Text style={{ fontSize: 6.2, color: SLATE_700 }}>Balance targets can conflict with bracing, access, and unloading. Final securement governs.</Text>
        </View>
      </View>

      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>Planning report - verify dimensions, placement, and securement before loading</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </Page>
  );
}

function PackingReportDocument(props: PDFReportProps) {
  const plans = props.containerPlans?.length
    ? props.containerPlans
    : [{ label: "Container 1", containerSpec: props.containerSpec, result: props.result }];
  return (
    <Document title={`Container Loading Report - ${resolveContainerReportBrand(props.brand).name}`} author={resolveContainerReportBrand(props.brand).name}>
      <ReportPage1 {...props} />
      {plans.map((plan, index) => (
        <ContainerPlanPage
          key={`${plan.containerSpec.id}-${index}`}
          plan={plan}
          index={index}
          count={plans.length}
          unitSystem={props.unitSystem}
          brand={props.brand}
        />
      ))}
      <ReportPage2 containerSpec={props.containerSpec} unitSystem={props.unitSystem} images={props.images} brand={props.brand} />
    </Document>
  );
}

export type { ContainerSpec, PlacedBox, LoadingResult, CargoSummaryRow, SnapshotImages, PDFReportProps };

export async function generatePackingReportBlob(props: PDFReportProps): Promise<Blob> {
  const doc = <PackingReportDocument {...props} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

export function buildCargoSummaryRows(
  cargoItems: { name: string; quantity: number; length: number; width: number; height: number; weight: number; stackable: boolean; rotationMode: string; color: string; included: boolean }[]
): CargoSummaryRow[] {
  const includedItems = cargoItems.filter((c) => c.included && c.quantity > 0);
  return includedItems.map((item) => {
    const volPerCuFt = cuInToCuFt(item.length * item.width * item.height);
    return {
      name: item.name || "Unnamed",
      qty: item.quantity,
      l: item.length,
      w: item.width,
      h: item.height,
      weightPer: item.quantity > 0 ? item.weight / item.quantity : 0,
      totalWeight: item.weight,
      stackable: item.stackable,
      rotation: item.rotationMode === "all" ? "All" : item.rotationMode === "horizontal" ? "Horiz." : "Fixed",
      color: item.color,
      volPer: volPerCuFt,
      totalVol: volPerCuFt * item.quantity,
    };
  });
}
