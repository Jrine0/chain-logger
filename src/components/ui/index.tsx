import { cn } from "@/lib/utils";
import { Button, Input, Textarea } from "./button";

export { Button, Input, Textarea };

/* ─── Card ────────────────────────────────────────────────────────── */

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: "maroon" | "gold" | "coral" | "none";
}

export function Card({ children, className, title, subtitle, icon, accent = "none" }: CardProps) {
  const accentBorder =
    accent === "maroon"
      ? "border-t-4 border-t-brand-700"
      : accent === "gold"
      ? "border-t-4 border-t-gold-400"
      : accent === "coral"
      ? "border-t-4 border-t-coral-500"
      : "";

  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white shadow-card hover-lift animate-fade-in",
        accentBorder,
        className
      )}
    >
      {(title || icon) && (
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            {icon && <span className="text-xl">{icon}</span>}
            {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
          </div>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ─── StatCard ────────────────────────────────────────────────────── */

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  trend?: { value: string; up?: boolean };
  accent?: "maroon" | "gold" | "coral";
}

export function StatCard({
  label,
  value,
  icon,
  subtitle,
  trend,
  accent = "maroon",
}: StatCardProps) {
  const accentBg =
    accent === "maroon"
      ? "bg-brand-50 border-brand-200"
      : accent === "gold"
      ? "bg-gold-50 border-gold-200"
      : "bg-coral-50 border-coral-200";

  const accentText =
    accent === "maroon"
      ? "text-brand-700"
      : accent === "gold"
      ? "text-gold-600"
      : "text-coral-600";

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-5 shadow-card hover-lift animate-fade-in",
        accentBg
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl text-lg",
              accent === "maroon"
                ? "bg-brand-100 text-brand-700"
                : accent === "gold"
                ? "bg-gold-100 text-gold-700"
                : "bg-coral-100 text-coral-700"
            )}
          >
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span
            className={cn(
              "font-medium",
              trend.up ? "text-emerald-600" : "text-red-500"
            )}
          >
            {trend.up ? "↑" : "↓"} {trend.value}
          </span>
          <span className="text-gray-400">vs last period</span>
        </div>
      )}
    </div>
  );
}

/* ─── Badge ───────────────────────────────────────────────────────── */

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "maroon";
  size?: "sm" | "md";
}

export function Badge({ children, variant = "default", size = "sm" }: BadgeProps) {
  const styles: Record<string, string> = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
    info: "bg-blue-50 text-blue-700 border border-blue-200",
    maroon: "bg-brand-50 text-brand-700 border border-brand-200",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        styles[variant],
        sizes[size]
      )}
    >
      {children}
    </span>
  );
}

/* ─── SectionTitle ────────────────────────────────────────────────── */

interface SectionTitleProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function SectionTitle({ title, description, action }: SectionTitleProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/* ─── TrustBadge ──────────────────────────────────────────────────── */

interface TrustBadgeProps {
  icon?: string;
  label: string;
}

export function TrustBadge({ icon = "🔒", label }: TrustBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-sm text-gray-600 border border-gray-200">
      <span>{icon}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}
