import assert from "node:assert/strict";
import test from "node:test";
import { mergeImportedCargoItems } from "../../client/src/lib/containerImport";
import type { CargoItem } from "../../client/src/lib/containerPacking";

function cargo(overrides: Partial<CargoItem> = {}): CargoItem {
  return {
    id: "existing",
    name: "",
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    quantity: 1,
    color: "#475569",
    stackable: false,
    palletized: false,
    palletType: "none",
    customPalletL: 48,
    customPalletW: 40,
    customPalletH: 6,
    rotationMode: "horizontal",
    included: true,
    loadPriority: "normal",
    ...overrides,
  };
}

test("file import replaces blank starter rows and prefills every mapped cargo field", () => {
  let id = 0;
  const merged = mergeImportedCargoItems({
    previousItems: [cargo({ id: "blank-1" }), cargo({ id: "blank-2" })],
    importedRows: [{
      name: "Pallets",
      length: 121.92,
      width: 121.92,
      height: 154.94,
      weight: 5260,
      quantity: 7,
      stackable: true,
      rotationMode: "fixed",
      loadPriority: "first",
      palletized: true,
      include: true,
    }],
    units: "metric",
    defaults: {
      stackable: false,
      rotationMode: "horizontal",
      loadPriority: "normal",
      palletized: false,
      palletType: "none",
      customPalletL: 48,
      customPalletW: 40,
      customPalletH: 6,
    },
    colors: ["#0f766e"],
    createId: () => `imported-${++id}`,
  });

  assert.equal(merged.importedCount, 1);
  assert.equal(merged.items.length, 1);
  assert.equal(merged.items[0].id, "imported-1");
  assert.equal(merged.items[0].name, "Pallets");
  assert.ok(Math.abs(merged.items[0].length - 48) < 0.01);
  assert.ok(Math.abs(merged.items[0].width - 48) < 0.01);
  assert.ok(Math.abs(merged.items[0].height - 61) < 0.01);
  assert.ok(Math.abs(merged.items[0].weight - 11596.3) < 0.1);
  assert.equal(merged.items[0].quantity, 7);
  assert.equal(merged.items[0].stackable, true);
  assert.equal(merged.items[0].rotationMode, "fixed");
  assert.equal(merged.items[0].loadPriority, "first");
  assert.equal(merged.items[0].palletized, true);
  assert.equal(merged.items[0].included, true);
});

test("file import preserves meaningful existing rows and ignores unchecked rows", () => {
  const merged = mergeImportedCargoItems({
    previousItems: [cargo({ id: "kept", name: "Existing crate", length: 12, width: 10, height: 8 })],
    importedRows: [
      { name: "New box", length: 24, width: 18, height: 12, weight: 150, quantity: 10, include: true },
      { name: "Excluded", length: 1, width: 1, height: 1, weight: 1, quantity: 1, include: false },
    ],
    units: "imperial",
    defaults: {
      stackable: false,
      rotationMode: "horizontal",
      loadPriority: "normal",
      palletized: false,
      palletType: "none",
      customPalletL: 48,
      customPalletW: 40,
      customPalletH: 6,
    },
    colors: ["#0f766e", "#2563eb"],
    createId: () => "new",
  });

  assert.equal(merged.importedCount, 1);
  assert.deepEqual(merged.items.map((item) => item.name), ["Existing crate", "New box"]);
  assert.equal(merged.items[1].weight, 150);
  assert.equal(merged.items[1].quantity, 10);
});
