"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchApi } from "@/lib/backend-api";
import {
  Search,
  Pill,
  AlertTriangle,
  Plus,
  ArrowRight,
  CheckCircle,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

const severityMeta = {
  High:     { bg: "#fff8f8", border: "#fecaca", leftBorder: "#ef4444", badgeBg: "#fef2f2", badgeColor: "#dc2626", badgeBorder: "#fecaca" },
  Moderate: { bg: "#fffdf5", border: "#fde68a", leftBorder: "#f59e0b", badgeBg: "#fffbeb", badgeColor: "#b45309", badgeBorder: "#fde68a" },
  Low:      { bg: "#f8fafc", border: "#e2e8f0", leftBorder: "#94a3b8", badgeBg: "#f1f5f9", badgeColor: "#64748b", badgeBorder: "#e2e8f0" },
};

export default function MedicationsPage() {
  const [patients, setPatients] = useState<Array<{ patient_id: string; name: string; diagnosis?: string[] }>>([]);
  const [medications, setMedications] = useState<
    Array<{ patient_id: string; drug: string; dose: string; frequency: string; start_date: string }>
  >([]);
  const [drugInteractions, setDrugInteractions] = useState<
    Array<{ drug_a: string; drug_b: string; severity: "High" | "Moderate" | "Low"; risk: string }>
  >([]);
  const [visits, setVisits] = useState<Array<{ patient_id: string; doctor?: string; department?: string }>>([]);
  const [doctorName, setDoctorName] = useState("");
  const [doctorDept, setDoctorDept] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<string>("all");
  const [search, setSearch]                   = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [patientsRes, dashboard] = await Promise.all([
          fetchApi<Array<{ patient_id: string; name: string; diagnosis?: string[] }>>("/api/patients"),
          fetchApi<{
            medications?: Array<Record<string, unknown>>;
            visits?: Array<Record<string, unknown>>;
            drugInteractions?: Array<Record<string, unknown>>;
          }>("/api/dashboard/data"),
        ]);
        if (!active) return;
        setPatients(patientsRes || []);
        setMedications(
          (dashboard?.medications || []).map((m) => ({
            patient_id: String(m.patient_id || ""),
            drug: String(m.drug || m.name || ""),
            dose: String(m.dose || ""),
            frequency: String(m.frequency || ""),
            start_date: String(m.start_date || new Date().toISOString()),
          }))
        );
        setVisits(
          (dashboard?.visits || []).map((v) => ({
            patient_id: String(v.patient_id || ""),
            doctor: String(v.doctor || ""),
            department: String(v.department || ""),
          }))
        );
        setDrugInteractions(
          (dashboard?.drugInteractions || []).map((d) => ({
            drug_a: String(d.drug_a || d.drug1 || ""),
            drug_b: String(d.drug_b || d.drug2 || ""),
            severity: (String(d.severity || "Low") as "High" | "Moderate" | "Low"),
            risk: String(d.risk || d.effect || ""),
          }))
        );
      } catch {
        if (!active) return;
        setPatients([]);
        setMedications([]);
        setVisits([]);
        setDrugInteractions([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("medai_user");
        if (raw) {
          const u = JSON.parse(raw) as { name?: string; specialty?: string; department?: string };
          setDoctorName(String(u.name || ""));
          setDoctorDept(String(u.specialty || u.department || ""));
        }
      } catch {
        // ignore local storage parse errors
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const normalizeParts = (value: string) =>
    String(value || "")
      .toLowerCase()
      .split(/&|,|\/|\band\b/)
      .map((p) => p.replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim())
      .filter(Boolean);

  const doctorRelatedPatientIds = useMemo(() => {
    if (!doctorName && !doctorDept) return new Set<string>();
    const nameNorm = doctorName.toLowerCase().replace(/^dr\.?\s*/, "").trim();
    const deptParts = normalizeParts(doctorDept);
    return new Set(
      visits
        .filter((v) => {
          const vName = String(v.doctor || "").toLowerCase().replace(/^dr\.?\s*/, "").trim();
          const vDeptParts = normalizeParts(String(v.department || ""));
          const sameDoctor = !!nameNorm && !!vName && (vName.includes(nameNorm) || nameNorm.includes(vName));
          const sameDept = !!deptParts.length && !!vDeptParts.length && deptParts.some((a) => vDeptParts.some((b) => a.includes(b) || b.includes(a)));
          return sameDoctor || sameDept;
        })
        .map((v) => v.patient_id)
        .filter(Boolean)
    );
  }, [visits, doctorName, doctorDept]);

  const scopedMedications = useMemo(() => {
    if (doctorRelatedPatientIds.size === 0) return medications;
    return medications.filter((m) => doctorRelatedPatientIds.has(m.patient_id));
  }, [medications, doctorRelatedPatientIds]);

  const scopedInteractions = useMemo(() => {
    const allowed = new Set(scopedMedications.map((m) => m.drug.toLowerCase()));
    return drugInteractions.filter((d) => allowed.has(d.drug_a.toLowerCase()) || allowed.has(d.drug_b.toLowerCase()));
  }, [drugInteractions, scopedMedications]);

  const filteredMeds = scopedMedications.filter((med) => {
    const patient     = patients.find((p) => p.patient_id === med.patient_id);
    const matchPat    = selectedPatient === "all" || med.patient_id === selectedPatient;
    const matchSearch = search === "" || patient?.name.toLowerCase().includes(search.toLowerCase()) || med.drug.toLowerCase().includes(search.toLowerCase());
    return matchPat && matchSearch;
  });

  const checkInteractions = (patientId: string) => {
    const drugs = scopedMedications.filter((m) => m.patient_id === patientId).map((m) => m.drug);
    const found: typeof drugInteractions = [];
    drugs.forEach((a) => drugs.forEach((b) => {
      if (a === b) return;
      const hit = scopedInteractions.find((d) => (d.drug_a === a && d.drug_b === b) || (d.drug_a === b && d.drug_b === a));
      if (hit && !found.some((f) => (f.drug_a === hit.drug_a && f.drug_b === hit.drug_b) || (f.drug_a === hit.drug_b && f.drug_b === hit.drug_a))) found.push(hit);
    }));
    return found;
  };

  const patientsWithMeds = patients.filter((p) => scopedMedications.some((m) => m.patient_id === p.patient_id));
  const uniqueDrugs      = [...new Set(scopedMedications.map((m) => m.drug))];
  const highCount        = scopedInteractions.filter((d) => d.severity === "High").length;
  const moderateCount    = scopedInteractions.filter((d) => d.severity === "Moderate").length;
  const patientInteractions = selectedPatient !== "all" ? checkInteractions(selectedPatient) : [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Serif:wght@400;500&display=swap');

        .mx { font-family: 'IBM Plex Sans', sans-serif; color: #0f172a; }
        .mx * { box-sizing: border-box; }
        .mx-serif { font-family: 'IBM Plex Serif', serif; }

        .mx-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }

        .mx-stat {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 13px;
        }
        .mx-stat-icon {
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

        .mx-btn {
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
        .mx-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
        .mx-btn.primary { background: #0f172a; color: white; border-color: #0f172a; }
        .mx-btn.primary:hover { background: #1e293b; }

        .mx-search {
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
        .mx-search:focus { border-color: #94a3b8; }
        .mx-search::placeholder { color: #94a3b8; }

        .mx-interaction-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 13px 15px;
          border-radius: 8px;
          border: 1px solid;
          margin-bottom: 8px;
        }
        .mx-interaction-row:last-child { margin-bottom: 0; }

        .mx-db-card {
          background: white;
          border: 1px solid;
          border-radius: 8px;
          padding: 14px 15px;
          border-left-width: 2.5px;
        }

        /* Table */
        .mx-table { width: 100%; border-collapse: collapse; }
        .mx-table th {
          text-align: left;
          font-size: 11.5px;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 10px 14px;
          border-bottom: 1px solid #f1f5f9;
          background: #fafafa;
        }
        .mx-table th:first-child { border-radius: 7px 0 0 0; }
        .mx-table th:last-child  { border-radius: 0 7px 0 0; }
        .mx-table td {
          padding: 12px 14px;
          font-size: 13px;
          color: #334155;
          border-bottom: 1px solid #f8fafc;
          vertical-align: middle;
        }
        .mx-table tr:last-child td { border-bottom: none; }
        .mx-table tr:hover td { background: #fafafa; }

        .mx-drug-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
        }

        @keyframes mx-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .mx-blink { animation: mx-blink 2s ease-in-out infinite; }
      `}</style>

      <div className="mx flex flex-col gap-6" style={{ background: "#f8fafc", padding: "2px 0 32px" }}>
        {loading && (
          <div className="mx-card" style={{ padding: "12px 14px", fontSize: 12.5, color: "#64748b" }}>
            Loading medications from database...
          </div>
        )}

        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>
              Prescriptions
            </p>
            <h1 className="mx-serif" style={{ fontSize: 24, fontWeight: 500, color: "#0f172a", marginBottom: 4 }}>
              Medications
            </h1>
            <p style={{ fontSize: 13.5, color: "#64748b" }}>
              Manage prescriptions and check drug interactions
            </p>
          </div>
          <button className="mx-btn primary">
            <Plus style={{ width: 14, height: 14 }} /> Add Prescription
          </button>
        </div>

        {/* ── Stat Cards ────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {[
            { label: "Active Prescriptions", value: scopedMedications.length,  icon: <Pill style={{ width: 17, height: 17, color: "#64748b" }} />,    valueColor: "#0f172a", warn: false },
            { label: "Unique Drugs",          value: uniqueDrugs.length,  icon: <Pill style={{ width: 17, height: 17, color: "#64748b" }} />,    valueColor: "#0f172a", warn: false },
            { label: "Moderate Interactions", value: moderateCount,       icon: <AlertTriangle style={{ width: 17, height: 17, color: "#b45309" }} />, valueColor: "#b45309", warn: false },
            { label: "High-Risk Interactions",value: highCount,           icon: <ShieldAlert style={{ width: 17, height: 17, color: "#dc2626" }} />,   valueColor: "#dc2626", warn: true },
          ].map((s, i) => (
            <div key={i} className="mx-stat" style={s.warn ? { borderLeft: "2.5px solid #ef4444" } : {}}>
              <div className="mx-stat-icon" style={s.warn ? { background: "#fef2f2", borderColor: "#fecaca" } : {}}>
                {s.icon}
              </div>
              <div>
                <p style={{ fontSize: 24, fontWeight: 600, color: s.valueColor, letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ───────────────────────────────────────────────── */}
        <div className="mx-card" style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8" }} />
            <input
              className="mx-search"
              placeholder="Search by patient name or drug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger style={{ width: 180, borderRadius: 7, borderColor: "#e2e8f0", height: 38, fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              <SelectValue placeholder="All patients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" style={{ fontSize: 13 }}>All Patients</SelectItem>
              {patientsWithMeds.map((p) => (
                <SelectItem key={p.patient_id} value={p.patient_id} style={{ fontSize: 13 }}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Drug Interaction Check (patient selected) ─────────────── */}
        {selectedPatient !== "all" && (
          <div className="mx-card" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              {patientInteractions.length > 0
                ? <><span className="mx-blink" style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} /><p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Drug Interaction Check</p><span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", marginLeft: 4 }}>{patientInteractions.length} found</span></>
                : <><CheckCircle style={{ width: 16, height: 16, color: "#15803d" }} /><p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Drug Interaction Check</p></>
              }
            </div>

            {patientInteractions.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderRadius: 7, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <CheckCircle style={{ width: 15, height: 15, color: "#15803d", flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: "#15803d", fontWeight: 500 }}>No known drug interactions found for this patient.</p>
              </div>
            ) : (
              <div>
                {patientInteractions.map((ix, i) => {
                  const sm = severityMeta[ix.severity as keyof typeof severityMeta] ?? severityMeta.Low;
                  return (
                    <div key={i} className="mx-interaction-row" style={{ background: sm.bg, borderColor: sm.border, borderLeftColor: sm.leftBorder, borderLeftWidth: 2.5 }}>
                      <div style={{ flexShrink: 0, marginTop: 1 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: sm.badgeBg, color: sm.badgeColor, border: `1px solid ${sm.badgeBorder}` }}>
                          {ix.severity}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{ix.drug_a}</span>
                          <ArrowRight style={{ width: 13, height: 13, color: "#94a3b8" }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{ix.drug_b}</span>
                        </div>
                        <p style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.5 }}>{ix.risk}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Main Grid: Table + Interaction DB ─────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14 }}>

          {/* Prescriptions Table */}
          <div className="mx-card" style={{ padding: "20px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                Active Prescriptions
                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400, marginLeft: 8 }}>({filteredMeds.length})</span>
              </p>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="mx-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Drug</th>
                    <th>Dose</th>
                    <th>Frequency</th>
                    <th>Start Date</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMeds.map((med, i) => {
                    const patient = patients.find((p) => p.patient_id === med.patient_id);
                    const hasIx   = drugInteractions.some((d) =>
                      (d.drug_a === med.drug || d.drug_b === med.drug) &&
                      scopedMedications.some((m) => m.patient_id === med.patient_id && m.drug !== med.drug && (d.drug_a === m.drug || d.drug_b === m.drug))
                    );
                    return (
                      <tr key={i}>
                        <td>
                          <Link href={`/patients/${med.patient_id}`} style={{ fontSize: 13, fontWeight: 500, color: "#0f172a", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                            {patient?.name ?? med.patient_id}
                            <ExternalLink style={{ width: 11, height: 11, color: "#94a3b8" }} />
                          </Link>
                        </td>
                        <td>
                          <div className="mx-drug-tag">
                            <Pill style={{ width: 13, height: 13, color: "#64748b" }} />
                            {med.drug}
                            {hasIx && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", display: "inline-block", marginLeft: 2 }} title="Interaction flagged" />}
                          </div>
                        </td>
                        <td style={{ color: "#475569" }}>{med.dose}</td>
                        <td style={{ color: "#475569" }}>{med.frequency}</td>
                        <td style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: 12 }}>
                          {new Date(med.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td>
                          <button style={{ fontSize: 12, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 500 }}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMeds.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: 13 }}>
                        No prescriptions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Drug Interaction Database */}
          <div className="mx-card" style={{ padding: "20px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Interaction Database</p>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{scopedInteractions.length} pairs</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {scopedInteractions.map((ix, i) => {
                const sm = severityMeta[ix.severity as keyof typeof severityMeta] ?? severityMeta.Low;
                return (
                  <div key={i} className="mx-db-card" style={{ background: sm.bg, borderColor: sm.border, borderLeftColor: sm.leftBorder }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: sm.badgeBg, color: sm.badgeColor, border: `1px solid ${sm.badgeBorder}` }}>
                        {ix.severity}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{ix.drug_a}</span>
                      <ArrowRight style={{ width: 12, height: 12, color: "#94a3b8" }} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{ix.drug_b}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{ix.risk}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </>
  );
}
