"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchApi } from "@/lib/backend-api";
import {
  Bell,
  AlertTriangle,
  Clock,
  Pill,
  TrendingUp,
  CheckCircle,
  Shield,
  Activity,
  ChevronRight,
  X,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";

const severityMeta = {
  high:   { label: "Critical",  dot: "#ef4444", bg: "#fef2f2", color: "#dc2626", border: "#fecaca", leftBorder: "#ef4444" },
  medium: { label: "Moderate",  dot: "#f59e0b", bg: "#fffbeb", color: "#b45309", border: "#fde68a", leftBorder: "#f59e0b" },
  low:    { label: "Low Risk",  dot: "#10b981", bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", leftBorder: "#94a3b8" },
};

const typeMeta = {
  critical_value:   { icon: AlertTriangle, label: "Critical Value" },
  drug_interaction: { icon: Pill,          label: "Drug Interaction" },
  test_overdue:     { icon: Clock,         label: "Test Overdue" },
  pattern:          { icon: TrendingUp,    label: "Pattern Detected" },
};

export default function AlertsPage() {
  const [patients, setPatients] = useState<Array<{ patient_id: string; name: string }>>([]);
  const [alerts, setAlerts] = useState<
    Array<{
      id: string;
      patient_id: string;
      severity: "high" | "medium" | "low";
      type: string;
      message: string;
      timestamp: string;
    }>
  >([]);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter]         = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [patientsRes, dashboard] = await Promise.all([
          fetchApi<Array<{ patient_id: string; name: string }>>("/api/patients"),
          fetchApi<{ alerts?: Array<Record<string, unknown>> }>("/api/dashboard/data"),
        ]);
        if (!active) return;
        setPatients((patientsRes || []).map((p) => ({ patient_id: p.patient_id, name: p.name })));
        const normalized = (dashboard?.alerts || []).map((a, idx) => ({
          _rawType: String(a.type || "").toLowerCase(),
          id: String(a.id || `${a.patient_id || "P"}-${idx}`),
          patient_id: String(a.patient_id || ""),
          severity: String(a.severity || "low").toLowerCase() as "high" | "medium" | "low",
          type: "pattern",
          message: String(a.message || "Clinical alert"),
          timestamp: String(a.timestamp || new Date().toISOString()),
        })).map((a) => {
          if (a._rawType.includes("drug")) return { ...a, type: "drug_interaction" };
          if (a._rawType.includes("overdue")) return { ...a, type: "test_overdue" };
          if (a._rawType.includes("critical")) return { ...a, type: "critical_value" };
          if (a._rawType.includes("lab")) return { ...a, type: "critical_value" };
          return { ...a, type: "pattern" };
        });
        setAlerts(normalized);
      } catch {
        if (!active) return;
        setPatients([]);
        setAlerts([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const filteredAlerts = useMemo(() => alerts.filter((a) => {
    const matchSev  = severityFilter === "all" || a.severity === severityFilter;
    const matchType = typeFilter === "all" || a.type === typeFilter;
    return matchSev && matchType;
  }), [alerts, severityFilter, typeFilter]);

  const displayedAlerts = useMemo(
    () =>
      [...filteredAlerts]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10),
    [filteredAlerts]
  );

  const displayedCriticalAlerts = useMemo(
    () => displayedAlerts.filter((a) => a.severity === "high"),
    [displayedAlerts]
  );

  const displayedOtherAlerts = useMemo(
    () => displayedAlerts.filter((a) => a.severity !== "high"),
    [displayedAlerts]
  );

  const counts = useMemo(() => ({
    total:  alerts.length,
    high:   alerts.filter((a) => a.severity === "high").length,
    medium: alerts.filter((a) => a.severity === "medium").length,
    low:    alerts.filter((a) => a.severity === "low").length,
  }), [alerts]);

  const getPatient = (pid: string) => patients.find((p) => p.patient_id === pid);
  const hasFilters = severityFilter !== "all" || typeFilter !== "all";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Serif:wght@400;500&display=swap');

        .al { font-family: 'IBM Plex Sans', sans-serif; color: #0f172a; }
        .al * { box-sizing: border-box; }
        .al-serif { font-family: 'IBM Plex Serif', serif; }

        .al-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }

        .al-stat {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px 18px;
          cursor: pointer;
          transition: all 0.14s;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .al-stat:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.06); }

        .al-stat-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .al-alert-row {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          padding: 14px 15px;
          border-radius: 8px;
          border: 1px solid;
          margin-bottom: 8px;
          transition: background 0.12s;
        }
        .al-alert-row:last-child { margin-bottom: 0; }
        .al-alert-row:hover { filter: brightness(0.98); }

        .al-type-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          cursor: pointer;
          transition: all 0.14s;
          font-family: 'IBM Plex Sans', sans-serif;
        }
        .al-type-chip:hover { background: #f8fafc; }
        .al-type-chip.active { background: #0f172a; color: white; border-color: #0f172a; }

        .al-btn {
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
        .al-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
        .al-btn.primary { background: #0f172a; color: white; border-color: #0f172a; }
        .al-btn.primary:hover { background: #1e293b; }

        .progress-bar {
          height: 3px;
          border-radius: 2px;
          background: #f1f5f9;
          overflow: hidden;
          margin-top: 8px;
        }

        @keyframes al-blink { 0%,100%{opacity:1} 50%{opacity:0.25} }
        .al-blink { animation: al-blink 2s ease-in-out infinite; }
      `}</style>

      <div className="al flex flex-col gap-6" style={{ background: "#f8fafc", padding: "2px 0 32px" }}>
        {loading && (
          <div className="al-card" style={{ padding: "12px 14px", fontSize: 12.5, color: "#64748b" }}>
            Loading alerts from database...
          </div>
        )}

        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>
              Risk Monitoring
            </p>
            <h1 className="al-serif" style={{ fontSize: 24, fontWeight: 500, color: "#0f172a", marginBottom: 4 }}>
              Alerts & Risk Detection
            </h1>
            <p style={{ fontSize: 13.5, color: "#64748b" }}>
              AI-powered clinical alerts &nbsp;·&nbsp;
              {counts.high > 0 && <span style={{ color: "#dc2626", fontWeight: 500 }}>{counts.high} critical require attention</span>}
              {counts.high === 0 && <span>No critical alerts active</span>}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="al-btn"><Eye style={{ width: 14, height: 14 }} /> View History</button>
            <button className="al-btn primary"><CheckCircle style={{ width: 14, height: 14 }} /> Mark All Read</button>
          </div>
        </div>

        {/* ── Stat Filter Cards ────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {[
            { key: "all",    label: "Total Alerts", value: counts.total,  icon: <Bell style={{ width: 16, height: 16, color: "#64748b" }} />,   valueColor: "#0f172a",  barColor: "#334155",  barPct: 100 },
            { key: "high",   label: "Critical",     value: counts.high,   icon: <AlertTriangle style={{ width: 16, height: 16, color: "#dc2626" }} />, valueColor: "#dc2626", barColor: "#ef4444", barPct: counts.total ? (counts.high / counts.total) * 100 : 0 },
            { key: "medium", label: "Moderate",     value: counts.medium, icon: <Clock style={{ width: 16, height: 16, color: "#b45309" }} />,   valueColor: "#b45309", barColor: "#f59e0b", barPct: counts.total ? (counts.medium / counts.total) * 100 : 0 },
            { key: "low",    label: "Low Risk",     value: counts.low,    icon: <Shield style={{ width: 16, height: 16, color: "#15803d" }} />,  valueColor: "#15803d", barColor: "#10b981", barPct: counts.total ? (counts.low / counts.total) * 100 : 0 },
          ].map((s) => (
            <div
              key={s.key}
              className="al-stat"
              style={severityFilter === s.key ? { borderLeft: `3px solid ${s.barColor}` } : {}}
              onClick={() => setSeverityFilter(s.key)}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div className="al-stat-icon">{s.icon}</div>
                <p style={{ fontSize: 26, fontWeight: 600, color: s.valueColor, letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</p>
              </div>
              <p style={{ fontSize: 12, color: "#94a3b8" }}>{s.label}</p>
              {s.key !== "all" && (
                <div className="progress-bar">
                  <div style={{ height: "100%", borderRadius: 2, background: s.barColor, width: `${s.barPct}%`, transition: "width 0.3s" }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Filter Bar ───────────────────────────────────────────── */}
        <div className="al-card" style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8" }}>
            <SlidersHorizontal style={{ width: 14, height: 14 }} />
            <span style={{ fontSize: 12.5, fontWeight: 500 }}>Filter by type:</span>
          </div>

          <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" }}>
            {Object.entries(typeMeta).map(([type, cfg]) => {
              const Icon  = cfg.icon;
              const count = alerts.filter((a) => a.type === type).length;
              return (
                <button
                  key={type}
                  className={`al-type-chip ${typeFilter === type ? "active" : ""}`}
                  onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
                >
                  <Icon style={{ width: 13, height: 13 }} />
                  {cfg.label}
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 6px", borderRadius: 20, background: typeFilter === type ? "rgba(255,255,255,0.2)" : "#f1f5f9", color: typeFilter === type ? "white" : "#64748b" }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {hasFilters && (
            <button
              className="al-btn"
              style={{ marginLeft: "auto", fontSize: 12.5 }}
              onClick={() => { setSeverityFilter("all"); setTypeFilter("all"); }}
            >
              <X style={{ width: 13, height: 13 }} /> Clear
            </button>
          )}
        </div>

        {/* ── Results count ────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 12.5, color: "#94a3b8" }}>
            Showing <span style={{ color: "#334155", fontWeight: 600 }}>{displayedAlerts.length}</span> of {filteredAlerts.length} alerts
            <span style={{ color: "#64748b" }}> · latest first (top 10)</span>
            {hasFilters && <span style={{ color: "#64748b" }}> · filtered</span>}
          </p>
        </div>

        {/* ── Two-column Alert List ─────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

          {/* Critical Alerts */}
          <div className="al-card" style={{ padding: "20px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="al-blink" style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Critical Alerts</p>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 9px", borderRadius: 4, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                {displayedCriticalAlerts.length} shown
              </span>
            </div>

            {displayedCriticalAlerts.length > 0 ? (
              displayedCriticalAlerts.map((alert) => {
                const patient  = getPatient(alert.patient_id);
                const typeCfg  = typeMeta[alert.type as keyof typeof typeMeta];
                const Icon     = typeCfg?.icon ?? AlertTriangle;
                return (
                  <div key={alert.id} className="al-alert-row" style={{ background: "#fff8f8", borderColor: "#fecaca", borderLeftWidth: 2.5, borderLeftColor: "#ef4444" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 7, background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon style={{ width: 15, height: 15, color: "#dc2626" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#0f172a", lineHeight: 1.45, marginBottom: 8 }}>
                        {alert.message}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Avatar style={{ width: 20, height: 20 }}>
                            <AvatarImage src={`https://i.pravatar.cc/100?u=${alert.patient_id}`} />
                            <AvatarFallback style={{ background: "#f1f5f9", color: "#475569", fontSize: 8, fontWeight: 600 }}>
                              {patient?.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <Link href={`/patients/${alert.patient_id}`} style={{ fontSize: 12, color: "#475569", fontWeight: 500, textDecoration: "none" }}>
                            {patient?.name}
                          </Link>
                        </div>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>
                          {new Date(alert.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {typeCfg && (
                          <span style={{ fontSize: 10.5, fontWeight: 600, padding: "1px 7px", borderRadius: 4, background: "#f1f5f9", color: "#64748b", marginLeft: "auto" }}>
                            {typeCfg.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight style={{ width: 14, height: 14, color: "#fca5a5", flexShrink: 0, marginTop: 2 }} />
                  </div>
                );
              })
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", color: "#94a3b8" }}>
                <CheckCircle style={{ width: 32, height: 32, color: "#bbf7d0", marginBottom: 8 }} />
                <p style={{ fontSize: 13 }}>No critical alerts</p>
              </div>
            )}
          </div>

          {/* Medium + Low Alerts */}
          <div className="al-card" style={{ padding: "20px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Other Alerts</p>
              <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 9px", borderRadius: 4, background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }}>
                {displayedOtherAlerts.length} shown
              </span>
            </div>

            {displayedOtherAlerts.length > 0 ? (
              displayedOtherAlerts.map((alert) => {
                const patient = getPatient(alert.patient_id);
                const sm      = severityMeta[alert.severity as keyof typeof severityMeta];
                const typeCfg = typeMeta[alert.type as keyof typeof typeMeta];
                const Icon    = typeCfg?.icon ?? Clock;
                return (
                  <div key={alert.id} className="al-alert-row"
                    style={{ background: sm.bg, borderColor: sm.border, borderLeftWidth: 2.5, borderLeftColor: sm.leftBorder }}>
                    <div style={{ width: 32, height: 32, borderRadius: 7, background: "white", border: `1px solid ${sm.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon style={{ width: 15, height: 15, color: sm.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#0f172a", lineHeight: 1.45, marginBottom: 8 }}>
                        {alert.message}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Avatar style={{ width: 20, height: 20 }}>
                            <AvatarImage src={`https://i.pravatar.cc/100?u=${alert.patient_id}`} />
                            <AvatarFallback style={{ background: "#f1f5f9", color: "#475569", fontSize: 8, fontWeight: 600 }}>
                              {patient?.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <Link href={`/patients/${alert.patient_id}`} style={{ fontSize: 12, color: "#475569", fontWeight: 500, textDecoration: "none" }}>
                            {patient?.name}
                          </Link>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 600, padding: "1px 7px", borderRadius: 4, background: "white", color: sm.color, border: `1px solid ${sm.border}` }}>
                          {sm.label}
                        </span>
                        {typeCfg && (
                          <span style={{ fontSize: 10.5, fontWeight: 600, padding: "1px 7px", borderRadius: 4, background: "#f1f5f9", color: "#64748b", marginLeft: "auto" }}>
                            {typeCfg.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight style={{ width: 14, height: 14, color: "#cbd5e1", flexShrink: 0, marginTop: 2 }} />
                  </div>
                );
              })
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", color: "#94a3b8" }}>
                <CheckCircle style={{ width: 32, height: 32, color: "#bbf7d0", marginBottom: 8 }} />
                <p style={{ fontSize: 13 }}>No other alerts</p>
              </div>
            )}
          </div>
        </div>

        {/* ── AI Risk Summary Strip ─────────────────────────────────── */}
        <div className="al-card" style={{ padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, borderLeft: "3px solid #334155" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 9, background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Activity style={{ width: 18, height: 18, color: "#334155" }} />
            </div>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", marginBottom: 3 }}>AI Risk Analysis</p>
              <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                2 patients show deteriorating trends. Recommend immediate review of <Link href="/patients/P003" style={{ color: "#0f172a", fontWeight: 500, textDecoration: "none", borderBottom: "1px solid #cbd5e1" }}>Amit Kumar</Link> — kidney function declining.
              </p>
            </div>
          </div>
          <button className="al-btn" style={{ whiteSpace: "nowrap" }}>
            View Details <ChevronRight style={{ width: 13, height: 13 }} />
          </button>
        </div>

      </div>
    </>
  );
}
