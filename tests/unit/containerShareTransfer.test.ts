import assert from "node:assert/strict";
import test from "node:test";
import {
  createContainerShareTransfer,
  deriveCargoItemsFromSharedPlan,
  parseContainerShareTransfer,
  serializeContainerShareTransfer,
  type EditableSharedPlan,
} from "../../client/src/lib/containerShareTransfer";

const oldSharedPlan: EditableSharedPlan = {
  title: "Customer load plan",
  unitSystem: "imperial",
  token: "abcdefghijkl",
  containers: [{
    label: "1 × 40' Standard",
    container: {
      id: "40dc", name: "40' Standard (DC)", lengthIn: 473.8, widthIn: 92.6,
      heightIn: 94.2, maxPayloadLbs: 58_820, volumeCuFt: 2_390, tare: 8_333,
    },
    placed: [
      { cargoId: "pallet", cargoName: "Pallet", color: "#0f766e", x: 0, y: 0, z: 0, l: 40, w: 48, h: 61, weight: 750, rotation: "WLH", stackable: false },
      { cargoId: "pallet", cargoName: "Pallet", color: "#0f766e", x: 40, y: 0, z: 0, l: 40, w: 48, h: 61, weight: 750, rotation: "WLH", stackable: false },
    ],
  }],
};

test("older shared placements reconstruct editable cargo rows", () => {
  const cargo = deriveCargoItemsFromSharedPlan(oldSharedPlan);
  assert.equal(cargo.length, 1);
  assert.equal(cargo[0].length, 48);
  assert.equal(cargo[0].width, 40);
  assert.equal(cargo[0].quantity, 2);
  assert.equal(cargo[0].weight, 1_500);
});

test("shared plan copy preserves the exact placed layout", () => {
  const transfer = createContainerShareTransfer(oldSharedPlan);
  assert.equal(transfer.title, "Customer load plan — copy");
  assert.equal(transfer.sourceToken, "abcdefghijkl");
  assert.equal(transfer.snapshot.multiResult?.containers[0].result.placed[1].x, 40);
  assert.equal(transfer.snapshot.multiResult?.totalPiecesLoaded, 2);
  assert.equal(parseContainerShareTransfer(serializeContainerShareTransfer(transfer))?.snapshot.cargoItems[0].quantity, 2);
});

test("new share links use their exact editor settings", () => {
  const plan: EditableSharedPlan = {
    ...oldSharedPlan,
    editorState: {
      containerSelectionMode: "recommend",
      containerId: "40dc",
      customContainer: { lengthIn: 232, widthIn: 92, heightIn: 94, maxPayloadLbs: 60_000 },
      cargoItems: [{
        id: "source", name: "Original row", length: 48, width: 48, height: 61, weight: 5_260,
        quantity: 7, color: "#2563eb", stackable: false, palletized: false, palletType: "none",
        customPalletL: 48, customPalletW: 40, customPalletH: 6, rotationMode: "fixed",
        included: true, loadPriority: "first",
      }],
    },
  };
  const transfer = createContainerShareTransfer(plan);
  assert.equal(transfer.snapshot.containerSelectionMode, "recommend");
  assert.equal(transfer.snapshot.cargoItems[0].rotationMode, "fixed");
  assert.equal(transfer.snapshot.cargoItems[0].quantity, 7);
});
