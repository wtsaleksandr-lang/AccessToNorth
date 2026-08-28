import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";

const IN_TO_CM = 2.54;
const LB_TO_KG = 0.453592;

const BRAND_NAVY = "#0f172a";
const BRAND_GREEN = "#16a34a";
const BRAND_GREEN_LIGHT = "#dcfce7";
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

interface PDFReportProps {
  containerSpec: ContainerSpec;
  cargoRows: CargoSummaryRow[];
  result: LoadingResult;
  totalContainers: number;
  unitSystem: "imperial" | "metric";
  images: SnapshotImages;
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
    backgroundColor: BRAND_NAVY,
    marginHorizontal: -28,
    marginTop: -28,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "column",
  },
  headerLogo: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 8,
    color: "#94a3b8",
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerTimestamp: {
    fontSize: 7,
    color: "#94a3b8",
  },
  headerTitle: {
    fontSize: 10,
    color: "#ffffff",
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

function ReportPage1({
  containerSpec,
  cargoRows,
  result,
  totalContainers,
  unitSystem,
  images,
}: PDFReportProps) {
  const isMetric = unitSystem === "metric";
  const dimUnit = isMetric ? "cm" : "in";
  const wtUnit = isMetric ? "kg" : "lbs";
  const volUnit = isMetric ? "m\u00B3" : "ft\u00B3";

  const totalQty = cargoRows.reduce((s, r) => s + r.qty, 0);
  const totalWt = cargoRows.reduce((s, r) => s + r.totalWeight, 0);
  const totalVolCuFt = cargoRows.reduce((s, r) => s + r.totalVol, 0);

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.headerBar} fixed>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLogo}>AccessToNorth.com</Text>
          <Text style={styles.headerSubtitle}>Canadian Import & Business Registration Services</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerTitle}>Container Packing Report</Text>
          <Text style={styles.headerTimestamp}>{new Date().toLocaleString()}</Text>
        </View>
      </View>

      {totalContainers > 1 && (
        <View style={styles.multiContainerBadge}>
          <Text style={styles.multiContainerText}>
            {totalContainers} containers required
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Container Summary</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Container</Text>
          <Text style={styles.summaryValue}>{containerSpec.name}</Text>
          <Text style={styles.summarySub}>
            {fmtDim(containerSpec.lengthIn, isMetric)} x {fmtDim(containerSpec.widthIn, isMetric)} x {fmtDim(containerSpec.heightIn, isMetric)}
          </Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Pieces Loaded</Text>
          <Text style={styles.summaryValue}>{result.piecesLoaded} / {result.piecesTotal}</Text>
          <Text style={styles.summarySub}>Max Payload: {fmtWt(containerSpec.maxPayloadLbs, isMetric)}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Weight Used</Text>
          <Text style={styles.summaryValue}>{result.weightUtil.toFixed(1)}%</Text>
          <Text style={styles.summarySub}>{fmtWt(result.totalWeight, isMetric)}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Volume Used</Text>
          <Text style={styles.summaryValue}>{result.volumeUtil.toFixed(1)}%</Text>
          <Text style={styles.summarySub}>{fmtVol(result.totalVolume, isMetric)}</Text>
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

      <Text style={styles.sectionTitle}>Isometric Load Plan</Text>
      <View style={styles.imageContainer}>
        {images.iso ? (
          <Image src={images.iso} style={styles.imageLarge} />
        ) : (
          <Text style={{ fontSize: 8, color: SLATE_500 }}>3D preview not available</Text>
        )}
        <Text style={styles.imageLabel}>
          Isometric view — {containerSpec.name} ({fmtDim(containerSpec.lengthIn, isMetric)} x {fmtDim(containerSpec.widthIn, isMetric)} x {fmtDim(containerSpec.heightIn, isMetric)})
        </Text>
      </View>

      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>Generated by AccessToNorth.com Container Loading Calculator</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </Page>
  );
}

function ReportPage2({
  containerSpec,
  unitSystem,
  images,
}: Pick<PDFReportProps, "containerSpec" | "unitSystem" | "images">) {
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
      <View style={styles.headerBar} fixed>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLogo}>AccessToNorth.com</Text>
          <Text style={styles.headerSubtitle}>Canadian Import & Business Registration Services</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerTitle}>Load Plan Views</Text>
          <Text style={styles.headerTimestamp}>{containerSpec.name} — {dimLabel}</Text>
        </View>
      </View>

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
        <Text style={styles.footerText}>Generated by AccessToNorth.com Container Loading Calculator</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </Page>
  );
}

function PackingReportDocument(props: PDFReportProps) {
  return (
    <Document title="Container Packing Report - AccessToNorth.com" author="AccessToNorth.com">
      <ReportPage1 {...props} />
      <ReportPage2 containerSpec={props.containerSpec} unitSystem={props.unitSystem} images={props.images} />
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
