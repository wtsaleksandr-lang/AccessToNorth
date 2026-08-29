import type {
  CargoItem,
  LoadPriority,
  PalletType,
  RotationMode,
} from "./containerPacking";

const CM_TO_IN = 1 / 2.54;
const KG_TO_LB = 1 / 0.453592;

export interface ImportedCargoRow {
  name: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  quantity: number;
  stackable?: boolean;
  rotationMode?: RotationMode;
  loadPriority?: LoadPriority;
  palletized?: boolean;
  include: boolean;
}

export interface CargoImportDefaults {
  stackable: boolean;
  rotationMode: RotationMode;
  loadPriority: LoadPriority;
  palletized: boolean;
  palletType: PalletType;
  customPalletL: number;
  customPalletW: number;
  customPalletH: number;
}

export function mergeImportedCargoItems({
  previousItems,
  importedRows,
  units,
  defaults,
  colors,
  createId,
}: {
  previousItems: CargoItem[];
  importedRows: ImportedCargoRow[];
  units: "imperial" | "metric";
  defaults: CargoImportDefaults;
  colors: string[];
  createId: () => string;
}): { items: CargoItem[]; importedCount: number } {
  const retainedItems = previousItems.filter((item) => (
    item.name.trim() !== ""
    || item.length > 0
    || item.width > 0
    || item.height > 0
    || item.weight > 0
  ));
  const selectedRows = importedRows.filter((item) => (
    item.include && (item.length > 0 || item.width > 0 || item.height > 0)
  ));
  const metric = units === "metric";

  const importedItems: CargoItem[] = selectedRows.map((item, index) => ({
    id: createId(),
    name: item.name.trim() || `Imported item ${index + 1}`,
    length: metric ? item.length * CM_TO_IN : item.length,
    width: metric ? item.width * CM_TO_IN : item.width,
    height: metric ? item.height * CM_TO_IN : item.height,
    weight: metric ? item.weight * KG_TO_LB : item.weight,
    quantity: Math.max(1, Math.round(item.quantity || 1)),
    color: colors[(retainedItems.length + index) % colors.length],
    stackable: item.stackable ?? defaults.stackable,
    palletized: item.palletized ?? defaults.palletized,
    palletType: defaults.palletType,
    customPalletL: defaults.customPalletL,
    customPalletW: defaults.customPalletW,
    customPalletH: defaults.customPalletH,
    rotationMode: item.rotationMode ?? defaults.rotationMode,
    included: true,
    loadPriority: item.loadPriority ?? defaults.loadPriority,
  }));

  return {
    items: [...retainedItems, ...importedItems],
    importedCount: importedItems.length,
  };
}
