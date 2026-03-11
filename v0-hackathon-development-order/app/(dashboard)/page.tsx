"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchApi } from "@/lib/backend-api";
import {
  Users,
  Bell,
  Activity,
  TrendingUp,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Stethoscope,
  Clock,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Patient = {
  patient_id: string;
  name: string;
  age?: number;
  gender?: string;
  diagnosis?: string[];
  status?: string;
  lastVisit?: string | null;
};

type Visit = {
  patient_id: string;
  date: string;
  doctor?: string;
  department?: string;
  visit_type?: string;
};

type LabResult = {
  patient_id: string;
  test: string;
  value: number;
  unit?: string;
  date: string;
};

type Alert = {
  id: string;
  patient_id: string;
  severity: "high" | "medium" | "low";
  message: string;
  timestamp: string;
};

type DashboardResponse = {
  patients: Patient[];
  visits: Visit[];
  medications: unknown[];
  labResults: LabResult[];
  alerts: Alert[];
};

const genderColors = {
  male: "#1e293b",
  female: "#cbd5e1",
};

function toDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getStatusClass(status?: string) {
  const normalized = (status || "stable").toLowerCase();
  if (normalized.includes("critical") || normalized === "high") return "critical";
  if (normalized.includes("monitor") || normalized.includes("medium")) return "monitoring";
  return "stable";
}

export default function DashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [doctorName, setDoctorName] = useState("Dr. Verma");
  const [headerDate, setHeaderDate] = useState("Loading date...");
  const [headerGreeting, setHeaderGreeting] = useState("Hello");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [patientRows, dashboard] = await Promise.all([
          fetchApi<Patient[]>("/api/patients"),
          fetchApi<DashboardResponse>("/api/dashboard/data"),
        ]);

        if (!active) return;

        setPatients(Array.isArray(patientRows) ? patientRows : []);
        setVisits(Array.isArray(dashboard?.visits) ? dashboard.visits : []);
        setLabResults(Array.isArray(dashboard?.labResults) ? dashboard.labResults : []);
        setAlerts(Array.isArray(dashboard?.alerts) ? dashboard.alerts : []);
      } catch {
        if (!active) return;
        setPatients([]);
        setVisits([]);
        setLabResults([]);
        setAlerts([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    if (typeof window !== "undefined") {
      const now = new Date();
      const hour = now.getHours();
      setHeaderGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
      setHeaderDate(formatDateLabel(now));

      try {
        const raw = localStorage.getItem("medai_user");
        if (raw) {
          const user = JSON.parse(raw) as { name?: string };
          if (user.name) {
            setDoctorName(user.name.startsWith("Dr.") ? user.name : `Dr. ${user.name}`);
          }
        }
      } catch {
        // ignore parse errors and use fallback name
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const patientMap = useMemo(
    () => new Map(patients.map((p) => [p.patient_id, p])),
    [patients]
  );

  const sortedVisits = useMemo(
    () => [...visits].sort((a, b) => (toDate(b.date)?.getTime() || 0) - (toDate(a.date)?.getTime() || 0)),
    [visits]
  );

  const highAlerts = useMemo(
    () => alerts.filter((a) => String(a.severity).toLowerCase() === "high"),
    [alerts]
  );

  const abnormalLabsCount = useMemo(() => {
    const highOrLow = alerts.filter((a) => {
      const text = a.message.toLowerCase();
      return text.includes("high") || text.includes("low") || text.includes("abnormal");
    });
    return highOrLow.length;
  }, [alerts]);

  const genderData = useMemo(() => {
    const male = patients.filter((p) => (p.gender || "").toLowerCase().includes("male")).length;
    const female = patients.filter((p) => (p.gender || "").toLowerCase().includes("female")).length;
    const total = Math.max(patients.length, 1);

    return [
      { name: "Male", value: Math.round((male / total) * 100), color: genderColors.male },
      { name: "Female", value: Math.round((female / total) * 100), color: genderColors.female },
    ];
  }, [patients]);

  const activityData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const bucket = new Map<string, { date: string; patients: number; consultations: number; ids: Set<string> }>();

    for (const d of days) {
      bucket.set(d, { date: d, patients: 0, consultations: 0, ids: new Set<string>() });
    }

    for (const visit of visits) {
      const dt = toDate(visit.date);
      if (!dt) continue;
      const key = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(dt);
      const row = bucket.get(key);
      if (!row) continue;
      row.consultations += 1;
      if (visit.patient_id) row.ids.add(visit.patient_id);
    }

    return days.map((day) => {
      const row = bucket.get(day)!;
      return { date: day, patients: row.ids.size, consultations: row.consultations };
    });
  }, [visits]);

  const recentPatients = useMemo(() => {
    return [...patients]
      .sort((a, b) => (toDate(b.lastVisit)?.getTime() || 0) - (toDate(a.lastVisit)?.getTime() || 0))
      .slice(0, 5);
  }, [patients]);

  const todayAppointments = useMemo(() => {
    const now = new Date();

    return sortedVisits.slice(0, 4).map((visit) => {
      const d = toDate(visit.date);
      const patient = patientMap.get(visit.patient_id);
      const isUpcoming = d ? d.getTime() >= now.getTime() : false;
      return {
        patient: patient?.name || visit.patient_id,
        type: visit.visit_type || visit.department || "Consultation",
        time: d
          ? new Intl.DateTimeFormat("en-GB", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }).format(d)
          : "No date",
        status: isUpcoming ? "Upcoming" : "Completed",
      };
    });
  }, [sortedVisits, patientMap]);

  const todaysVisitCount = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    return visits.filter((v) => {
      const dt = toDate(v.date);
      return !!dt && dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
    }).length;
  }, [visits]);
  const totalPatients = patients.length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=IBM+Plex+Serif:wght@400;500&display=swap');

        .db { font-family: 'IBM Plex Sans', sans-serif; color: #0f172a; }
        .db * { box-sizing: border-box; }
        .db-serif { font-family: 'IBM Plex Serif', serif; }

        .db-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }

        .db-stat {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 20px 22px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .db-stat-icon {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          flex-shrink: 0;
        }

        .db-patient-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 12px;
          border-radius: 7px;
          border: 1px solid transparent;
          transition: all 0.15s ease;
          text-decoration: none;
          color: inherit;
        }
        .db-patient-row:hover {
          background: #f8fafc;
          border-color: #e2e8f0;
        }

        .db-alert-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 11px 12px;
          border-radius: 7px;
          border: 1px solid #f1f5f9;
          margin-bottom: 7px;
          text-decoration: none;
          color: inherit;
          transition: background 0.12s;
        }
        .db-alert-row:last-of-type { margin-bottom: 0; }
        .db-alert-row:hover { background: #f8fafc; }
        .db-alert-high  { border-left: 2.5px solid #ef4444; }
        .db-alert-medium { border-left: 2.5px solid #f59e0b; }
        .db-alert-low   { border-left: 2.5px solid #cbd5e1; }

        .db-schedule-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 7px;
          margin-bottom: 7px;
        }
        .db-schedule-row:last-child { margin-bottom: 0; }

        .db-status {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 4px;
          white-space: nowrap;
        }
        .db-status-critical  { background: #fef2f2; color: #dc2626; }
        .db-status-monitoring { background: #fffbeb; color: #b45309; }
        .db-status-stable    { background: #f0fdf4; color: #15803d; }
      `}</style>

      <div className="db flex flex-col gap-6" style={{ background: "#f8fafc", padding: "2px 0 32px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.09em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 7 }}>
              {headerDate}
            </p>
            <h1 className="db-serif" style={{ fontSize: 25, fontWeight: 500, color: "#0f172a", lineHeight: 1.25, marginBottom: 5 }}>
              {headerGreeting}, {doctorName}
            </h1>
            <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.5 }}>
              {todayAppointments.filter((a) => a.status === "Upcoming").length} upcoming appointments
              &nbsp;·&nbsp;
              <span style={{ color: "#dc2626", fontWeight: 500 }}>{highAlerts.length} critical alerts</span> require your attention.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
   
            <Button
              asChild
              style={{ background: "#0f172a", color: "white", borderRadius: 8, height: 40, padding: "0 16px", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}
            >
              <Link href="/assistant">
                <Sparkles className="h-3.5 w-3.5" />
                AI Assistant
              </Link>
            </Button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { label: "Total Patients", value: totalPatients.toLocaleString("en-IN"), sub: `${loading ? "Loading" : "Live"} from backend`, icon: <Users style={{ width: 18, height: 18 }} />, critical: false },
            { label: "Appointments", value: visits.length.toLocaleString("en-IN"), sub: `${todaysVisitCount} scheduled today`, icon: <Stethoscope style={{ width: 18, height: 18 }} />, critical: false },
            { label: "Lab Results", value: labResults.length.toLocaleString("en-IN"), sub: `${abnormalLabsCount} flagged for review`, icon: <Activity style={{ width: 18, height: 18 }} />, critical: false },
            { label: "Critical Alerts", value: String(highAlerts.length), sub: "Requires attention", icon: <Bell style={{ width: 18, height: 18 }} />, critical: true },
          ].map((s, i) => (
            <div key={i} className="db-stat" style={s.critical ? { borderLeft: "3px solid #ef4444" } : {}}>
              <div>
                <p style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 500, marginBottom: 10, letterSpacing: "0.01em" }}>{s.label}</p>
                <p style={{ fontSize: 27, fontWeight: 600, color: s.critical ? "#dc2626" : "#0f172a", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {s.value}
                </p>
                <p style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 7, display: "flex", alignItems: "center", gap: 4 }}>
                  {i === 0 && <TrendingUp style={{ width: 12, height: 12 }} />}
                  {s.sub}
                </p>
              </div>
              <div className="db-stat-icon" style={s.critical ? { background: "#fef2f2", borderColor: "#fecaca", color: "#dc2626" } : {}}>
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: 12 }}>
          <div className="db-card" style={{ padding: "22px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Weekly Patient Activity</p>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Visits and consultations this week</p>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                {[{ color: "#1e293b", label: "Visits" }, { color: "#cbd5e1", label: "Consultations" }].map((l) => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
                    <span style={{ width: 20, height: 2, background: l.color, display: "inline-block", borderRadius: 2 }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ height: 195 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 5, right: 4, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e293b" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#1e293b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.07)", fontSize: 12 }} cursor={{ stroke: "#f1f5f9", strokeWidth: 1.5 }} />
                  <Area type="monotone" dataKey="patients" name="Visits" stroke="#1e293b" strokeWidth={1.8} fill="url(#gV)" dot={false} activeDot={{ r: 3.5, fill: "#1e293b", strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="consultations" name="Consultations" stroke="#94a3b8" strokeWidth={1.5} fill="url(#gC)" dot={false} activeDot={{ r: 3.5, fill: "#94a3b8", strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="db-card" style={{ padding: "22px 22px" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 3 }}>Distribution</p>
            <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 20 }}>Gender breakdown</p>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <div style={{ width: 120, height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={genderData} cx="50%" cy="50%" innerRadius={34} outerRadius={54} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {genderData.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
              <p style={{ fontSize: 22, fontWeight: 600, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 12 }}>
                {totalPatients.toLocaleString("en-IN")}
              </p>
              {genderData.map((g) => (
                <div key={g.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: g.color, display: "inline-block", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#475569", flex: 1 }}>{g.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{g.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px 280px", gap: 12 }}>
          <div className="db-card" style={{ padding: "20px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Recent Patients</p>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Latest appointments</p>
              </div>
              <Link href="/patients" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "#475569", fontWeight: 500, textDecoration: "none" }}>
                View all <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>

            <div>
              {recentPatients.map((patient) => {
                const status = getStatusClass(patient.status);
                const initials = patient.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2);

                return (
                  <Link key={patient.patient_id} href={`/patients/${patient.patient_id}`} className="db-patient-row">
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <Avatar style={{ width: 34, height: 34 }}>
                        <AvatarImage src={`https://i.pravatar.cc/100?u=${patient.patient_id}`} />
                        <AvatarFallback style={{ background: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 600 }}>{initials}</AvatarFallback>
                      </Avatar>
                      <span
                        style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          border: "1.5px solid white",
                          background: status === "critical" ? "#ef4444" : status === "monitoring" ? "#f59e0b" : "#22c55e",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 500, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {patient.name}
                      </p>
                      <p style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 1.5 }}>
                        {patient.age ?? "-"} yrs · {patient.gender || "Unknown"} · {patient.diagnosis?.[0] || "No diagnosis"}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span className={`db-status db-status-${status}`}>{status === "critical" ? "Critical" : status === "monitoring" ? "Monitoring" : "Stable"}</span>
                      <ChevronRight style={{ width: 14, height: 14, color: "#cbd5e1" }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="db-card" style={{ padding: "20px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Today's Schedule</p>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#94a3b8" }}>
                <Clock style={{ width: 13, height: 13 }} /> {todayAppointments.length}
              </span>
            </div>

            {todayAppointments.map((apt, i) => (
              <div key={i} className="db-schedule-row" style={apt.status === "Upcoming" ? { background: "#f8fafc", borderLeft: "2.5px solid #1e293b" } : { background: "#fafafa", opacity: 0.65 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <Avatar style={{ width: 28, height: 28 }}>
                    <AvatarImage src={`https://i.pravatar.cc/100?u=${apt.patient}`} />
                    <AvatarFallback style={{ background: "#f1f5f9", color: "#64748b", fontSize: 9, fontWeight: 600 }}>
                      {apt.patient
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 500, color: "#0f172a", lineHeight: 1.3 }}>{apt.patient}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{apt.time} · {apt.type}</p>
                  </div>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: apt.status === "Completed" ? "#f1f5f9" : "#1e293b", color: apt.status === "Completed" ? "#94a3b8" : "white", whiteSpace: "nowrap" }}>
                  {apt.status}
                </span>
              </div>
            ))}
          </div>

          <div className="db-card" style={{ padding: "20px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", display: "inline-block", flexShrink: 0 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Active Alerts</p>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#fef2f2", color: "#dc2626" }}>
                {highAlerts.length} critical
              </span>
            </div>

            <div>
              {alerts.slice(0, 3).map((alert) => (
                <Link key={alert.id} href="/alerts" className={`db-alert-row db-alert-${alert.severity}`}>
                  <div style={{ marginTop: 4, width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: alert.severity === "high" ? "#ef4444" : alert.severity === "medium" ? "#f59e0b" : "#94a3b8" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 500, color: "#0f172a", lineHeight: 1.45 }}>{alert.message}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{patientMap.get(alert.patient_id)?.name || alert.patient_id}</p>
                  </div>
                  <ChevronRight style={{ width: 14, height: 14, color: "#cbd5e1", flexShrink: 0, marginTop: 2 }} />
                </Link>
              ))}
            </div>

            <Link href="/alerts" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9", fontSize: 12.5, color: "#475569", fontWeight: 500, textDecoration: "none" }}>
              View all alerts <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
