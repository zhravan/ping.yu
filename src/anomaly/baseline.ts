export interface Baseline {
  meanMs: number;
  samples: number;
}

export function updateBaseline(
  baseline: Baseline | null,
  latencyMs: number,
): Baseline {
  if (!baseline) return { meanMs: latencyMs, samples: 1 };

  const samples = baseline.samples + 1;
  return {
    meanMs: baseline.meanMs + (latencyMs - baseline.meanMs) / samples,
    samples,
  };
}

export function deviationRatio(baseline: Baseline, latencyMs: number): number {
  if (baseline.meanMs <= 0) return 0;
  return (latencyMs - baseline.meanMs) / baseline.meanMs;
}

export function isAnomaly(
  baseline: Baseline,
  latencyMs: number,
  threshold = 2,
): boolean {
  return deviationRatio(baseline, latencyMs) >= threshold;
}
