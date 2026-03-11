"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Bell,
  Shield,
  Database,
  Brain,
  Palette,
  Save,
  Lock,
  LogOut,
  Monitor,
  CheckCircle2,
} from "lucide-react";

const systemInfo = [
  { label: "Database",     status: "Connected", detail: "PostgreSQL", ok: true },
  { label: "Vector DB",    status: "Connected", detail: "Chroma",     ok: true },
  { label: "LLM Provider", status: "Active",    detail: "Gemini API", ok: true },
  { label: "API Status",   status: "Healthy",   detail: "FastAPI",    ok: true },
];

export default function SettingsPage() {
  const [notifs, setNotifs] = useState({ critical: true, lab: true, drug: true, email: false });
  const [ai, setAi]         = useState({ briefs: true, trends: true, guidelines: true, interactions: true });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Serif:wght@400;500&display=swap');

        .st { font-family: 'IBM Plex Sans', sans-serif; color: #0f172a; }
        .st * { box-sizing: border-box; }
        .st-serif { font-family: 'IBM Plex Serif', serif; }

        .st-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 22px 24px;
        }

        .st-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .st-section-desc {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 20px;
        }

        .st-field { display: flex; flex-direction: column; gap: 6px; }
        .st-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .st-input {
          border: 1px solid #e2e8f0;
          border-radius: 7px;
          padding: 8px 12px;
          font-size: 13.5px;
          font-family: 'IBM Plex Sans', sans-serif;
          color: #0f172a;
          background: #fafafa;
          outline: none;
          transition: border-color 0.14s;
          width: 100%;
        }
        .st-input:focus { border-color: #94a3b8; background: white; }

        .st-divider { border: none; border-top: 1px solid #f1f5f9; margin: 0; }

        .st-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 0;
          gap: 16px;
        }
        .st-toggle-label { font-size: 13.5px; font-weight: 500; color: #0f172a; margin-bottom: 2px; }
        .st-toggle-desc  { font-size: 12px; color: #94a3b8; }

        .st-btn {
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
          width: 100%;
          justify-content: flex-start;
          margin-bottom: 8px;
        }
        .st-btn:last-child { margin-bottom: 0; }
        .st-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
        .st-btn.primary { background: #0f172a; color: white; border-color: #0f172a; justify-content: center; width: auto; }
        .st-btn.primary:hover { background: #1e293b; }
        .st-btn.danger { color: #dc2626; border-color: #fecaca; }
        .st-btn.danger:hover { background: #fef2f2; }

        .st-sys-cell {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 14px 16px;
          flex: 1;
        }
      `}</style>

      <div className="st flex flex-col gap-6" style={{ background: "#f8fafc", padding: "2px 0 32px" }}>

        {/* ── Header ──────────────────────────────────────────────── */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>
            Preferences
          </p>
          <h1 className="st-serif" style={{ fontSize: 24, fontWeight: 500, color: "#0f172a", marginBottom: 4 }}>
            Settings
          </h1>
          <p style={{ fontSize: 13.5, color: "#64748b" }}>
            Manage your account and application preferences
          </p>
        </div>

        {/* ── Main Grid ─────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14 }}>

          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Profile */}
            <div className="st-card">
              <div className="st-section-title">
                <User style={{ width: 15, height: 15, color: "#64748b" }} />
                Profile Settings
              </div>
              <p className="st-section-desc">Update your personal information and preferences</p>

              {/* Avatar row */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #f1f5f9" }}>
                <Avatar style={{ width: 64, height: 64, border: "2px solid #e2e8f0" }}>
                  <AvatarFallback style={{ background: "#0f172a", color: "white", fontSize: 20, fontWeight: 600, fontFamily: "'IBM Plex Serif', serif" }}>
                    DR
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>Dr. Anil Verma</p>
                  <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>Internal Medicine · Kathir Memorial Hospital</p>
                  <button className="st-btn" style={{ width: "auto", marginBottom: 0, fontSize: 12.5 }}>Change Photo</button>
                </div>
              </div>

              {/* Fields */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                <div className="st-field">
                  <label className="st-label">First Name</label>
                  <input className="st-input" defaultValue="Anil" />
                </div>
                <div className="st-field">
                  <label className="st-label">Last Name</label>
                  <input className="st-input" defaultValue="Verma" />
                </div>
                <div className="st-field">
                  <label className="st-label">Email</label>
                  <input className="st-input" type="email" defaultValue="dr.verma@hospital.com" />
                </div>
                <div className="st-field">
                  <label className="st-label">Phone</label>
                  <input className="st-input" type="tel" defaultValue="+91 98765 43210" />
                </div>
                <div className="st-field">
                  <label className="st-label">Specialty</label>
                  <Select defaultValue="endocrinology">
                    <SelectTrigger style={{ borderRadius: 7, borderColor: "#e2e8f0", height: 38, fontSize: 13.5, fontFamily: "'IBM Plex Sans',sans-serif", background: "#fafafa" }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardiology">Cardiology</SelectItem>
                      <SelectItem value="endocrinology">Endocrinology</SelectItem>
                      <SelectItem value="nephrology">Nephrology</SelectItem>
                      <SelectItem value="general">General Medicine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="st-field">
                  <label className="st-label">Department</label>
                  <input className="st-input" defaultValue="Internal Medicine" />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="st-btn primary">
                  <Save style={{ width: 13, height: 13 }} /> Save Changes
                </button>
              </div>
            </div>

            {/* AI Settings */}
            <div className="st-card">
              <div className="st-section-title">
                <Brain style={{ width: 15, height: 15, color: "#64748b" }} />
                AI Assistant Settings
              </div>
              <p className="st-section-desc">Configure AI behaviour and clinical decision support</p>

              {[
                { key: "briefs",       label: "AI Consultation Briefs",   desc: "Automatically generate AI summaries for patient visits" },
                { key: "trends",       label: "Lab Trend Analysis",        desc: "AI-powered detection of concerning lab value trends" },
                { key: "guidelines",   label: "Clinical Guidelines",       desc: "Suggest relevant clinical guidelines based on diagnosis" },
                { key: "interactions", label: "Drug Interaction Checker",  desc: "Automatic checking of drug interactions when prescribing" },
              ].map((item, i, arr) => (
                <div key={item.key}>
                  <div className="st-toggle-row">
                    <div>
                      <p className="st-toggle-label">{item.label}</p>
                      <p className="st-toggle-desc">{item.desc}</p>
                    </div>
                    <Switch
                      checked={ai[item.key as keyof typeof ai]}
                      onCheckedChange={(v) => setAi((p) => ({ ...p, [item.key]: v }))}
                    />
                  </div>
                  {i < arr.length - 1 && <hr className="st-divider" />}
                </div>
              ))}
            </div>

            {/* System Info */}
            <div className="st-card">
              <div className="st-section-title">
                <Database style={{ width: 15, height: 15, color: "#64748b" }} />
                System Information
              </div>
              <p className="st-section-desc">Backend connection status and system health</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                {systemInfo.map((s) => (
                  <div key={s.label} className="st-sys-cell">
                    <p style={{ fontSize: 11.5, color: "#94a3b8", marginBottom: 6 }}>{s.label}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#15803d" }}>{s.status}</p>
                    </div>
                    <p style={{ fontSize: 11.5, color: "#94a3b8" }}>{s.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Notifications */}
            <div className="st-card" style={{ padding: "20px 20px" }}>
              <div className="st-section-title">
                <Bell style={{ width: 14, height: 14, color: "#64748b" }} />
                Notifications
              </div>
              <p className="st-section-desc" style={{ marginBottom: 4 }}>Alert and digest preferences</p>

              {[
                { key: "critical", label: "Critical Alerts",   desc: "Notify for critical patient alerts" },
                { key: "lab",      label: "Lab Results",        desc: "When new lab results arrive" },
                { key: "drug",     label: "Drug Interactions",  desc: "Potential interaction alerts" },
                { key: "email",    label: "Email Digest",       desc: "Daily summary of updates" },
              ].map((item, i, arr) => (
                <div key={item.key}>
                  <div className="st-toggle-row" style={{ padding: "11px 0" }}>
                    <div>
                      <p className="st-toggle-label" style={{ fontSize: 13 }}>{item.label}</p>
                      <p className="st-toggle-desc" style={{ fontSize: 11.5 }}>{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifs[item.key as keyof typeof notifs]}
                      onCheckedChange={(v) => setNotifs((p) => ({ ...p, [item.key]: v }))}
                    />
                  </div>
                  {i < arr.length - 1 && <hr className="st-divider" />}
                </div>
              ))}
            </div>

            {/* Appearance */}
            <div className="st-card" style={{ padding: "20px 20px" }}>
              <div className="st-section-title">
                <Palette style={{ width: 14, height: 14, color: "#64748b" }} />
                Appearance
              </div>
              <p className="st-section-desc">Display and theme preferences</p>
              <div className="st-field">
                <label className="st-label">Theme</label>
                <Select defaultValue="light">
                  <SelectTrigger style={{ borderRadius: 7, borderColor: "#e2e8f0", height: 38, fontSize: 13.5, fontFamily: "'IBM Plex Sans',sans-serif", background: "#fafafa" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Security */}
            <div className="st-card" style={{ padding: "20px 20px" }}>
              <div className="st-section-title">
                <Shield style={{ width: 14, height: 14, color: "#64748b" }} />
                Security
              </div>
              <p className="st-section-desc">Password and session management</p>

              <button className="st-btn"><Lock style={{ width: 13, height: 13 }} /> Change Password</button>
              <button className="st-btn"><Monitor style={{ width: 13, height: 13 }} /> Enable Two-Factor Auth</button>
              <button className="st-btn"><CheckCircle2 style={{ width: 13, height: 13 }} /> Active Sessions</button>
              <hr className="st-divider" style={{ margin: "10px 0" }} />
              <button className="st-btn danger"><LogOut style={{ width: 13, height: 13 }} /> Sign Out All Devices</button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}