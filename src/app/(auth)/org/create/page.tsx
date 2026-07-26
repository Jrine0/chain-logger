"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/SupabaseAuthContext";

const supabase = createClient();

export default function CreateOrgPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirectTo=/org/create");
    }
  }, [isAuthenticated, authLoading, router]);

  // Auto-generate slug from name
  useEffect(() => {
    if (name && !slug) {
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 40)
      );
    }
  }, [name, slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!user) {
      setError("You must be logged in to create an organization.");
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await supabase
      .from("organizations")
      .insert({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        setError("An organization with this slug already exists. Try a different one.");
      } else {
        setError(error.message);
      }
      setIsSubmitting(false);
      return;
    }

    // Add creator as admin member
    const orgId = data.id;
    const { error: memberError } = await supabase
      .from("members")
      .insert({
        user_id: user.id,
        org_id: orgId,
        role: "admin",
      });

    if (memberError) {
      setError("Organization created but failed to add you as member. Contact support.");
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-brand-700 text-white font-bold text-xl mb-4">
            C
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Organization</h1>
          <p className="mt-2 text-sm text-gray-500">
            Set up your organization to start tracking funds transparently
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Organization name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
                placeholder="e.g. Acme Foundation"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1.5">
                URL slug
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 whitespace-nowrap">chain-logger.vercel.app/</span>
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setError(null); }}
                  placeholder="acme-foundation"
                  required
                  pattern="[a-z0-9-]+"
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Lowercase letters, numbers, and hyphens only</p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your organization"
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none"
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
              {isSubmitting ? "Creating organization..." : "Create Organization"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          You&apos;ll be added as an admin with full access.
        </p>
      </div>
    </div>
  );
}
