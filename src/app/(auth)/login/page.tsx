"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/SupabaseAuthContext";

const supabase = createClient();

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { signIn, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  // Preserve redirect path
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get("redirectTo") || "/dashboard";
    sessionStorage.setItem("redirectAfterLogin", redirectTo);
  }, [pathname]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
      setIsSubmitting(false);
      return;
    }

    const redirectTo = sessionStorage.getItem("redirectAfterLogin") || "/dashboard";
    sessionStorage.removeItem("redirectAfterLogin");
    router.push(redirectTo);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-brand-700 text-white font-bold text-xl mb-4">
            C
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sign in to ChainLogger</h1>
          <p className="mt-2 text-sm text-gray-500">
            Access your organization&apos;s transparency dashboard
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="you@organization.org"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-brand-700 text-white font-medium py-2.5 hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <a href="/register" className="text-brand-700 font-medium hover:text-brand-800">
                Create one
              </a>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Need an organization? Register first, then create one from your dashboard.
        </p>
      </div>
    </div>
  );
}
