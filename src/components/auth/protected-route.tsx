"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/SupabaseAuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "finance" | "vendor" | "viewer";
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, requiredRole, fallback }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, role } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const redirectTo = encodeURIComponent(window.location.pathname);
      router.push(`/login?redirectTo=${redirectTo}`);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-brand-700 border-t-transparent" />
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return fallback || null;
  }

  if (requiredRole) {
    const roleHierarchy = ["viewer", "vendor", "finance", "admin"];
    const requiredLevel = roleHierarchy.indexOf(requiredRole);
    const currentLevel = roleHierarchy.indexOf(role || "viewer");

    if (currentLevel < requiredLevel) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-500 max-w-md">
            This area requires the <span className="font-semibold capitalize text-brand-700">{requiredRole}</span> role.
            Your current role is <span className="font-semibold capitalize text-gold-600">{role}</span>.
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
}
