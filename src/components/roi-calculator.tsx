"use client";

import { useCallback, useMemo, useState } from "react";

import { calculateProspectROI } from "@/lib/calculations/roi";
import type { ProspectInputs } from "@/lib/calculations/roi.types";

import { AnimatedMetric } from "./animated-metric";
import { RoiDashboard } from "./roi-dashboard";
import { Button } from "./ui/button";
import { Container } from "./ui/container";
import { Dialog, DialogContent } from "./ui/dialog";
import { FormInput } from "./ui/form-input";

type ChannelKey = keyof ProspectInputs["channelVolumes"];
type TopLevelKey = "agents" | "costPerContact";

interface FieldConfig {
  key: TopLevelKey | ChannelKey;
  label: string;
  helperText?: string;
  min?: number;
  max?: number;
  step?: number;
  scope: "top" | "channel";
}

const FIELDS: FieldConfig[] = [
  {
    key: "agents",
    label: "Support agents on staff",
    helperText: "Headcount currently handling customer conversations.",
    min: 1,
    step: 1,
    scope: "top",
  },
  {
    key: "costPerContact",
    label: "Average cost per contact ($)",
    helperText: "Fully-loaded cost per conversation today.",
    min: 1,
    step: 0.5,
    scope: "top",
  },
  {
    key: "email",
    label: "Monthly email conversations",
    min: 0,
    step: 50,
    scope: "channel",
  },
  {
    key: "chat",
    label: "Monthly chat conversations",
    min: 0,
    step: 50,
    scope: "channel",
  },
  {
    key: "voice",
    label: "Monthly voice conversations",
    min: 0,
    step: 50,
    scope: "channel",
  },
  {
    key: "sms",
    label: "Monthly SMS conversations",
    min: 0,
    step: 50,
    scope: "channel",
  },
];

const DEFAULT_INPUTS: ProspectInputs = {
  agents: 25,
  costPerContact: 15,
  channelVolumes: {
    email: 2000,
    chat: 1000,
    voice: 1000,
    sms: 500,
  },
};

interface ROICalculatorProps {
  initialInputs?: ProspectInputs;
  /**
   * Called when the user submits the calculator. Useful for analytics; in the
   * production app this fired a Marketo lead-capture event.
   */
  onSubmit?: (inputs: ProspectInputs) => void;
}

export function ROICalculator({
  initialInputs = DEFAULT_INPUTS,
  onSubmit,
}: ROICalculatorProps) {
  const [inputs, setInputs] = useState<ProspectInputs>(initialInputs);
  const [showDashboard, setShowDashboard] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // `useMemo` keeps the ROI computation stable while the user is typing into
  // an unrelated field. The model is deterministic so this is a safe cache.
  const results = useMemo(() => calculateProspectROI(inputs), [inputs]);

  const handleFieldChange = useCallback(
    (config: FieldConfig, rawValue: string) => {
      const numericValue = Number(rawValue);
      if (Number.isNaN(numericValue)) return;

      setInputs((prev) => {
        if (config.scope === "channel") {
          return {
            ...prev,
            channelVolumes: {
              ...prev.channelVolumes,
              [config.key as ChannelKey]: numericValue,
            },
          };
        }
        return {
          ...prev,
          [config.key as TopLevelKey]: numericValue,
        };
      });
    },
    [],
  );

  const handleCalculate = () => {
    setIsDialogOpen(true);
  };

  const handleConfirm = () => {
    setIsDialogOpen(false);
    setShowDashboard(true);
    onSubmit?.(inputs);
  };

  const handleRestart = () => {
    setShowDashboard(false);
  };

  if (showDashboard) {
    return <RoiDashboard inputs={inputs} results={results} onRestart={handleRestart} />;
  }

  return (
    <>
      <div className="bg-brand-lightgrey">
        <Container className="flex flex-col gap-12 py-16">
          <header className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
            <span className="rounded-lg bg-tint-green px-3 py-1 text-xs font-semibold tracking-wide text-black uppercase">
              ROI Calculator
            </span>
            <h1 className="text-3xl font-bold text-neutral-900 md:text-5xl">
              See what AI-powered support could save your team
            </h1>
            <p className="max-w-xl text-neutral-600">
              Tell us a little about your contact center and we&apos;ll model the
              annual cost reduction, payback window, and agent hours
              automation could free up.
            </p>
          </header>

          <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
            <section
              aria-labelledby="inputs-heading"
              className="flex flex-col gap-6 rounded-lg bg-white p-6 shadow-sm"
            >
              <h2
                id="inputs-heading"
                className="text-lg font-semibold text-neutral-900"
              >
                Your team today
              </h2>
              <div className="flex flex-col gap-5">
                {FIELDS.map((field) => {
                  const value =
                    field.scope === "channel"
                      ? inputs.channelVolumes[field.key as ChannelKey]
                      : inputs[field.key as TopLevelKey];
                  return (
                    <FormInput
                      key={field.key}
                      label={field.label}
                      helperText={field.helperText}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={value}
                      onValueChange={(raw) => handleFieldChange(field, raw)}
                    />
                  );
                })}
              </div>
            </section>

            <section
              aria-labelledby="results-heading"
              className="flex flex-col items-center justify-center gap-6 rounded-lg bg-neutral-900 p-8 text-white"
            >
              <h2
                id="results-heading"
                className="text-sm font-semibold tracking-widest text-white/70 uppercase"
              >
                Estimated total savings
              </h2>
              <div className="text-5xl font-bold md:text-6xl">
                <AnimatedMetric
                  value={results.totalAnnualSavings}
                  format="currency"
                />
              </div>
              <div className="rounded-lg bg-tint-green px-3 py-1 text-sm font-semibold text-black">
                {Math.round(results.savingsPercentage)}% cost reduction
              </div>
              <p className="text-center text-sm text-white/70">
                Based on {inputs.agents} agents handling {results.monthlyVolume.toLocaleString()}{" "}
                conversations every month.
              </p>
              <Button onClick={handleCalculate} variant="secondary" className="w-fit">
                See my full ROI report
              </Button>
            </section>
          </div>
        </Container>
      </div>

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        ariaLabel="Confirm ROI report"
      >
        <DialogContent className="flex max-w-md flex-col gap-4 text-center">
          <h3 className="text-xl font-bold text-neutral-900">
            Your custom plan is ready
          </h3>
          <p className="text-sm text-neutral-600">
            See exactly how to capture{" "}
            {results.totalAnnualSavings.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            })}{" "}
            in savings — we&apos;ll walk you through the channel-by-channel breakdown.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="cancel" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} variant="primary">Show my report</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
