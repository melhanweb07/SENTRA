"use client";

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { CaseRecord, Referral, RiskLevel, TimelinePoint } from "@/lib/types";
import { riskChartColor } from "@/lib/ai/svi";
import { fmtClock, languageName } from "@/lib/utils";

const PIE_COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b"];

export function CountPie({ data }: { data: { name: string; value: number; color?: string }[] }) {
  const filtered = data.filter((d) => d.value > 0);
  if (!filtered.length) return <p className="py-8 text-center text-xs text-slate-400">No data yet</p>;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={filtered} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
          {filtered.map((d, i) => (
            <Cell key={i} fill={d.color || PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function RiskDistributionChart({ cases }: { cases: CaseRecord[] }) {
  const risks: RiskLevel[] = ["LOW", "MODERATE", "HIGH", "CRITICAL"];
  const data = risks.map((r) => ({
    name: r,
    value: cases.filter((c) => (c.svi !== undefined ? c.risk === r : false)).length,
    color: riskChartColor(r),
  }));
  return <CountPie data={data} />;
}

export function LanguageDistributionChart({ cases }: { cases: CaseRecord[] }) {
  const data = ["en", "ta", "hi"].map((l) => ({
    name: languageName(l),
    value: cases.filter((c) => c.language === l).length,
  }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CasesOverTimeChart({ cases }: { cases: CaseRecord[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    return {
      name: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      Cases: cases.filter((c) => new Date(c.createdAt).toDateString() === key).length,
    };
  });
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={days} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="caseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Area type="monotone" dataKey="Cases" stroke="#4f46e5" strokeWidth={2} fill="url(#caseGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ReferralStatusChart({ referrals }: { referrals: Referral[] }) {
  const statuses = ["PENDING", "ACCEPTED", "COMPLETED"] as const;
  const colors = { PENDING: "#d97706", ACCEPTED: "#0ea5e9", COMPLETED: "#10b981" };
  return (
    <CountPie
      data={statuses.map((s) => ({ name: s, value: referrals.filter((r) => r.status === s).length, color: colors[s] }))}
    />
  );
}

// Dynamic Distress Mapping — live timeline of the conversation
export function DistressTimelineChart({ timeline }: { timeline: TimelinePoint[] }) {
  if (timeline.length === 0) {
    return (
      <p className="py-10 text-center text-xs text-slate-400">
        Timeline will appear as conversation segments arrive.
      </p>
    );
  }
  const data = timeline.map((p) => ({
    t: fmtClock(p.t),
    SVI: p.svi,
    Distress: p.distress,
    Safety: p.safety,
    Fear: p.fear,
    _events: p.events,
  }));
  const eventDots = timeline
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.events.length > 0);

  return (
    <ResponsiveContainer width="100%" height={230}>
      <LineChart data={data} margin={{ top: 10, right: 16, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="t" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
          formatter={(value: number | string, name: string) => [value, name]}
          labelFormatter={(_, payload) => {
            const ev = (payload?.[0]?.payload?._events as string[]) || [];
            return ev.length ? `${ev.join(" · ")}` : "Conversation time";
          }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="SVI" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
        <Line type="monotone" dataKey="Distress" stroke="#d97706" strokeWidth={1.6} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="Safety" stroke="#e11d48" strokeWidth={1.6} dot={false} strokeDasharray="5 4" isAnimationActive={false} />
        <Line type="monotone" dataKey="Fear" stroke="#ea580c" strokeWidth={1.2} dot={false} isAnimationActive={false} />
        {eventDots.map(({ p, i }) => (
          <ReferenceDot
            key={i}
            x={fmtClock(p.t)}
            y={p.distress}
            r={5}
            fill="#e11d48"
            stroke="#fff"
            strokeWidth={1.5}
            isFront
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
