import assert from "node:assert/strict";
import test from "node:test";
import {
  duplicateContainerProject,
  parseContainerDraft,
  parseContainerProjects,
  saveContainerProject,
  type ContainerProjectSnapshot,
} from "../../client/src/lib/containerProjects";

const snapshot: ContainerProjectSnapshot = {
  unitSystem: "imperial",
  containerSelectionMode: "manual",
  containerId: "40hc",
  customContainer: { lengthIn: 473.8, widthIn: 92.6, heightIn: 105.1, maxPayloadLbs: 58_420 },
  cargoItems: [{
    id: "cargo-1", name: "Pallet", length: 48, width: 48, height: 61, weight: 5_260, quantity: 7,
    color: "#0f766e", stackable: false, palletized: false, palletType: "none", customPalletL: 48,
    customPalletW: 40, customPalletH: 6, rotationMode: "horizontal", included: true, loadPriority: "normal",
  }],
  multiResult: null,
  activeResultContainer: 0,
};

test("saved loading projects round-trip through defensive storage parsing", () => {
  const saved = saveContainerProject([], snapshot, "Seven pallets", null, new Date("2026-09-07T12:00:00Z"));
  const parsed = parseContainerProjects(JSON.stringify(saved.projects));

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].name, "Seven pallets");
  assert.equal(parsed[0].snapshot.cargoItems[0].quantity, 7);
});

test("saving an existing loading project updates it instead of creating a duplicate", () => {
  const first = saveContainerProject([], snapshot, "First", null, new Date("2026-09-07T12:00:00Z"));
  const second = saveContainerProject(first.projects, snapshot, "Renamed", first.project.id, new Date("2026-09-07T13:00:00Z"));

  assert.equal(second.projects.length, 1);
  assert.equal(second.project.id, first.project.id);
  assert.equal(second.project.name, "Renamed");
  assert.equal(second.project.createdAt, first.project.createdAt);
});

test("duplicating a project creates an independent snapshot", () => {
  const original = saveContainerProject([], snapshot, "Plan", null, new Date("2026-09-07T12:00:00Z")).project;
  const copy = duplicateContainerProject(original, new Date("2026-09-07T13:00:00Z"));
  copy.snapshot.cargoItems[0].name = "Changed";

  assert.notEqual(copy.id, original.id);
  assert.equal(copy.name, "Plan (copy)");
  assert.equal(original.snapshot.cargoItems[0].name, "Pallet");
});

test("malformed projects and drafts are ignored", () => {
  assert.deepEqual(parseContainerProjects("not json"), []);
  assert.deepEqual(parseContainerProjects(JSON.stringify([{ id: "bad" }])), []);
  assert.equal(parseContainerDraft(JSON.stringify({ ...snapshot, cargoItems: [] })), null);
});
