"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchApi } from "@/lib/backend-api";
import {
  FileText,
  Download,
  Users,
  Activity,
  Pill,
  Bell,
  Calendar,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const reports = [
  { id: "patient-summary", title: "Monthly Patient Summary", desc: "Overview of all patients, diagnoses, and status", icon: Users, date: "Updated live" },
  { id: "lab-results", title: "Lab Results Report", desc: "Complete lab test results with trend analysis", icon: Activity, date: "Updated live" },
  { id: "medication", title: "Medication Report", desc: "Active prescriptions and drug interaction analysis", icon: Pill, date: "Updated live" },
  { id: "critical-alerts", title: "Critical Alerts Report", desc: "Summary of all critical alerts requiring attention", icon: Bell, date: "Updated live" },
];

type Patient = { patient_id: string; name: string; status?: string; diagnosis?: string[] };
type Lab = { patient_id: string; test?: string; test_name?: string; value?: number; date?: string; unit?: string; status?: string };
type Visit = { patient_id: string; date?: string };
type Medication = { patient_id: string; drug?: string; name?: string; dose?: string; frequency?: string; start_date?: string };
type Alert = { patient_id: string; severity?: string; message?: string; type?: string; timestamp?: string };
type Interaction = { severity?: string };

export default function ReportsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [patientsRes, dashboard] = await Promise.all([
          fetchApi<Patient[]>("/api/patients"),
          fetchApi<{
            patients?: Patient[];
            labResults?: Lab[];
            labs?: Lab[];
            medications?: Medication[];
            alerts?: Alert[];
            visits?: Visit[];
            drugInteractions?: Interaction[];
          }>("/api/dashboard/data"),
        ]);
        if (!active) return;
        const apiPatients = (patientsRes && patientsRes.length > 0) ? patientsRes : (dashboard?.patients || []);
        setPatients(apiPatients);
        setLabs((dashboard?.labResults || dashboard?.labs || []).filter(Boolean));
        setMedications((dashboard?.medications || []).filter(Boolean));
        setAlerts((dashboard?.alerts || []).filter(Boolean));
        setVisits((dashboard?.visits || []).filter(Boolean));
        setInteractions((dashboard?.drugInteractions || []).filter(Boolean));
      } catch {
        if (!active) return;
        setPatients([]);
        setLabs([]);
        setMedications([]);
        setAlerts([]);
        setVisits([]);
        setInteractions([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const statusData = useMemo(() => {
    const stable = patients.filter((p) => String(p.status || "").toLowerCase() === "stable").length;
    const monitoring = patients.filter((p) => String(p.status || "").toLowerCase() === "monitoring").length;
    const critical = patients.filter((p) => String(p.status || "").toLowerCase() === "critical").length;
    return [
      { name: "Stable", value: stable, color: "#334155" },
      { name: "Monitoring", value: monitoring, color: "#94a3b8" },
      { name: "Critical", value: critical, color: "#ef4444" },
    ];
  }, [patients]);

  const diagnosisData = useMemo(() => {
    const map = new Map<string, number>();
    patients.forEach((p) => {
      (p.diagnosis || []).forEach((d) => {
        map.set(d, (map.get(d) || 0) + 1);
      });
    });
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [patients]);

  const alertsBySeverity = useMemo(() => {
    const critical = alerts.filter((a) => String(a.severity || "").toLowerCase() === "high").length;
    const moderate = alerts.filter((a) => String(a.severity || "").toLowerCase() === "medium").length;
    const low = alerts.filter((a) => String(a.severity || "").toLowerCase() === "low").length;
    return [
      { name: "Critical", count: critical, fill: "#ef4444" },
      { name: "Moderate", count: moderate, fill: "#f59e0b" },
      { name: "Low", count: low, fill: "#cbd5e1" },
    ];
  }, [alerts]);

  const monthlyActivity = useMemo(() => {
    const monthMap = new Map<string, { month: string; visits: number; labs: number }>();
    const ensure = (d: string) => {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return null;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, {
          month: dt.toLocaleDateString("en-US", { month: "short" }),
          visits: 0,
          labs: 0,
        });
      }
      return key;
    };

    visits.forEach((v) => {
      const key = ensure(String(v.date || ""));
      if (key && monthMap.has(key)) monthMap.get(key)!.visits += 1;
    });
    labs.forEach((l) => {
      const key = ensure(String(l.date || ""));
      if (key && monthMap.has(key)) monthMap.get(key)!.labs += 1;
    });

    return [...monthMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([, v]) => v);
  }, [visits, labs]);

  const highAlertsCount = alertsBySeverity.find((a) => a.name === "Critical")?.count || 0;

  const escapeCsvValue = (value: unknown) => {
    const text = String(value ?? "");
    const escaped = text.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const downloadCsv = (filename: string, headers: string[], rows: Array<Array<unknown>>) => {
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadReport = (reportId: string) => {
    const today = new Date().toISOString().slice(0, 10);

    if (reportId === "patient-summary") {
      const rows = patients.map((p) => [
        p.patient_id,
        p.name,
        p.status || "",
        (p.diagnosis || []).join(" | "),
      ]);
      downloadCsv(`monthly-patient-summary-${today}.csv`, ["patient_id", "name", "status", "diagnosis"], rows);
      return;
    }

    if (reportId === "lab-results") {
      const rows = labs.map((l) => [
        l.patient_id,
        l.test || l.test_name || "",
        l.value ?? "",
        l.unit || "",
        l.status || "",
        l.date || "",
      ]);
      downloadCsv(`lab-results-report-${today}.csv`, ["patient_id", "test", "value", "unit", "status", "date"], rows);
      return;
    }

    if (reportId === "medication") {
      const rows = medications.map((m) => [
        m.patient_id,
        m.drug || m.name || "",
        m.dose || "",
        m.frequency || "",
        m.start_date || "",
      ]);
      downloadCsv(`medication-report-${today}.csv`, ["patient_id", "drug", "dose", "frequency", "start_date"], rows);
      return;
    }

    if (reportId === "critical-alerts") {
      const rows = alerts
        .filter((a) => String(a.severity || "").toLowerCase() === "high")
        .map((a) => [
          a.patient_id,
          a.type || "",
          a.severity || "",
          a.message || "",
          a.timestamp || "",
        ]);
      downloadCsv(`critical-alerts-report-${today}.csv`, ["patient_id", "type", "severity", "message", "timestamp"], rows);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Serif:wght@400;500&display=swap');

        .rp { font-family: 'IBM Plex Sans', sans-serif; color: #0f172a; }
        .rp * { box-sizing: border-box; }
        .rp-serif { font-family: 'IBM Plex Serif', serif; }

        .rp-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }

        .rp-stat {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 13px;
        }
        .rp-stat-icon {
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

        .rp-btn {
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
        .rp-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
        .rp-btn.primary { background: #0f172a; color: white; border-color: #0f172a; }
        .rp-btn.primary:hover { background: #1e293b; }

        .rp-report-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 15px 16px;
          border-radius: 8px;
          border: 1px solid #f1f5f9;
          background: #fafafa;
          transition: all 0.14s;
          margin-bottom: 8px;
        }
        .rp-report-row:last-child { margin-bottom: 0; }
        .rp-report-row:hover { background: #f1f5f9; border-color: #e2e8f0; }
      `}</style>

      <div className="rp flex flex-col gap-6" style={{ background: "#f8fafc", padding: "2px 0 32px" }}>
        {loading && (
          <div className="rp-card" style={{ padding: "12px 14px", fontSize: 12.5, color: "#64748b" }}>
            Loading report metrics from database...
          </div>
        )}

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>
              Analytics
            </p>
            <h1 className="rp-serif" style={{ fontSize: 24, fontWeight: 500, color: "#0f172a", marginBottom: 4 }}>
              Reports
            </h1>
            <p style={{ fontSize: 13.5, color: "#64748b" }}>
              Generate and download clinical reports
            </p>
          </div>
          <button className="rp-btn primary">
            <FileText style={{ width: 14, height: 14 }} /> Generate Custom Report
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {[
            { label: "Total Patients", value: patients.length, icon: <Users style={{ width: 17, height: 17 }} />, warn: false },
            { label: "Lab Results", value: labs.length, icon: <Activity style={{ width: 17, height: 17 }} />, warn: false },
            { label: "Prescriptions", value: medications.length, icon: <Pill style={{ width: 17, height: 17 }} />, warn: false },
            {
              label: "Active Alerts",
              value: alerts.length,
              icon: <Bell style={{ width: 17, height: 17, color: highAlertsCount > 0 ? "#dc2626" : "#64748b" }} />,
              warn: highAlertsCount > 0,
            },
          ].map((s, i) => (
            <div key={i} className="rp-stat" style={s.warn ? { borderLeft: "2.5px solid #ef4444" } : {}}>
              <div className="rp-stat-icon" style={s.warn ? { background: "#fef2f2", borderColor: "#fecaca" } : {}}>
                {s.icon}
              </div>
              <div>
                <p style={{ fontSize: 24, fontWeight: 600, color: s.warn ? "#dc2626" : "#0f172a", letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 14 }}>
          <div className="rp-card" style={{ padding: "22px 22px" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 3 }}>Patient Status</p>
            <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>Distribution by condition</p>

            <div style={{ height: 160, display: "flex", justifyContent: "center" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }} cursor={false} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14, marginTop: 4, display: "flex", flexDirection: "column", gap: 8 }}>
              {statusData.map((s) => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, display: "inline-block", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#475569", flex: 1 }}>{s.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{s.value}</span>
                  <span style={{ fontSize: 11.5, color: "#94a3b8" }}>
                    {patients.length > 0 ? `${Math.round((s.value / patients.length) * 100)}%` : "0%"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rp-card" style={{ padding: "22px 22px" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 3 }}>Diagnoses Distribution</p>
            <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>Frequency of diagnoses across all patients</p>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diagnosisData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11.5, fill: "#475569" }} tickLine={false} axisLine={false} width={165} />
                  <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }} cursor={{ fill: "#f8fafc" }} />
                  <Bar dataKey="count" fill="#334155" radius={[0, 4, 4, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rp-card" style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Alerts by Severity</p>
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Active clinical alert breakdown</p>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              {alertsBySeverity.map((a) => (
                <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: a.fill, display: "inline-block" }} />
                  {a.name}
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertsBySeverity} margin={{ top: 0, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }} cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={52}>
                  {alertsBySeverity.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rp-card" style={{ padding: "22px 24px" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 3 }}>Monthly Clinical Activity</p>
          <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>Visits and lab events over the last 6 months</p>
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyActivity} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }} />
                <Line type="monotone" dataKey="visits" stroke="#334155" strokeWidth={2} dot={{ r: 3 }} name="Visits" />
                <Line type="monotone" dataKey="labs" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} name="Labs" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rp-card" style={{ padding: "20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Available Reports</p>
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Download pre-built clinical report templates</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {reports.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.title} className="rp-report-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon style={{ width: 16, height: 16, color: "#64748b" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 500, color: "#0f172a" }}>{r.title}</p>
                      <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{r.desc}</p>
                      <p style={{ fontSize: 11, color: "#cbd5e1", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <Calendar style={{ width: 11, height: 11 }} /> {r.date}
                      </p>
                    </div>
                  </div>
                  <button className="rp-btn" style={{ flexShrink: 0 }} onClick={() => handleDownloadReport(r.id)}>
                    <Download style={{ width: 13, height: 13 }} /> Download
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
