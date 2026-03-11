"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchApi } from "@/lib/backend-api";
import {
  Search,
  UserPlus,
  Users,
  AlertCircle,
  Activity,
  Heart,
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";

const statusConfig = {
  stable:     { label: "Stable",     dot: "#10b981", bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  monitoring: { label: "Monitoring", dot: "#f59e0b", bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  critical:   { label: "Critical",   dot: "#ef4444", bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
};

export default function PatientsPage() {
  const [patientsData, setPatientsData] = useState<
    Array<{
      patient_id: string;
      name: string;
      age: number | null;
      gender: string;
      diagnosis: string[];
      allergies: string[];
      status: string;
      lastVisit: string | null;
    }>
  >([]);
  const [alertsData, setAlertsData] = useState<
    Array<{ patient_id: string; severity: "high" | "medium" | "low" }>
  >([]);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [patientsRes, dashboardRes] = await Promise.all([
          fetchApi<
            Array<{
              patient_id: string;
              name: string;
              age?: number;
              gender?: string;
              diagnosis?: string[];
              allergies?: string[];
              status?: string;
              lastVisit?: string | null;
            }>
          >("/api/patients"),
          fetchApi<{ alerts?: Array<{ patient_id: string; severity: "high" | "medium" | "low" }> }>(
            "/api/dashboard/data"
          ),
        ]);

        if (!active) return;
        setPatientsData(
          (patientsRes || []).map((p) => ({
            patient_id: p.patient_id,
            name: p.name,
            age: p.age ?? null,
            gender: p.gender || "Unknown",
            diagnosis: p.diagnosis || [],
            allergies: p.allergies || [],
            status: p.status || "stable",
            lastVisit: p.lastVisit || null,
          }))
        );
        setAlertsData(dashboardRes?.alerts || []);
      } catch {
        if (!active) return;
        setPatientsData([]);
        setAlertsData([]);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const filteredPatients = useMemo(() => patientsData.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.patient_id.toLowerCase().includes(search.toLowerCase()) ||
      p.diagnosis.some((d) => d.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  }), [patientsData, search, statusFilter]);

  const counts = useMemo(() => ({
    all:        patientsData.length,
    critical:   patientsData.filter((p) => p.status === "critical").length,
    monitoring: patientsData.filter((p) => p.status === "monitoring").length,
    stable:     patientsData.filter((p) => p.status === "stable").length,
  }), [patientsData]);

  const getAlerts = (pid: string) => alertsData.filter((a) => a.patient_id === pid);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Serif:wght@400;500&display=swap');

        .pl { font-family: 'IBM Plex Sans', sans-serif; color: #0f172a; }
        .pl * { box-sizing: border-box; }
        .pl-serif { font-family: 'IBM Plex Serif', serif; }

        .pl-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }

        /* Filter chip */
        .pl-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
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
        .pl-chip:hover { background: #f8fafc; border-color: #cbd5e1; }
        .pl-chip.active { background: #0f172a; color: white; border-color: #0f172a; }
        .pl-chip.critical.active  { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
        .pl-chip.monitoring.active { background: #fffbeb; color: #b45309; border-color: #fde68a; }
        .pl-chip.stable.active    { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }

        /* Patient card */
        .pl-patient-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px 18px;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          display: block;
          transition: all 0.16s ease;
        }
        .pl-patient-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }

        /* Search input */
        .pl-search {
          border: 1px solid #e2e8f0;
          border-radius: 7px;
          padding: 8px 12px 8px 36px;
          font-size: 13.5px;
          font-family: 'IBM Plex Sans', sans-serif;
          width: 100%;
          outline: none;
          color: #0f172a;
          background: white;
          transition: border-color 0.14s;
        }
        .pl-search:focus { border-color: #94a3b8; }
        .pl-search::placeholder { color: #94a3b8; }

        .pl-add-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 7px;
          background: #0f172a;
          color: white;
          font-size: 13px;
          font-weight: 500;
          font-family: 'IBM Plex Sans', sans-serif;
          border: none;
          cursor: pointer;
          transition: background 0.14s;
          white-space: nowrap;
        }
        .pl-add-btn:hover { background: #1e293b; }

        .pl-stat-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: all 0.14s;
        }
        .pl-stat-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
        .pl-stat-card.active-all       { border-left: 3px solid #334155; }
        .pl-stat-card.active-critical  { border-left: 3px solid #ef4444; }
        .pl-stat-card.active-monitoring{ border-left: 3px solid #f59e0b; }
        .pl-stat-card.active-stable    { border-left: 3px solid #10b981; }

        .pl-stat-icon {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .diag-tag {
          font-size: 11px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 4px;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          display: inline-block;
        }

        .empty-state {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 60px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
      `}</style>

      <div className="pl flex flex-col gap-6" style={{ background: "#f8fafc", padding: "2px 0 32px" }}>

        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>
              Patient Management
            </p>
            <h1 className="pl-serif" style={{ fontSize: 24, fontWeight: 500, color: "#0f172a", marginBottom: 4 }}>
              Patient List
            </h1>
            <p style={{ fontSize: 13.5, color: "#64748b" }}>
              {patientsData.length} registered patients &nbsp;·&nbsp; {counts.critical} critical
            </p>
          </div>
          <button className="pl-add-btn">
            <UserPlus style={{ width: 15, height: 15 }} />
            Add Patient
          </button>
        </div>

        {/* ── Stat Filter Cards ────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {[
            { key: "all",        label: "All Patients", value: counts.all,        icon: <Users style={{ width: 17, height: 17, color: "#64748b" }} />,   valueColor: "#0f172a" },
            { key: "critical",   label: "Critical",     value: counts.critical,   icon: <AlertCircle style={{ width: 17, height: 17, color: "#dc2626" }} />, valueColor: "#dc2626" },
            { key: "monitoring", label: "Monitoring",   value: counts.monitoring, icon: <Activity style={{ width: 17, height: 17, color: "#b45309" }} />,  valueColor: "#b45309" },
            { key: "stable",     label: "Stable",       value: counts.stable,     icon: <Heart style={{ width: 17, height: 17, color: "#15803d" }} />,     valueColor: "#15803d" },
          ].map((s) => (
            <div
              key={s.key}
              className={`pl-stat-card ${statusFilter === s.key ? `active-${s.key}` : ""}`}
              onClick={() => setStatusFilter(s.key)}
            >
              <div className="pl-stat-icon">{s.icon}</div>
              <div>
                <p style={{ fontSize: 22, fontWeight: 600, color: s.valueColor, letterSpacing: "-0.02em", lineHeight: 1 }}>
                  {s.value}
                </p>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search + Filter Bar ──────────────────────────────────── */}
        <div className="pl-card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8" }} />
            <input
              className="pl-search"
              placeholder="Search by name, ID or diagnosis…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { key: "all",        label: `All (${counts.all})` },
              { key: "critical",   label: `Critical (${counts.critical})` },
              { key: "monitoring", label: `Monitoring (${counts.monitoring})` },
              { key: "stable",     label: `Stable (${counts.stable})` },
            ].map((f) => (
              <button
                key={f.key}
                className={`pl-chip ${f.key} ${statusFilter === f.key ? "active" : ""}`}
                onClick={() => setStatusFilter(f.key)}
              >
                {f.key !== "all" && (
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: f.key === "critical" ? "#ef4444" : f.key === "monitoring" ? "#f59e0b" : "#10b981", display: "inline-block" }} />
                )}
                {f.label}
              </button>
            ))}
          </div>

          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 6, border: "1px solid #e2e8f0", background: "white", fontSize: 13, fontWeight: 500, color: "#64748b", cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <SlidersHorizontal style={{ width: 14, height: 14 }} />
            Filters
          </button>
        </div>

        {/* ── Results count ────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 12.5, color: "#94a3b8" }}>
            Showing <span style={{ color: "#334155", fontWeight: 600 }}>{filteredPatients.length}</span> of {patientsData.length} patients
            {statusFilter !== "all" && <span> · filtered by <span style={{ color: "#334155", fontWeight: 600 }}>{statusFilter}</span></span>}
          </p>
          {(search || statusFilter !== "all") && (
            <button
              style={{ fontSize: 12.5, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", textDecoration: "underline" }}
              onClick={() => { setSearch(""); setStatusFilter("all"); }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ── Patient Grid ─────────────────────────────────────────── */}
        {filteredPatients.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {filteredPatients.map((patient) => {
              const statusKey   =
                patient.status === "critical" || patient.status === "monitoring" || patient.status === "stable"
                  ? patient.status
                  : "stable";
              const s           = statusConfig[statusKey];
              const sSafe       = s || statusConfig.stable;
              const patAlerts   = getAlerts(patient.patient_id);
              const highAlerts  = patAlerts.filter((a) => a.severity === "high");

              return (
                <Link key={patient.patient_id} href={`/patients/${patient.patient_id}`} className="pl-patient-card"
                  style={{ ...(patient.status === "critical" ? { borderLeft: "2.5px solid #ef4444" } : {}) }}>

                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <Avatar style={{ width: 44, height: 44, border: "2px solid white", boxShadow: "0 1px 6px rgba(0,0,0,0.09)" }}>
                          <AvatarImage src={`https://i.pravatar.cc/100?u=${patient.patient_id}`} />
                          <AvatarFallback style={{ background: "#f1f5f9", color: "#475569", fontSize: 13, fontWeight: 600 }}>
                            {patient.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span style={{ position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: "50%", border: "2px solid white", background: sSafe.dot }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>{patient.name}</p>
                        <p style={{ fontSize: 12, color: "#94a3b8" }}>
                          {patient.age} yrs · {patient.gender} · <span style={{ fontFamily: "monospace", fontSize: 11 }}>{patient.patient_id}</span>
                        </p>
                      </div>
                    </div>

                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: sSafe.bg, color: sSafe.color, border: `1px solid ${sSafe.border}`, flexShrink: 0 }}>
                      {sSafe.label}
                    </span>
                  </div>

                  {/* Diagnosis tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                    {patient.diagnosis.map((d, i) => (
                      <span key={i} className="diag-tag">{d}</span>
                    ))}
                  </div>

                  {/* Allergy */}
                  {patient.allergies.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                      <ShieldAlert style={{ width: 12, height: 12, color: "#dc2626", flexShrink: 0 }} />
                      <span style={{ fontSize: 11.5, color: "#dc2626" }}>
                        {patient.allergies.join(", ")}
                      </span>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #f1f5f9", marginTop: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11.5, color: "#94a3b8" }}>Last visit: {patient.lastVisit || "N/A"}</span>
                      {highAlerts.length > 0 && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                          {highAlerts.length} alert{highAlerts.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <ChevronRight style={{ width: 15, height: 15, color: "#cbd5e1" }} />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div style={{ width: 52, height: 52, borderRadius: 10, background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Search style={{ width: 22, height: 22, color: "#94a3b8" }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 5 }}>No patients found</p>
            <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>Try adjusting your search or filter criteria</p>
            <button
              style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #e2e8f0", background: "white", fontSize: 13, fontWeight: 500, color: "#334155", cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif" }}
              onClick={() => { setSearch(""); setStatusFilter("all"); }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </>
  );
}
