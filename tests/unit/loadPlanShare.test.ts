import assert from "node:assert/strict";
import test from "node:test";
import { createSharedLoadPlanSchema } from "../../shared/loadPlanShare";

const validPlan = {
  title: "Seven pallet plan",
  unitSystem: "metric" as const,
  containers: [{
    label: "1 × 40' Standard",
    container: {
      id: "40dc",
      name: "40' Standard (DC)",
      lengthIn: 473.8,
      widthIn: 92.6,
      heightIn: 94.2,
      maxPayloadLbs: 58820,
      volumeCuFt: 2390,
      tare: 8333,
    },
    placed: [{
      cargoId: "pallets",
      cargoName: "Pallet",
      color: "#0f766e",
      x: 0,
      y: 0,
      z: 0,
      l: 48,
      w: 48,
      h: 61,
      weight: 1656.9,
      rotation: "LWH",
      stackable: false,
    }],
  }],
};

test("shared load-plan schema accepts a bounded read-only placement", () => {
  assert.equal(createSharedLoadPlanSchema.safeParse(validPlan).success, true);
});

test("shared load-plan schema rejects unsafe colours and unbounded dimensions", () => {
  const unsafe = structuredClone(validPlan);
  unsafe.containers[0].placed[0].color = "url(javascript:alert(1))";
  unsafe.containers[0].placed[0].l = 999_999;
  const parsed = createSharedLoadPlanSchema.safeParse(unsafe);
  assert.equal(parsed.success, false);
});

test("shared load-plan schema accepts bounded editable source data", () => {
  const editable = structuredClone(validPlan) as typeof validPlan & { editorState: Record<string, unknown> };
  editable.editorState = {
    containerSelectionMode: "recommend",
    containerId: "40dc",
    customContainer: { lengthIn: 473.8, widthIn: 92.6, heightIn: 94.2, maxPayloadLbs: 58_820 },
    cargoItems: [{
      id: "pallets", name: "Pallet", length: 48, width: 48, height: 61, weight: 11_596,
      quantity: 7, color: "#0f766e", stackable: false, palletized: false, palletType: "none",
      customPalletL: 48, customPalletW: 40, customPalletH: 6, rotationMode: "horizontal",
      included: true, loadPriority: "normal",
    }],
  };
  assert.equal(createSharedLoadPlanSchema.safeParse(editable).success, true);
});
