import { describe, expect, it } from "vitest";
import { isAnomaly, updateBaseline } from "../src/anomaly/baseline";

describe("baseline", () => {
  it("builds a running mean", () => {
    let baseline = updateBaseline(null, 50);
    baseline = updateBaseline(baseline, 60);

    expect(baseline.meanMs).toBe(55);
    expect(baseline.samples).toBe(2);
  });

  it("detects a large latency increase", () => {
    const baseline = { meanMs: 50, samples: 100 };
    expect(isAnomaly(baseline, 160)).toBe(true);
    expect(isAnomaly(baseline, 80)).toBe(false);
  });
});
