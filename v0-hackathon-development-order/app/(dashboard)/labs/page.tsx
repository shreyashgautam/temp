"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchApi } from "@/lib/backend-api";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Beaker,
  FlaskConical,
  TestTube,
  FileText,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import Link from "next/link";

export default function LabsPage() {
  const [patients, setPatients] = useState<
    Array<{ patient_id: string; name: string; age?: number; gender?: string; diagnosis?: string[] }>
  >([]);
  const [labResults, setLabResults] = useState<
    Array<{
      patient_id: string;
      test: string;
      value: number;
      unit?: string;
      date: string;
      normalRange?: { min?: number; max?: number };
    }>
  >([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("P001");
  const [selectedTest, setSelectedTest]       = useState<string>("HbA1c");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [patientsRes, dashboard] = await Promise.all([
          fetchApi<Array<{ patient_id: string; name: string; age?: number; gender?: string; diagnosis?: string[] }>>("/api/patients"),
          fetchApi<{ labResults?: Array<Record<string, unknown>>; labs?: Array<Record<string, unknown>> }>("/api/dashboard/data"),
        ]);
        if (!active) return;
        setPatients(patientsRes || []);
        const rawLabs = (dashboard?.labResults || dashboard?.labs || []) as Array<Record<string, unknown>>;
        const normalized = rawLabs
          .map((l) => ({
            patient_id: String(l.patient_id || ""),
            test: String(l.test || l.test_name || ""),
            value: Number(l.value),
            unit: String(l.unit || ""),
            date: String(l.date || ""),
            normalRange:
              typeof l.normalRange === "object" && l.normalRange
                ? (l.normalRange as { min?: number; max?: number })
                : { min: 0, max: 0 },
          }))
          .filter((l) => l.patient_id && l.test && Number.isFinite(l.value));
        setLabResults(normalized);
        const firstPatient = patientsRes?.[0]?.patient_id || "P001";
        const firstTest = normalized.find((l) => l.patient_id === firstPatient)?.test || normalized[0]?.test || "HbA1c";
        setSelectedPatient(firstPatient);
        setSelectedTest(firstTest);
      } catch {
        if (!active) return;
        setPatients([]);
        setLabResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const getLabTrend = (patientId: string, testName: string) => {
    return labResults
      .filter((l) => l.patient_id === patientId && l.test === testName)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((l) => ({
        date: l.date,
        value: l.value,
        normalMin: Number(l.normalRange?.min ?? 0),
        normalMax: Number(l.normalRange?.max ?? 0),
      }));
  };

  const patient      = useMemo(() => patients.find((p) => p.patient_id === selectedPatient), [patients, selectedPatient]);
  const patientLabs  = useMemo(() => labResults.filter((l) => l.patient_id === selectedPatient), [labResults, selectedPatient]);
  const trendData    = useMemo(() => getLabTrend(selectedPatient, selectedTest), [selectedPatient, selectedTest, labResults]);
  const availTests   = [...new Set(patientLabs.map((l) => l.test))];
  const unit         = patientLabs.find((l) => l.test === selectedTest)?.unit || "";

  const latestValue  = trendData.length > 0 ? trendData[trendData.length - 1] : null;
  const prevValue    = trendData.length > 1 ? trendData[trendData.length - 2] : null;
  const isAbnormal   = latestValue && (latestValue.value > latestValue.normalMax || latestValue.value < latestValue.normalMin);

  const getTrend = () => {
    if (!latestValue || !prevValue) return { icon: Minus, color: "#94a3b8", label: "Stable", pct: "—" };
    const pct = ((latestValue.value - prevValue.value) / prevValue.value) * 100;
    if (pct > 5)  return { icon: ArrowUpRight,  color: "#dc2626", label: "Worsening", pct: `+${pct.toFixed(1)}%` };
    if (pct < -5) return { icon: ArrowDownRight, color: "#15803d", label: "Improving",  pct: `${pct.toFixed(1)}%` };
    return { icon: Minus, color: "#64748b", label: "Stable", pct: `${pct.toFixed(1)}%` };
  };
  const trend = getTrend();

  const totalTests    = labResults.length;
  const abnormalTests = labResults.filter((l) => l.value > Number(l.normalRange?.max ?? Infinity) || l.value < Number(l.normalRange?.min ?? -Infinity)).length;
  const normalTests   = totalTests - abnormalTests;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Serif:wght@400;500&display=swap');

        .lb { font-family: 'IBM Plex Sans', sans-serif; color: #0f172a; }
        .lb * { box-sizing: border-box; }
        .lb-serif { font-family: 'IBM Plex Serif', serif; }

        .lb-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }

        .lb-stat {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .lb-stat-icon {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #64748b;
        }

        .lb-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 7px;
          border: 1px solid #e2e8f0;
          background: white;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
          cursor: pointer;
          transition: all 0.14s;
          font-family: 'IBM Plex Sans', sans-serif;
        }
        .lb-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
        .lb-btn.primary { background: #0f172a; color: white; border-color: #0f172a; }
        .lb-btn.primary:hover { background: #1e293b; }

        .lb-summary-cell {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 14px 16px;
          flex: 1;
        }

        .lb-result-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 12px;
          border-radius: 7px;
          border: 1px solid transparent;
          transition: all 0.14s;
          margin-bottom: 6px;
          cursor: pointer;
        }
        .lb-result-row:last-child { margin-bottom: 0; }
        .lb-result-row:hover { background: #f8fafc; border-color: #e2e8f0; }

        .lb-select {
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 13px;
        }

        .test-tab {
          padding: 6px 13px;
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 500;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          cursor: pointer;
          transition: all 0.14s;
          font-family: 'IBM Plex Sans', sans-serif;
          white-space: nowrap;
        }
        .test-tab:hover { background: #f8fafc; }
        .test-tab.active { background: #0f172a; color: white; border-color: #0f172a; }

        .legend-line {
          display: inline-block;
          width: 22px;
          height: 2px;
          border-top: 2px dashed;
          vertical-align: middle;
        }
      `}</style>

      <div className="lb flex flex-col gap-6" style={{ background: "#f8fafc", padding: "2px 0 32px" }}>
        {loading && (
          <div className="lb-card" style={{ padding: "12px 14px", fontSize: 12.5, color: "#64748b" }}>
            Loading lab diagnostics from database...
          </div>
        )}

        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>
              Diagnostics
            </p>
            <h1 className="lb-serif" style={{ fontSize: 24, fontWeight: 500, color: "#0f172a", marginBottom: 4 }}>
              Lab Results
            </h1>
            <p style={{ fontSize: 13.5, color: "#64748b" }}>
              Track and analyse patient laboratory data over time
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="lb-btn"><Download style={{ width: 14, height: 14 }} /> Export</button>
            <button className="lb-btn primary"><Beaker style={{ width: 14, height: 14 }} /> Order Test</button>
          </div>
        </div>

        {/* ── Stat Cards ────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {[
            { label: "Total Tests",  value: totalTests,    icon: <FlaskConical style={{ width: 17, height: 17 }} />, valueColor: "#0f172a", warn: false },
            { label: "Abnormal",     value: abnormalTests, icon: <TrendingUp style={{ width: 17, height: 17, color: "#dc2626" }} />,   valueColor: "#dc2626", warn: true },
            { label: "Normal",       value: normalTests,   icon: <TestTube style={{ width: 17, height: 17, color: "#15803d" }} />,      valueColor: "#15803d", warn: false },
            { label: "Patients",     value: patients.length, icon: <FileText style={{ width: 17, height: 17 }} />,  valueColor: "#0f172a", warn: false },
          ].map((s, i) => (
            <div key={i} className="lb-stat" style={s.warn ? { borderLeft: "2.5px solid #ef4444" } : {}}>
              <div className="lb-stat-icon" style={s.warn ? { background: "#fef2f2", borderColor: "#fecaca", color: "#dc2626" } : {}}>
                {s.icon}
              </div>
              <div>
                <p style={{ fontSize: 24, fontWeight: 600, color: s.valueColor, letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Grid ─────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14 }}>

          {/* Chart Panel */}
          <div className="lb-card" style={{ padding: "22px 24px" }}>

            {/* Chart Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Trend Analysis</p>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Values over time with normal range reference lines</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Select
                  value={selectedPatient}
                  onValueChange={(v) => {
                    setSelectedPatient(v);
                    const first = labResults.filter((l) => l.patient_id === v)[0]?.test || "";
                    setSelectedTest(first);
                  }}
                >
                  <SelectTrigger className="lb-select" style={{ width: 150, borderRadius: 7, borderColor: "#e2e8f0", height: 36, fontSize: 13 }}>
                    <SelectValue placeholder="Patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.patient_id} value={p.patient_id} style={{ fontSize: 13 }}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Test selector tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
              {availTests.map((t) => (
                <button key={t} className={`test-tab ${selectedTest === t ? "active" : ""}`} onClick={() => setSelectedTest(t)}>
                  {t}
                </button>
              ))}
            </div>

            {/* Summary cells */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <div className="lb-summary-cell">
                <p style={{ fontSize: 11.5, color: "#94a3b8", marginBottom: 6 }}>Current Value</p>
                <p style={{ fontSize: 22, fontWeight: 600, color: isAbnormal ? "#dc2626" : "#0f172a", letterSpacing: "-0.02em", lineHeight: 1 }}>
                  {latestValue?.value ?? "—"}
                  <span style={{ fontSize: 12, fontWeight: 400, color: "#94a3b8", marginLeft: 4 }}>{unit}</span>
                </p>
              </div>
              <div className="lb-summary-cell">
                <p style={{ fontSize: 11.5, color: "#94a3b8", marginBottom: 6 }}>Change</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <trend.icon style={{ width: 16, height: 16, color: trend.color }} />
                  <p style={{ fontSize: 18, fontWeight: 600, color: trend.color, lineHeight: 1 }}>{trend.pct}</p>
                </div>
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{trend.label}</p>
              </div>
              <div className="lb-summary-cell">
                <p style={{ fontSize: 11.5, color: "#94a3b8", marginBottom: 6 }}>Normal Range</p>
                <p style={{ fontSize: 18, fontWeight: 600, color: "#0f172a", lineHeight: 1 }}>
                  {latestValue ? `${latestValue.normalMin}–${latestValue.normalMax}` : "—"}
                </p>
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{unit}</p>
              </div>
              <div className="lb-summary-cell">
                <p style={{ fontSize: 11.5, color: "#94a3b8", marginBottom: 6 }}>Readings</p>
                <p style={{ fontSize: 22, fontWeight: 600, color: "#0f172a", lineHeight: 1 }}>{trendData.length}</p>
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>data points</p>
              </div>
            </div>

            {/* Chart */}
            <div style={{ height: 230 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="labGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={isAbnormal ? "#ef4444" : "#334155"} stopOpacity={0.12} />
                      <stop offset="95%" stopColor={isAbnormal ? "#ef4444" : "#334155"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => new Date(v).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", fontSize: 12, fontFamily: "IBM Plex Sans" }}
                    formatter={(v: number) => [`${v} ${unit}`, selectedTest]}
                    labelFormatter={(l) => new Date(l).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    cursor={{ stroke: "#e2e8f0", strokeWidth: 1.5 }}
                  />
                  {latestValue && (
                    <>
                      <ReferenceLine y={latestValue.normalMax} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.2} />
                      <ReferenceLine y={latestValue.normalMin} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.2} />
                    </>
                  )}
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={isAbnormal ? "#ef4444" : "#334155"}
                    strokeWidth={2}
                    fill="url(#labGrad)"
                    dot={{ fill: isAbnormal ? "#ef4444" : "#334155", r: 3.5, strokeWidth: 1.5, stroke: "white" }}
                    activeDot={{ r: 5.5, stroke: isAbnormal ? "#ef4444" : "#334155", strokeWidth: 2, fill: "white" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22, marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "#94a3b8" }}>
                <span className="legend-line" style={{ borderColor: "#ef4444" }} /> Upper limit
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "#94a3b8" }}>
                <span className="legend-line" style={{ borderColor: "#10b981" }} /> Lower limit
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "#94a3b8" }}>
                <span style={{ width: 22, height: 2, background: isAbnormal ? "#ef4444" : "#334155", display: "inline-block", verticalAlign: "middle", borderRadius: 1 }} />
                {selectedTest}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Patient Card */}
            {patient && (
              <div className="lb-card" style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Avatar style={{ width: 46, height: 46, border: "2px solid white", boxShadow: "0 1px 6px rgba(0,0,0,0.09)" }}>
                      <AvatarImage src={`https://i.pravatar.cc/100?u=${patient.patient_id}`} />
                      <AvatarFallback style={{ background: "#f1f5f9", color: "#475569", fontSize: 13, fontWeight: 600 }}>
                        {patient.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>{patient.name}</p>
                    <p style={{ fontSize: 12, color: "#94a3b8" }}>{patient.age} yrs · {patient.gender}</p>
                  </div>
                  <Link href={`/patients/${patient.patient_id}`} style={{ color: "#64748b", textDecoration: "none" }}>
                    <ChevronRight style={{ width: 16, height: 16 }} />
                  </Link>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {(patient.diagnosis || []).map((d, i) => (
                    <span key={i} style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Results */}
            <div className="lb-card" style={{ padding: "18px 18px", flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 14 }}>Recent Results</p>
              <div>
                {patientLabs.slice(0, 7).map((result, i) => {
                  const max = Number(result.normalRange?.max ?? Number.POSITIVE_INFINITY);
                  const min = Number(result.normalRange?.min ?? Number.NEGATIVE_INFINITY);
                  const abn = result.value > max || result.value < min;
                  return (
                    <div
                      key={i}
                      className="lb-result-row"
                      onClick={() => { setSelectedTest(result.test); }}
                      style={selectedTest === result.test ? { background: "#f8fafc", borderColor: "#e2e8f0" } : {}}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 7, background: abn ? "#fef2f2" : "#f0fdf4", border: `1px solid ${abn ? "#fecaca" : "#bbf7d0"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Activity style={{ width: 14, height: 14, color: abn ? "#dc2626" : "#15803d" }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{result.test}</p>
                          <p style={{ fontSize: 11, color: "#94a3b8" }}>{result.date}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: abn ? "#dc2626" : "#0f172a" }}>
                          {result.value} <span style={{ fontSize: 11, fontWeight: 400, color: "#94a3b8" }}>{result.unit}</span>
                        </p>
                        <span style={{ fontSize: 10.5, fontWeight: 600, padding: "1px 6px", borderRadius: 3, background: abn ? "#fef2f2" : "#f0fdf4", color: abn ? "#dc2626" : "#15803d" }}>
                          {abn ? "Abnormal" : "Normal"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
