"use client";

import type { ProspectInputs, ProspectResults } from "@/lib/calculations/roi.types";
import { Container } from "./ui/container";
import { Button } from "./ui/button";
import { AnimatedMetric } from "./animated-metric";

interface RoiDashboardProps {
  inputs: ProspectInputs;
  results: ProspectResults;
  onRestart: () => void;
}

const currency = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export function RoiDashboard({ inputs, results, onRestart }: RoiDashboardProps) {
  return (
    <Container className="my-12 flex flex-col gap-8">
      <div className="flex flex-col gap-2 text-center">
        <p className="text-sm font-semibold tracking-wide text-brand-primary uppercase">
          Your ROI report
        </p>
        <h2 className="text-3xl font-bold text-neutral-900 md:text-5xl">
          Estimated annual savings
        </h2>
        <div className="mx-auto rounded-full bg-tint-green px-4 py-2 text-3xl font-semibold text-black md:text-5xl">
          <AnimatedMetric value={results.totalAnnualSavings} format="currency" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat
          label="Cost reduction"
          value={`${Math.round(results.savingsPercentage)}%`}
          helper="vs your current spend"
        />
        <Stat
          label="Payback period"
          value={
            results.paybackMonths
              ? `${results.paybackMonths} ${results.paybackMonths === 1 ? "month" : "months"}`
              : "n/a"
          }
          helper="time to recoup setup costs"
        />
        <Stat
          label="Agent hours saved"
          value={results.agentHoursSaved.toLocaleString()}
          helper="per year, automated by AI"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card title="Today">
          <Row label="Annual contact-center cost" value={currency(results.currentAnnualCost)} />
          <Row
            label="Cost per conversation"
            value={currency(results.currentCostPerConversation)}
          />
          <Row label="Monthly volume" value={results.monthlyVolume.toLocaleString()} />
          <Row label="Agents on staff" value={inputs.agents.toLocaleString()} />
        </Card>
        <Card title="With our solution + AI">
          <Row label="Projected annual cost" value={currency(results.platformAnnualCost)} />
          <Row
            label="Projected cost per conversation"
            value={currency(results.platformCostPerConversation)}
          />
          <Row
            label="Conversations deflected by AI"
            value={results.conversationsDeflectedByAI.toLocaleString()}
          />
          <Row
            label="Conversations assisted by AI"
            value={results.conversationsAssistedByAI.toLocaleString()}
          />
        </Card>
      </div>

      <ChannelTable channels={results.channelBreakdown} />

      <div className="flex justify-center">
        <Button variant="secondary" onClick={onRestart}>
          Adjust inputs
        </Button>
      </div>
    </Container>
  );
}

function Stat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">{label}</p>
      <p className="text-3xl font-bold text-neutral-900">{value}</p>
      <p className="text-sm text-neutral-500">{helper}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      <dl className="flex flex-col gap-2">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-neutral-100 py-2 last:border-0">
      <dt className="text-sm text-neutral-600">{label}</dt>
      <dd className="text-sm font-semibold text-neutral-900">{value}</dd>
    </div>
  );
}

function ChannelTable({
  channels,
}: {
  channels: ProspectResults["channelBreakdown"];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase">
          <tr>
            <th className="px-4 py-3">Channel</th>
            <th className="px-4 py-3">Annual volume</th>
            <th className="px-4 py-3">Current cost</th>
            <th className="px-4 py-3">With Platform</th>
            <th className="px-4 py-3">Savings</th>
          </tr>
        </thead>
        <tbody>
          {channels.map((row) => (
            <tr key={row.channel} className="border-t border-neutral-100">
              <td className="px-4 py-3 font-medium text-neutral-900">{row.channel}</td>
              <td className="px-4 py-3 text-neutral-700">
                {row.volume.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-neutral-700">{currency(row.currentCost)}</td>
              <td className="px-4 py-3 text-neutral-700">{currency(row.platformCost)}</td>
              <td className="px-4 py-3 font-semibold text-emerald-700">
                {currency(row.savings)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
