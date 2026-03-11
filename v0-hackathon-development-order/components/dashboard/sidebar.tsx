"use client";

import { cn } from "@/lib/utils";
import {
  Users,
  LayoutDashboard,
  MessageSquare,
  Bell,
  Activity,
  Settings,
  Pill,
  FileText,
  Heart,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "My Patients", href: "/patients", icon: Users },
  { name: "AI Assistant", href: "/assistant", icon: MessageSquare },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Lab Results", href: "/labs", icon: Activity },
  { name: "Medications", href: "/medications", icon: Pill },
  { name: "Reports", href: "/reports", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [doctorName, setDoctorName] = useState("Dr. Doctor");
  const [department, setDepartment] = useState("General Medicine");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("medai_user");
      if (!raw) return;
      const user = JSON.parse(raw) as {
        name?: string;
        specialty?: string;
        department?: string;
      };
      if (user.name) setDoctorName(user.name.startsWith("Dr.") ? user.name : `Dr. ${user.name}`);
      if (user.specialty || user.department) {
        setDepartment(user.specialty || user.department || "General Medicine");
      }
    } catch {
      // Keep safe fallback labels when local storage payload is invalid.
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("medai_user");
      localStorage.removeItem("medai_role");
      document.cookie = "medai_auth=; path=/; max-age=0; samesite=lax";
    }
    router.push("/auth/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border/70 bg-card/95 shadow-2xl backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_-20%_0%,rgba(0,0,0,0.12),transparent_40%),radial-gradient(circle_at_120%_30%,rgba(0,0,0,0.08),transparent_35%)]" />

      <div className="relative z-10 flex h-16 items-center gap-3 px-6">
       <div className="lr-logo-box flex items-center justify-center">
  <img
    src="/app_logo.png"
    alt="MedAI Logo"
    className="w-[38px] h-[38px] object-contain"
  />
</div>
        <div>
          <span className="text-lg font-bold text-foreground">ClinSight AI</span>
          <span className="ml-1 text-xs font-medium text-muted-foreground">Pro</span>
        </div>
      </div>

      <nav className="relative z-10 flex-1 overflow-y-auto px-4 py-6">
        <ul className="flex flex-col gap-1.5">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="relative z-10 border-t border-border/70 p-4">
        <Link
          href="/settings"
          className={cn(
            "mb-3 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
            pathname === "/settings"
              ? "bg-primary text-primary-foreground shadow-lg"
              : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          )}
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>

        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/70 p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-border">
              <AvatarImage src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face" />
              <AvatarFallback className="bg-muted font-semibold text-foreground">
                AV
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">{doctorName}</p>
              <p className="text-xs text-muted-foreground">{department}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
