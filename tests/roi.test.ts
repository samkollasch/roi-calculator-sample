import { describe, expect, it } from "vitest";

import {
  calculateAgentEquivalents,
  calculateHiringAvoidance,
  calculateProspectROI,
  calculateUnitEconomics,
} from "@/lib/calculations/roi";
import type { ProspectInputs } from "@/lib/calculations/roi.types";

const baseInputs: ProspectInputs = {
  agents: 25,
  costPerContact: 15,
  channelVolumes: {
    email: 2000,
    chat: 1000,
    voice: 1000,
    sms: 500,
  },
};

describe("calculateProspectROI", () => {
  it("returns a fully populated result for typical inputs", () => {
    const result = calculateProspectROI(baseInputs);

    expect(result.currentAnnualCost).toBeGreaterThan(0);
    expect(result.platformAnnualCost).toBeGreaterThan(0);
    expect(result.totalAnnualSavings).toBeGreaterThan(0);
    expect(result.savingsPercentage).toBeGreaterThan(0);
    expect(result.savingsPercentage).toBeLessThan(100);
    expect(result.channelBreakdown).toHaveLength(4);
    expect(result.sidekickMetrics.teamMultiplier).toBeGreaterThanOrEqual(1.1);
  });

  it("scales monthly volume to annual cost using cost-per-contact", () => {
    const result = calculateProspectROI(baseInputs);
    const totalMonthly = 2000 + 1000 + 1000 + 500;
    expect(result.monthlyVolume).toBe(totalMonthly);
    expect(result.currentAnnualCost).toBe(totalMonthly * 12 * baseInputs.costPerContact);
  });

  it("computes payback months from implementation cost and monthly savings", () => {
    const result = calculateProspectROI(baseInputs);
    expect(result.paybackMonths).toBeGreaterThan(0);
    expect(Number.isInteger(result.paybackMonths)).toBe(true);
  });

  it("attributes savings across the three buckets", () => {
    const result = calculateProspectROI(baseInputs);
    const sum =
      result.aiAutomationSavings +
      result.efficiencyImprovementSavings +
      result.duplicateReductionSavings;
    expect(sum).toBeCloseTo(result.totalAnnualSavings, 5);
  });

  it("allocates total savings across channels proportionally to raw savings", () => {
    const result = calculateProspectROI(baseInputs);
    const channelSum = result.channelBreakdown.reduce((acc, ch) => acc + ch.savings, 0);
    expect(channelSum).toBeCloseTo(result.totalAnnualSavings, 5);
  });

  it("handles zero-volume input without dividing by zero", () => {
    const result = calculateProspectROI({
      agents: 0,
      costPerContact: 0,
      channelVolumes: { email: 0, chat: 0, voice: 0, sms: 0 },
    });
    expect(result.totalAnnualSavings).toBe(0);
    expect(result.savingsPercentage).toBe(0);
    expect(result.paybackMonths).toBe(0);
    expect(result.sidekickMetrics.teamMultiplier).toBe(1.1);
  });

  it("respects optional efficiency overrides", () => {
    const baseline = calculateProspectROI(baseInputs);
    const tuned = calculateProspectROI({
      ...baseInputs,
      platformEfficiencyGain: 0.4,
    });
    expect(tuned.efficiencyImprovementSavings).toBeGreaterThan(
      baseline.efficiencyImprovementSavings,
    );
  });

  it("rounds AI deflection counts to whole conversations", () => {
    const result = calculateProspectROI(baseInputs);
    expect(Number.isInteger(result.conversationsDeflectedByAI)).toBe(true);
    expect(Number.isInteger(result.conversationsAssistedByAI)).toBe(true);
    expect(result.conversationsAssistedByAI).toBeLessThan(
      result.conversationsDeflectedByAI + result.conversationsAssistedByAI + 1,
    );
  });
});

describe("derived helpers", () => {
  it("calculateAgentEquivalents returns the rounded equivalent and additional headcount", () => {
    expect(calculateAgentEquivalents(2.1, 25)).toEqual({ equivalent: 53, additional: 28 });
  });

  it("calculateHiringAvoidance multiplies by salary and derives a monthly figure", () => {
    expect(calculateHiringAvoidance(10)).toEqual({ annual: 450000, monthly: 37500 });
  });

  it("calculateUnitEconomics expresses the reduction as a percentage", () => {
    expect(calculateUnitEconomics(15, 9)).toEqual({
      current: 15,
      new: 9,
      reduction: 40,
      multiplier: 15 / 9,
    });
  });

  it("calculateUnitEconomics returns safe defaults when either input is zero", () => {
    expect(calculateUnitEconomics(0, 9)).toMatchObject({ reduction: 0, multiplier: 0 });
  });
});
