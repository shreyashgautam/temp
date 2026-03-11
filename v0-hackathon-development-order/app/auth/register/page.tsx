"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseMedical, Lock, Mail, Stethoscope, User, ArrowRight, CheckCircle2 } from "lucide-react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:4000";

export default function DoctorRegisterPage() {
  const router = useRouter();
  const [name, setName]                     = useState("");
  const [department, setDepartment]         = useState("");
  const [email, setEmail]                   = useState("");
  const [password, setPassword]             = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState("");
  const [focused, setFocused]               = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.cookie.includes("medai_auth=1")) router.replace("/dashboard");
  }, [router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "doctor", name, email, password, department, specialty: department }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Registration failed");
      localStorage.setItem("medai_user", JSON.stringify(data.user));
      localStorage.setItem("medai_role", "doctor");
      document.cookie = "medai_auth=1; path=/; max-age=2592000; samesite=lax";
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const pwMatch = confirmPassword.length > 0 && password === confirmPassword;

  const fields = [
    { key: "name",    label: "Full Name",        type: "text",     placeholder: "Dr. Nandakumar",     icon: <User style={{ width: 15, height: 15 }} />,              value: name,            set: setName            },
    { key: "dept",    label: "Department",        type: "text",     placeholder: "Diabetology",         icon: <BriefcaseMedical style={{ width: 15, height: 15 }} />, value: department,      set: setDepartment      },
    { key: "email",   label: "Email Address",     type: "email",    placeholder: "doctor@medai.com",    icon: <Mail style={{ width: 15, height: 15 }} />,             value: email,           set: setEmail           },
    { key: "pass",    label: "Password",          type: "password", placeholder: "••••••••",            icon: <Lock style={{ width: 15, height: 15 }} />,             value: password,        set: setPassword        },
    { key: "conf",    label: "Confirm Password",  type: "password", placeholder: "••••••••",            icon: <Lock style={{ width: 15, height: 15 }} />,             value: confirmPassword, set: setConfirmPassword },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Serif:ital,wght@0,400;0,500;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .rg {
          font-family: 'IBM Plex Sans', sans-serif;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          overflow: hidden;
        }
        @media (max-width: 860px) {
          .rg { grid-template-columns: 1fr; }
          .rg-left { display: none; }
        }

        /* ═══ LEFT — dark branding ═══════════════════════════════ */
        .rg-left {
          background: #0f172a;
          position: relative;
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 44px 52px 48px;
          overflow: hidden;
        }
        .rg-left::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 44px 44px;
          pointer-events: none;
        }
        .rg-glow1 { position: absolute; top: -140px; left: -100px; width: 520px; height: 520px; border-radius: 50%; background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%); pointer-events: none; }
        .rg-glow2 { position: absolute; bottom: -80px; right: -60px; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(20,184,166,0.07) 0%, transparent 65%); pointer-events: none; }

        .rg-logo { display: inline-flex; align-items: center; gap: 11px; position: relative; z-index: 2; }
        .rg-logo-box { width: 42px; height: 42px; border-radius: 11px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; }

        /* Steps list */
        .rg-steps { position: relative; z-index: 2; }
        .step-row { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 22px; }
        .step-row:last-child { margin-bottom: 0; }
        .step-num {
          width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          color: #64748b; margin-top: 1px;
        }

        .rg-copy { position: relative; z-index: 2; }

        /* ═══ RIGHT — white form ══════════════════════════════════ */
        .rg-right {
          background: #ffffff;
          display: flex; align-items: center; justify-content: center;
          padding: 40px 40px;
          position: relative;
          border-left: 1px solid #e2e8f0;
          overflow-y: auto;
        }
        .rg-right::after {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent 0%, #e2e8f0 40%, #cbd5e1 60%, transparent 100%);
        }

        .rg-form-wrap {
          width: 100%; max-width: 380px;
          animation: fadeUp 0.5s ease forwards;
          padding: 12px 0;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        .rg-badge {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 5px 13px; border-radius: 20px;
          background: #f8fafc; border: 1px solid #e2e8f0;
          font-size: 11.5px; font-weight: 600; color: #64748b;
          margin-bottom: 22px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .rg-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #6366f1; box-shadow: 0 0 6px rgba(99,102,241,0.5); }

        .rg-title {
          font-family: 'IBM Plex Serif', serif;
          font-size: 30px; font-weight: 500;
          color: #0f172a; letter-spacing: -0.025em; line-height: 1.18;
          margin-bottom: 6px;
        }
        .rg-sub { font-size: 14px; color: #94a3b8; margin-bottom: 28px; line-height: 1.65; }

        /* Field */
        .rg-field { margin-bottom: 13px; }
        .rg-field-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .rg-label { font-size: 11.5px; font-weight: 600; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase; }

        .rg-input-wrap {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .rg-input-wrap.focus { border-color: #94a3b8; background: #ffffff; box-shadow: 0 0 0 4px rgba(148,163,184,0.1); }
        .rg-input-wrap.valid { border-color: #bbf7d0; }
        .rg-icon { color: #cbd5e1; flex-shrink: 0; transition: color 0.18s; }
        .rg-input-wrap.focus .rg-icon { color: #94a3b8; }
        .rg-input {
          flex: 1; border: none; outline: none; background: transparent;
          font-size: 13.5px; color: #0f172a;
          font-family: 'IBM Plex Sans', sans-serif;
        }
        .rg-input::placeholder { color: #cbd5e1; }

        /* Submit */
        .rg-submit {
          width: 100%; padding: 12px 20px; margin-top: 20px;
          border-radius: 10px; border: none;
          background: #0f172a; color: #f8fafc;
          font-size: 14px; font-weight: 600;
          font-family: 'IBM Plex Sans', sans-serif;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s; letter-spacing: 0.01em;
          box-shadow: 0 2px 12px rgba(15,23,42,0.18);
        }
        .rg-submit:hover:not(:disabled) { background: #1e293b; box-shadow: 0 6px 20px rgba(15,23,42,0.25); transform: translateY(-1px); }
        .rg-submit:disabled { opacity: 0.45; cursor: not-allowed; }

        .ld { width: 5px; height: 5px; border-radius: 50%; background: #64748b; display: inline-block; animation: ldB 1.2s ease-in-out infinite; }
        .ld:nth-child(2){animation-delay:0.18s} .ld:nth-child(3){animation-delay:0.36s}
        @keyframes ldB { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

        .rg-error { font-size: 13px; color: #dc2626; margin-top: 12px; padding: 10px 14px; border-radius: 8px; background: #fef2f2; border: 1px solid #fecaca; }

        .rg-sep { display: flex; align-items: center; gap: 12px; margin: 22px 0 14px; }
        .rg-sep::before,.rg-sep::after { content:''; flex:1; height:1px; background:#f1f5f9; }
        .rg-sep span { font-size: 12px; color: #cbd5e1; white-space: nowrap; }

        .rg-login {
          display: block; text-align: center; padding: 11px;
          border-radius: 10px; border: 1.5px solid #e2e8f0;
          background: transparent;
          font-size: 13.5px; font-weight: 500; color: #475569;
          text-decoration: none; transition: all 0.15s;
        }
        .rg-login:hover { border-color: #cbd5e1; background: #f8fafc; color: #0f172a; }

        .rg-footer { margin-top: 26px; padding-top: 20px; border-top: 1px solid #f1f5f9; display: flex; align-items: center; gap: 8px; }
      `}</style>

      <div className="rg">

        {/* ═══ LEFT — dark branding ══════════════════════════════ */}
        <div className="rg-left">
          <div className="rg-glow1" /><div className="rg-glow2" />

          {/* Logo */}
          <div className="rg-logo">
            <div className="rg-logo-box">
              <Stethoscope style={{ width: 18, height: 18, color: "#94a3b8" }} />
            </div>
            <div>
              <p style={{ fontFamily: "'IBM Plex Serif',serif", fontSize: 15, color: "#e2e8f0", fontWeight: 500 }}>MedAI Pro</p>
              <p style={{ fontSize: 11, color: "#334155", marginTop: 1 }}>Doctor Onboarding</p>
            </div>
          </div>

          {/* Copy */}
          <div className="rg-copy">
            <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#334155", marginBottom: 18 }}>
              Create Secure Access
            </p>
            <h2 style={{ fontFamily: "'IBM Plex Serif',serif", fontSize: 34, fontWeight: 500, color: "#f1f5f9", lineHeight: 1.22, marginBottom: 16, letterSpacing: "-0.02em", maxWidth: 360 }}>
              Join the clinical<br />intelligence platform.
            </h2>
            <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.78, maxWidth: 360, marginBottom: 48 }}>
              Set up your doctor profile and start using AI-assisted workflows for your patients today.
            </p>

            {/* Steps */}
            <div className="rg-steps">
              {[
                { n: "01", title: "Create your profile",     desc: "Enter your name, department and credentials" },
                { n: "02", title: "Access your dashboard",   desc: "AI briefs, alerts and lab trends — instantly" },
                { n: "03", title: "Start helping patients",  desc: "RAG-powered insights for smarter decisions"   },
              ].map((s) => (
                <div key={s.n} className="step-row">
                  <div className="step-num">{s.n}</div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "#94a3b8", marginBottom: 3 }}>{s.title}</p>
                    <p style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.6 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Feature chips */}
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 40 }}>
              {["AI Clinical Briefs", "Drug Interaction AI", "RAG Summaries", "Live Alerts"].map((f) => (
                <span key={f} style={{ fontSize: 11.5, fontWeight: 500, padding: "5px 12px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "#475569" }}>{f}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT — white form ═══════════════════════════════════ */}
        <div className="rg-right">
          <div className="rg-form-wrap">

            <div className="rg-badge">
              <div className="rg-badge-dot" />
              Doctor Registration
            </div>

            <h1 className="rg-title">Create your<br />doctor profile.</h1>
            <p className="rg-sub">Fill in your details to set up your MedAI Pro account.</p>

            <form onSubmit={onSubmit}>
              {fields.map((f) => {
                const isConf   = f.key === "conf";
                const isValid  = isConf && pwMatch;
                const isFocused = focused === f.key;
                return (
                  <div key={f.key} className="rg-field">
                    <div className="rg-field-top">
                      <span className="rg-label">{f.label}</span>
                      {isConf && pwMatch && (
                        <span style={{ fontSize: 11.5, color: "#15803d", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          <CheckCircle2 style={{ width: 12, height: 12 }} /> Match
                        </span>
                      )}
                    </div>
                    <div className={`rg-input-wrap ${isFocused ? "focus" : ""} ${isValid ? "valid" : ""}`}>
                      <span className="rg-icon">{f.icon}</span>
                      <input
                        className="rg-input"
                        type={f.type}
                        required
                        value={f.value}
                        onChange={(e) => f.set(e.target.value)}
                        onFocus={() => setFocused(f.key)}
                        onBlur={() => setFocused(null)}
                        placeholder={f.placeholder}
                      />
                    </div>
                  </div>
                );
              })}

              <button className="rg-submit" type="submit" disabled={loading}>
                {loading
                  ? <><span className="ld" /><span className="ld" /><span className="ld" /></>
                  : <>Create Account <ArrowRight style={{ width: 15, height: 15 }} /></>
                }
              </button>

              {error && <div className="rg-error">{error}</div>}
            </form>

            <div className="rg-sep"><span>Already have an account?</span></div>
            <Link href="/auth/login" className="rg-login">Sign in instead</Link>

            <div className="rg-footer">
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#e2e8f0", display: "inline-block", flexShrink: 0 }} />
              <p style={{ fontSize: 11.5, color: "#cbd5e1" }}>Kathir Memorial Hospital · Vengavasal, Tamil Nadu</p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}