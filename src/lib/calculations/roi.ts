import type {
  ChannelBreakdownEntry,
  ProspectInputs,
  ProspectResults,
  SidekickMetrics,
} from "./roi.types";

/**
 * Fixed industry-standard assumptions used to translate prospect-supplied
 * volumes into projected savings. Kept in one place so the model is easy to
 * audit and so the test suite can exercise overrides without monkey-patching.
 */
export const ASSUMPTIONS = {
  hoursPerAgentYear: 2080,
  hourlyWage: 22,

  shrinkageRate: 0.3,
  utilizationRate: 0.7,
  occupancyRate: 0.85,

  platformLicensePerAgentMonth: 150,
  implementationCost: 10000,

  aiResolutionCost: 1.0,
  aiAssistCost: 0.5,

  aiAutomationRate: 0.55,
  aiResolutionRate: 0.3,
  aiAssistRate: 0.25,
  aiAssistTimeReduction: 0.25,

  aiAddressability: {
    email: 0.6,
    chat: 0.5,
    voice: 0.3,
    sms: 0.45,
  },

  platformEfficiencyGain: 0.2,
  duplicateReductionRate: 0.15,

  // Average handle time per channel, in seconds.
  aht: {
    email: 294,
    chat: 522,
    voice: 294,
    sms: 306,
  },

  // Wrap time per channel, in seconds.
  wrapTime: {
    email: 120,
    chat: 30,
    voice: 60,
    sms: 15,
  },
} as const;

type ChannelKey = keyof typeof ASSUMPTIONS.aht;

interface CurrentState {
  laborCost: number;
  totalCost: number;
  ftesNeeded: number;
  effectiveAgents: number;
  productiveHoursPerAgent: number;
  totalAnnualHours: number;
  totalAnnualVolume: number;
  totalMonthlyVolume: number;
}

interface PlatformState {
  laborCost: number;
  aiCost: number;
  totalCost: number;
  ftesNeeded: number;
  totalAnnualHours: number;
  productiveHoursPerAgent: number;
}

/**
 * Top-level entry point used by the React component. Returns a fully populated
 * `ProspectResults` object ready to be rendered as a dashboard.
 */
export function calculateProspectROI(inputs: ProspectInputs): ProspectResults {
  const wage = inputs.wage ?? ASSUMPTIONS.hourlyWage;
  const platformEfficiencyGain =
    inputs.platformEfficiencyGain ?? ASSUMPTIONS.platformEfficiencyGain;
  const duplicateReductionRate =
    inputs.duplicateReductionRate ?? ASSUMPTIONS.duplicateReductionRate;

  const currentState = calculateCurrentState(inputs);
  const platformState = calculatePlatformState(
    inputs,
    wage,
    duplicateReductionRate,
    platformEfficiencyGain,
  );

  const duplicateReductionSavings = calculateDuplicateReductionSavings(
    currentState,
    duplicateReductionRate,
    wage,
  );
  const aiAutomationSavings = calculateAIAutomationSavings(
    currentState,
    platformState,
    duplicateReductionRate,
    wage,
  );
  const efficiencyImprovementSavings = calculateEfficiencyImprovementSavings(
    currentState,
    duplicateReductionRate,
    wage,
    platformEfficiencyGain,
  );

  const totalAnnualSavings =
    duplicateReductionSavings + aiAutomationSavings + efficiencyImprovementSavings;

  const savingsPercentage = currentState.totalCost
    ? (totalAnnualSavings / currentState.totalCost) * 100
    : 0;

  const firstYearInvestment = platformState.totalCost + ASSUMPTIONS.implementationCost;
  const firstYearNetSavings = currentState.totalCost - firstYearInvestment;
  const roiPercentage = firstYearInvestment
    ? (firstYearNetSavings / firstYearInvestment) * 100
    : 0;

  const monthlySavings = totalAnnualSavings / 12;
  const paybackMonths =
    monthlySavings > 0 ? Math.ceil(ASSUMPTIONS.implementationCost / monthlySavings) : 0;

  const aiMetrics = calculateAIMetrics(inputs, duplicateReductionRate);

  const channelBreakdown = calculateChannelBreakdown(
    inputs,
    currentState,
    platformState,
    {
      aiAutomationSavings,
      efficiencyImprovementSavings,
      duplicateReductionSavings,
      totalAnnualSavings,
    },
    duplicateReductionRate,
    platformEfficiencyGain,
  );

  const sidekickMetrics = calculateSidekickMetrics(inputs);

  return {
    currentAnnualCost: currentState.totalCost,
    currentCostPerConversation: currentState.totalAnnualVolume
      ? currentState.totalCost / currentState.totalAnnualVolume
      : 0,
    platformAnnualCost: platformState.totalCost,
    platformCostPerConversation: currentState.totalAnnualVolume
      ? platformState.totalCost / currentState.totalAnnualVolume
      : 0,
    aiAutomationSavings,
    efficiencyImprovementSavings,
    duplicateReductionSavings,
    totalAnnualSavings,
    savingsPercentage,
    roiPercentage,
    paybackMonths,
    conversationsDeflectedByAI: Math.round(aiMetrics.totalDeflected),
    conversationsAssistedByAI: Math.round(aiMetrics.totalAssisted),
    agentHoursSaved: Math.round(aiMetrics.hoursSaved),
    channelBreakdown,
    sidekickMetrics,
    teamMultiplier: sidekickMetrics.teamMultiplier,
    monthlyVolume: currentState.totalMonthlyVolume,
  };
}

function calculateCurrentState(inputs: ProspectInputs): CurrentState {
  const { agents, channelVolumes, costPerContact } = inputs;

  const totalMonthlyVolume = Object.values(channelVolumes).reduce(
    (sum, value) => sum + Number(value),
    0,
  );
  const totalAnnualVolume = totalMonthlyVolume * 12;

  // Cost-to-serve model: total cost = volume × cost per contact.
  const totalCost = totalAnnualVolume * costPerContact;
  const laborCost = totalCost;

  let totalAnnualHours = 0;
  (Object.entries(channelVolumes) as [ChannelKey, number][]).forEach(
    ([channel, monthlyVolume]) => {
      const annualVolume = Number(monthlyVolume) * 12;
      const handleTimeSeconds = ASSUMPTIONS.aht[channel] + ASSUMPTIONS.wrapTime[channel];
      totalAnnualHours += (annualVolume * handleTimeSeconds) / 3600;
    },
  );

  const productiveHoursPerAgent = calculateProductiveHoursPerAgent();
  const ftesNeeded = productiveHoursPerAgent
    ? Math.ceil(totalAnnualHours / productiveHoursPerAgent)
    : 0;
  const effectiveAgents = Math.max(agents, ftesNeeded);

  return {
    laborCost,
    totalCost,
    ftesNeeded,
    effectiveAgents,
    productiveHoursPerAgent,
    totalAnnualHours,
    totalAnnualVolume,
    totalMonthlyVolume,
  };
}

function calculatePlatformState(
  inputs: ProspectInputs,
  wage: number,
  duplicateReductionRate: number,
  platformEfficiencyGain: number,
): PlatformState {
  const { channelVolumes } = inputs;

  let totalAnnualHours = 0;
  let totalAIResolutionCost = 0;
  let totalAIAssistCost = 0;

  (Object.entries(channelVolumes) as [ChannelKey, number][]).forEach(
    ([channel, monthlyVolume]) => {
      const annualVolume = Number(monthlyVolume) * 12 * (1 - duplicateReductionRate);

      const handleTimeSeconds = ASSUMPTIONS.aht[channel] + ASSUMPTIONS.wrapTime[channel];
      const aiAddressability = ASSUMPTIONS.aiAddressability[channel] ?? 0.4;

      const aiAddressableVolume = annualVolume * aiAddressability;
      const aiResolvedVolume = aiAddressableVolume * ASSUMPTIONS.aiResolutionRate;
      totalAIResolutionCost += aiResolvedVolume * ASSUMPTIONS.aiResolutionCost;

      const remainingAddressable = aiAddressableVolume - aiResolvedVolume;
      const aiAssistedVolume = remainingAddressable * ASSUMPTIONS.aiAssistRate;
      totalAIAssistCost += aiAssistedVolume * ASSUMPTIONS.aiAssistCost;

      const improvedHandleTime = handleTimeSeconds * (1 - platformEfficiencyGain);
      const assistedHandleTime = improvedHandleTime * (1 - ASSUMPTIONS.aiAssistTimeReduction);

      const regularVolume = annualVolume - aiResolvedVolume - aiAssistedVolume;
      const regularHours = (regularVolume * improvedHandleTime) / 3600;
      const assistedHours = (aiAssistedVolume * assistedHandleTime) / 3600;

      totalAnnualHours += regularHours + assistedHours;
    },
  );

  const productiveHoursPerAgent = calculateProductiveHoursPerAgent();
  const ftesNeeded = productiveHoursPerAgent
    ? Math.ceil(totalAnnualHours / productiveHoursPerAgent)
    : 0;

  const laborCost = ftesNeeded * wage * ASSUMPTIONS.hoursPerAgentYear;
  const platformLicenseCost = ftesNeeded * ASSUMPTIONS.platformLicensePerAgentMonth * 12;
  const aiCost = totalAIResolutionCost + totalAIAssistCost;
  const totalCost = laborCost + platformLicenseCost + aiCost;

  return {
    laborCost,
    aiCost,
    totalCost,
    ftesNeeded,
    totalAnnualHours,
    productiveHoursPerAgent,
  };
}

function calculateProductiveHoursPerAgent(): number {
  return (
    ASSUMPTIONS.hoursPerAgentYear *
    (1 - ASSUMPTIONS.shrinkageRate) *
    ASSUMPTIONS.utilizationRate *
    ASSUMPTIONS.occupancyRate
  );
}

function calculateDuplicateReductionSavings(
  currentState: CurrentState,
  duplicateReductionRate: number,
  wage: number,
): number {
  if (!currentState.productiveHoursPerAgent) return 0;
  const duplicateHours = currentState.totalAnnualHours * duplicateReductionRate;
  const duplicateFTEs = duplicateHours / currentState.productiveHoursPerAgent;
  return duplicateFTEs * wage * ASSUMPTIONS.hoursPerAgentYear;
}

function calculateAIAutomationSavings(
  currentState: CurrentState,
  platformState: PlatformState,
  duplicateReductionRate: number,
  wage: number,
): number {
  if (!currentState.productiveHoursPerAgent) return 0;
  const volumeAfterDuplicates = currentState.totalAnnualHours * (1 - duplicateReductionRate);
  const aiSavedHours = volumeAfterDuplicates - platformState.totalAnnualHours;
  const aiSavedFTEs = aiSavedHours / currentState.productiveHoursPerAgent;
  const aiLaborSavings = aiSavedFTEs * wage * ASSUMPTIONS.hoursPerAgentYear;
  return aiLaborSavings - platformState.aiCost;
}

function calculateEfficiencyImprovementSavings(
  currentState: CurrentState,
  duplicateReductionRate: number,
  wage: number,
  platformEfficiencyGain: number,
): number {
  if (!currentState.productiveHoursPerAgent) return 0;
  const baselineHoursAfterDuplicates =
    currentState.totalAnnualHours * (1 - duplicateReductionRate);
  const efficiencyHoursSaved = baselineHoursAfterDuplicates * platformEfficiencyGain;
  const efficiencyFTEs = efficiencyHoursSaved / currentState.productiveHoursPerAgent;
  // Attribute 70% of pure efficiency savings to platform — the remainder is
  // absorbed by AI and duplicate-reduction buckets.
  return efficiencyFTEs * wage * ASSUMPTIONS.hoursPerAgentYear * 0.7;
}

function calculateAIMetrics(inputs: ProspectInputs, duplicateReductionRate: number) {
  let totalDeflected = 0;
  let totalAssisted = 0;
  let hoursSaved = 0;

  (Object.entries(inputs.channelVolumes) as [ChannelKey, number][]).forEach(
    ([channel, monthlyVolume]) => {
      const annualVolume = Number(monthlyVolume) * 12;
      const volumeAfterDuplicates = annualVolume * (1 - duplicateReductionRate);
      const aiAddressability = ASSUMPTIONS.aiAddressability[channel] ?? 0.4;
      const aiAddressableVolume = volumeAfterDuplicates * aiAddressability;

      const channelDeflected = aiAddressableVolume * ASSUMPTIONS.aiResolutionRate;
      const channelAssisted =
        (aiAddressableVolume - channelDeflected) * ASSUMPTIONS.aiAssistRate;

      totalDeflected += channelDeflected;
      totalAssisted += channelAssisted;

      const handleTimeSeconds = ASSUMPTIONS.aht[channel] + ASSUMPTIONS.wrapTime[channel];
      const deflectedHours = (channelDeflected * handleTimeSeconds) / 3600;
      const assistedHoursSaved =
        (channelAssisted * handleTimeSeconds * ASSUMPTIONS.aiAssistTimeReduction) / 3600;

      hoursSaved += deflectedHours + assistedHoursSaved;
    },
  );

  return { totalDeflected, totalAssisted, hoursSaved };
}

function calculateChannelBreakdown(
  inputs: ProspectInputs,
  currentState: CurrentState,
  platformState: PlatformState,
  savings: {
    aiAutomationSavings: number;
    efficiencyImprovementSavings: number;
    duplicateReductionSavings: number;
    totalAnnualSavings: number;
  },
  duplicateReductionRate: number,
  platformEfficiencyGain: number,
): ChannelBreakdownEntry[] {
  const rawChannelData = (
    Object.entries(inputs.channelVolumes) as [ChannelKey, number][]
  ).map(([channel, monthlyVolume]) => {
    const annualVolume = Number(monthlyVolume) * 12;
    const handleTimeSeconds = ASSUMPTIONS.aht[channel] + ASSUMPTIONS.wrapTime[channel];

    const channelHours = (annualVolume * handleTimeSeconds) / 3600;
    const channelProportion = currentState.totalAnnualHours
      ? channelHours / currentState.totalAnnualHours
      : 0;
    const currentCost = currentState.totalCost * channelProportion;

    const volumeAfterDuplicates = annualVolume * (1 - duplicateReductionRate);
    const aiAddressability = ASSUMPTIONS.aiAddressability[channel] ?? 0.4;
    const aiAddressableVolume = volumeAfterDuplicates * aiAddressability;
    const aiResolvedVolume = aiAddressableVolume * ASSUMPTIONS.aiResolutionRate;
    const aiAssistedVolume =
      (aiAddressableVolume - aiResolvedVolume) * ASSUMPTIONS.aiAssistRate;
    const regularVolume = volumeAfterDuplicates - aiResolvedVolume - aiAssistedVolume;

    const improvedHandleTime = handleTimeSeconds * (1 - platformEfficiencyGain);
    const assistedHandleTime = improvedHandleTime * (1 - ASSUMPTIONS.aiAssistTimeReduction);

    const platformHours =
      (regularVolume * improvedHandleTime + aiAssistedVolume * assistedHandleTime) / 3600;
    const platformChannelProportion = platformState.totalAnnualHours
      ? platformHours / platformState.totalAnnualHours
      : 0;
    const platformCost = platformState.totalCost * platformChannelProportion;

    return {
      channel,
      channelName: channel.charAt(0).toUpperCase() + channel.slice(1),
      volume: annualVolume,
      currentCost,
      platformCost,
      rawSavings: currentCost - platformCost,
    };
  });

  const totalRawSavings = rawChannelData.reduce((sum, ch) => sum + ch.rawSavings, 0);

  if (savings.totalAnnualSavings > 0 && totalRawSavings > 0) {
    return rawChannelData.map((ch) => {
      const savingsProportion = ch.rawSavings / totalRawSavings;
      const allocatedSavings = savings.totalAnnualSavings * savingsProportion;
      return {
        channel: ch.channelName,
        volume: ch.volume,
        currentCost: ch.currentCost,
        platformCost: ch.currentCost - allocatedSavings,
        savings: allocatedSavings,
      };
    });
  }

  return rawChannelData.map((ch) => ({
    channel: ch.channelName,
    volume: ch.volume,
    currentCost: ch.currentCost,
    platformCost: ch.platformCost,
    savings: ch.rawSavings,
  }));
}

function calculateSidekickMetrics(inputs: ProspectInputs): SidekickMetrics {
  const { agents, channelVolumes } = inputs;

  if (agents <= 0) {
    return {
      currentTeamCapacity: 0,
      sidekickBoost: 0,
      teamMultiplier: 1.1,
      responseTime: 0.5,
      sidekickEquivalents: 0,
      enhancedCapacity: 0,
    };
  }

  const totalMonthlyVolume = Object.values(channelVolumes).reduce(
    (sum, value) => sum + Number(value),
    0,
  );

  const productiveHoursPerAgent = calculateProductiveHoursPerAgent();

  let weightedAHT = 0;
  let totalVolume = 0;
  (Object.entries(channelVolumes) as [ChannelKey, number][]).forEach(([channel, volume]) => {
    const aht = ASSUMPTIONS.aht[channel] + ASSUMPTIONS.wrapTime[channel];
    weightedAHT += aht * Number(volume);
    totalVolume += Number(volume);
  });
  const averageHandleTime = totalVolume > 0 ? weightedAHT / totalVolume : 360;

  const ticketsPerAgentPerMonth = ((productiveHoursPerAgent / 12) * 3600) / averageHandleTime;
  const currentTeamCapacity = Math.round(agents * ticketsPerAgentPerMonth);

  const sidekickResolutionRate = 0.35;
  const sidekickAssistRate = 0.3;
  const sidekickAssistEfficiency = 0.5;

  const sidekickFullResolution = totalMonthlyVolume * sidekickResolutionRate;
  const sidekickAssisted = totalMonthlyVolume * sidekickAssistRate * sidekickAssistEfficiency;
  const sidekickBoost = Math.round(sidekickFullResolution + sidekickAssisted);

  const enhancedCapacity = currentTeamCapacity + sidekickBoost;

  let teamMultiplier: number;
  if (totalMonthlyVolume > 0 && currentTeamCapacity > 0) {
    const utilizationRate = totalMonthlyVolume / currentTeamCapacity;
    if (utilizationRate < 0.5) {
      const workloadMultiplier = (totalMonthlyVolume + sidekickBoost) / totalMonthlyVolume;
      teamMultiplier = Number(workloadMultiplier.toFixed(2));
    } else {
      teamMultiplier = Number((enhancedCapacity / currentTeamCapacity).toFixed(2));
    }
    teamMultiplier = Math.max(teamMultiplier, 1.1);
  } else {
    teamMultiplier = 1.1;
  }

  const sidekickEquivalents =
    ticketsPerAgentPerMonth > 0 ? sidekickBoost / ticketsPerAgentPerMonth : 0;

  return {
    currentTeamCapacity,
    sidekickBoost,
    teamMultiplier,
    responseTime: 0.5,
    sidekickEquivalents,
    enhancedCapacity,
  };
}

export function calculateAgentEquivalents(multiplier: number, currentAgents: number) {
  const equivalent = Math.round(currentAgents * multiplier);
  const additional = equivalent - currentAgents;
  return { equivalent, additional };
}

export function calculateHiringAvoidance(additionalAgents: number, avgSalary = 45000) {
  const annual = additionalAgents * avgSalary;
  const monthly = Math.round(annual / 12);
  return { annual, monthly };
}

export function calculateUnitEconomics(
  currentCostPerContact: number,
  newCostPerConversation: number,
) {
  if (!currentCostPerContact || !newCostPerConversation) {
    return { current: currentCostPerContact, new: newCostPerConversation, reduction: 0, multiplier: 0 };
  }
  const reduction = 1 - newCostPerConversation / currentCostPerContact;
  return {
    current: currentCostPerContact,
    new: newCostPerConversation,
    reduction: Math.round(reduction * 100),
    multiplier: currentCostPerContact / newCostPerConversation,
  };
}
