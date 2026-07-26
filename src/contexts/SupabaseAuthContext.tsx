"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────

type MemberRole = "admin" | "finance" | "vendor" | "viewer";

interface Organization {
  id: number;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  role: MemberRole;
}

interface Profile {
  full_name: string;
  website: string;
  country: string;
  wallet_address: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  orgs: Organization[];
  selectedOrg: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: MemberRole | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  selectOrg: (orgId: number) => void;
  refreshOrgs: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { data: { session: s } } = await supabase.auth.getSession();

      if (cancelled) return;
      if (s?.user) {
        setSession(s);
        setUser(s.user);

        const [{ data: profileData }, { data: orgsData }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", s.user.id).single(),
          supabase.from("members").select(`
            role,
            org_id,
            organizations (
              id, name, slug, description, created_at
            )
          `).order("joined_at", { ascending: false }),
        ]);

        if (cancelled) return;

        if (profileData) {
          setProfile({
            full_name: profileData.full_name || "",
            website: profileData.website || "",
            country: profileData.country || "",
            wallet_address: profileData.wallet_address || "",
          });
        }

        if (orgsData) {
          const orgList: Organization[] = orgsData.map((row: any) => ({
            id: row.org_id,
            name: row.organizations?.name || "",
            slug: row.organizations?.slug || "",
            description: row.organizations?.description || "",
            created_at: row.organizations?.created_at || "",
            role: row.role,
          }));
          setOrgs(orgList);
          if (orgList.length > 0) {
            setSelectedOrg(orgList[0]);
          }
        }
      }
      setIsLoading(false);
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        if (cancelled) return;
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const [{ data: profileData }, { data: orgsData }] = await Promise.all([
            supabase.from("profiles").select("*").eq("id", session.user.id).single(),
            supabase.from("members").select(`
              role, org_id,
              organizations (id, name, slug, description, created_at)
            `).order("joined_at", { ascending: false }),
          ]);

          if (!cancelled) {
            if (profileData) {
              setProfile({
                full_name: profileData.full_name || "",
                website: profileData.website || "",
                country: profileData.country || "",
                wallet_address: profileData.wallet_address || "",
              });
            }
            if (orgsData) {
              const orgList: Organization[] = orgsData.map((row: any) => ({
                id: row.org_id,
                name: row.organizations?.name || "",
                slug: row.organizations?.slug || "",
                description: row.organizations?.description || "",
                created_at: row.organizations?.created_at || "",
                role: row.role,
              }));
              setOrgs(orgList);
              if (orgList.length > 0 && !selectedOrg) {
                setSelectedOrg(orgList[0]);
              }
            }
          }
        } else {
          setProfile(null);
          setOrgs([]);
          setSelectedOrg(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  }, [supabase]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    return { error: error?.message };
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const selectOrg = useCallback((orgId: number) => {
    const org = orgs.find((o) => o.id === orgId);
    if (org) setSelectedOrg(org);
  }, [orgs]);

  const refreshOrgs = useCallback(async () => {
    const { data } = await supabase
      .from("members")
      .select(`
        role, org_id,
        organizations (id, name, slug, description, created_at)
      `)
      .order("joined_at", { ascending: false });

    if (data) {
      const orgList: Organization[] = data.map((row: any) => ({
        id: row.org_id,
        name: row.organizations?.name || "",
        slug: row.organizations?.slug || "",
        description: row.organizations?.description || "",
        created_at: row.organizations?.created_at || "",
        role: row.role,
      }));
      setOrgs(orgList);
      if (orgList.length > 0 && !selectedOrg) {
        setSelectedOrg(orgList[0]);
      }
    }
  }, [supabase, selectedOrg]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }
    return { error: error?.message };
  }, [supabase, user]);

  const value: AuthContextValue = {
    user,
    session,
    profile,
    orgs,
    selectedOrg,
    isLoading,
    isAuthenticated: !!user,
    role: selectedOrg?.role ?? null,
    signIn,
    signUp,
    signOut,
    selectOrg,
    refreshOrgs,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
