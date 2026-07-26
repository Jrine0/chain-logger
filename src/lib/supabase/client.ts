"use client";

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function createClient() {
  if (!url || !key) {
    // Return a stub client that won't crash — used during SSR/build
    return {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        signInWithPassword: async () => ({ data: null, error: { message: "Supabase not configured" } }),
        signUp: async () => ({ data: null, error: { message: "Supabase not configured" } }),
        signOut: async () => ({}),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      }),
    } as any;
  }

  return createBrowserClient(url, key);
}
