import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const isConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (new Proxy({} as SupabaseClient, {
      get(_, prop) {
        if (prop === "auth") {
          return {
            getSession: async () => ({ data: { session: null }, error: null }),
            getUser: async () => ({ data: { user: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signInWithOAuth: async () => ({ error: new Error("Supabase not configured") }),
            signInWithPassword: async () => ({ error: new Error("Supabase not configured") }),
            signUp: async () => ({ error: new Error("Supabase not configured") }),
            signOut: async () => ({ error: null }),
          };
        }
        return undefined;
      },
    }));

export { isConfigured as supabaseConfigured };
