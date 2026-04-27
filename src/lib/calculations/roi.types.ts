/**
 * Inputs the user controls in the ROI calculator UI.
 * `wage` and `*Rate` overrides are optional and fall back to fixed assumptions
 * inside `calculateProspectROI`.
 */
export interface ProspectInputs {
  agents: number;
  costPerContact: number;
  channelVolumes: {
    email: number;
    chat: number;
    voice: number;
    sms: number;
  };
  wage?: number;
  aiAutomationRate?: number;
  platformEfficiencyGain?: number;
  duplicateReductionRate?: number;
}

export interface ChannelBreakdownEntry {
  channel: string;
  volume: number;
  currentCost: number;
  platformCost: number;
  savings: number;
}

export interface SidekickMetrics {
  currentTeamCapacity: number;
  sidekickBoost: number;
  teamMultiplier: number;
  responseTime: number;
  sidekickEquivalents: number;
  enhancedCapacity: number;
}

export interface ProspectResults {
  currentAnnualCost: number;
  currentCostPerConversation: number;

  platformAnnualCost: number;
  platformCostPerConversation: number;

  aiAutomationSavings: number;
  efficiencyImprovementSavings: number;
  duplicateReductionSavings: number;

  totalAnnualSavings: number;
  savingsPercentage: number;
  roiPercentage: number;
  paybackMonths: number;

  conversationsDeflectedByAI: number;
  conversationsAssistedByAI: number;
  agentHoursSaved: number;

  channelBreakdown: ChannelBreakdownEntry[];

  teamMultiplier: number;
  monthlyVolume: number;

  sidekickMetrics: SidekickMetrics;
}
