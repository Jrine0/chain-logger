"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "finance" | "vendor" | "admin" | "viewer";
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, requiredRole, fallback }: ProtectedRouteProps) {
  const { isConnected, isLoadingRole, isFinance, isVendor, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || "/";

  // viewer means any authenticated user is allowed
  const isViewerOnly = requiredRole === "viewer";

  useEffect(() => {
    if (isLoadingRole) return;

    if (!isConnected) {
      router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (requiredRole && !isViewerOnly) {
      const allowed =
        requiredRole === "finance" ? isFinance :
        requiredRole === "vendor" ? isVendor :
        isAdmin;

      if (!allowed) {
        // User is authenticated but doesn't have the required role
      }
    }
  }, [isConnected, isLoadingRole, isFinance, isVendor, isAdmin, requiredRole, isViewerOnly, router, pathname]);

  if (isLoadingRole) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-brand-700 border-t-transparent" />
        </div>
      )
    );
  }

  if (!isConnected) {
    return fallback || null;
  }

  if (requiredRole && !isViewerOnly) {
    const allowed =
      requiredRole === "finance" ? isFinance :
      requiredRole === "vendor" ? isVendor :
      isAdmin;

    if (!allowed) {
      const currentRole = isAdmin ? "admin" : isFinance ? "finance" : isVendor ? "vendor" : "viewer";
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-500 max-w-md">
            This area requires the <span className="font-semibold capitalize text-brand-700">{requiredRole}</span> role.
            Your current role is <span className="font-semibold capitalize text-gold-600">{currentRole}</span>.
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
}
