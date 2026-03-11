"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Alert } from "@/lib/mock-data";
import { patients } from "@/lib/mock-data";
import {
  AlertTriangle,
  Clock,
  Pill,
  TrendingUp,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface AlertCardProps {
  alert: Alert;
}

const typeConfig = {
  drug_interaction: {
    icon: Pill,
    label: "Drug Interaction",
  },
  test_overdue: {
    icon: Clock,
    label: "Test Overdue",
  },
  critical_value: {
    icon: XCircle,
    label: "Critical Value",
  },
  pattern: {
    icon: TrendingUp,
    label: "Pattern Detected",
  },
};

const severityConfig = {
  high: {
    bgClass: "bg-destructive/10 border-destructive/30",
    iconClass: "text-destructive",
    badgeClass: "bg-destructive text-destructive-foreground",
  },
  medium: {
    bgClass: "bg-warning/10 border-warning/30",
    iconClass: "text-warning",
    badgeClass: "bg-warning text-warning-foreground",
  },
  low: {
    bgClass: "bg-muted border-border",
    iconClass: "text-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground",
  },
};

export function AlertCard({ alert }: AlertCardProps) {
  const type = typeConfig[alert.type];
  const severity = severityConfig[alert.severity];
  const TypeIcon = type.icon;
  const patient = patients.find((p) => p.patient_id === alert.patient_id);

  return (
    <Link href={`/patients/${alert.patient_id}`}>
      <Card
        className={cn(
          "cursor-pointer border transition-all hover:shadow-md",
          severity.bgClass
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                severity.bgClass
              )}
            >
              <TypeIcon className={cn("h-5 w-5", severity.iconClass)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    severity.badgeClass
                  )}
                >
                  {type.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(alert.timestamp).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="mt-1 font-medium text-foreground line-clamp-2">
                {alert.message}
              </p>
              {patient && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Patient: {patient.name}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
