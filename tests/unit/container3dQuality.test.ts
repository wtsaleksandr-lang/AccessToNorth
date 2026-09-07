import assert from "node:assert/strict";
import test from "node:test";
import { getContainerRenderProfile } from "../../client/src/lib/container3dQuality";

test("auto quality uses a lightweight profile on mobile", () => {
  const profile = getContainerRenderProfile({
    quality: "auto",
    viewportWidth: 390,
    devicePixelRatio: 3,
    itemCount: 21,
    deviceMemoryGb: 8,
    hardwareConcurrency: 8,
  });

  assert.equal(profile.performanceMode, true);
  assert.equal(profile.antialias, false);
  assert.equal(profile.shadows, false);
  assert.equal(profile.pixelRatio, 1.15);
  assert.equal(profile.detailedLabels, true);
});

test("large plans automatically disable expensive labels and shadows", () => {
  const profile = getContainerRenderProfile({
    quality: "auto",
    viewportWidth: 1440,
    devicePixelRatio: 2,
    itemCount: 300,
    deviceMemoryGb: 16,
    hardwareConcurrency: 12,
  });

  assert.equal(profile.performanceMode, true);
  assert.equal(profile.detailedLabels, false);
  assert.equal(profile.shadows, false);
});

test("quality override retains premium rendering within safe limits", () => {
  const profile = getContainerRenderProfile({
    quality: "quality",
    viewportWidth: 1440,
    devicePixelRatio: 3,
    itemCount: 60,
    deviceMemoryGb: 4,
    hardwareConcurrency: 4,
  });

  assert.equal(profile.performanceMode, false);
  assert.equal(profile.antialias, true);
  assert.equal(profile.pixelRatio, 2);
  assert.equal(profile.shadows, true);
});
