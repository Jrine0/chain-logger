import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "coral";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<string, string> = {
    primary:
      "bg-brand-700 text-white hover:bg-brand-800 focus:ring-brand-500 shadow-sm hover:shadow-md",
    secondary:
      "bg-brand-100 text-brand-800 hover:bg-brand-200 focus:ring-brand-400",
    outline:
      "border-2 border-brand-700 text-brand-700 hover:bg-brand-700 hover:text-white focus:ring-brand-500",
    ghost:
      "text-gray-600 hover:text-brand-700 hover:bg-brand-50 focus:ring-brand-400",
    coral:
      "bg-coral-500 text-white hover:bg-coral-600 focus:ring-coral-400 shadow-sm hover:shadow-md",
  };

  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-5 py-2.5 text-base rounded-xl",
    lg: "px-8 py-3.5 text-lg rounded-xl",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

/* ─── Input ───────────────────────────────────────────────────────── */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className, ...props }: InputProps) {
  const iconClass = icon ? "pl-10" : "";
  const errorClass = error ? "border-red-400 focus:border-red-500 focus:ring-red-200" : "";

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}
        <input
          className={cn(
            "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900",
            "placeholder:text-gray-400",
            "focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200",
            "transition-colors duration-200",
            iconClass,
            errorClass
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

/* ─── Textarea ────────────────────────────────────────────────────── */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  const errorClass = error ? "border-red-400 focus:border-red-500 focus:ring-red-200" : "";

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900",
          "placeholder:text-gray-400",
          "focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200",
          "transition-colors duration-200 resize-y",
          errorClass
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
