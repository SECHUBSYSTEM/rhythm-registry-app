"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Profile, UserRole } from "@/types";
import { createClient } from "@/lib/supabase/client";

// ── Context Types ─────────────────────────────────────────────────────────

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{
    needsEmailVerification: boolean;
    email?: string;
  }>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapRowToProfile(
  row: {
    id: string;
    display_name: string | null;
    role: string;
    created_at: string;
  },
  email: string,
): Profile {
  return {
    id: row.id,
    email,
    displayName: row.display_name ?? undefined,
    role: row.role as UserRole,
    createdAt: row.created_at,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roleOverride, setRoleOverride] = useState<UserRole | null>(null);

  const [supabase] = useState(() => createClient());

  const fetchProfile = useCallback(
    async (userId: string, email: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, role, created_at")
        .eq("id", userId)
        .single();
      if (error || !data) return null;
      return mapRowToProfile(
        { ...data, display_name: data.display_name ?? null },
        email,
      );
    },
    [supabase],
  );

  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null);
        setRoleOverride(null);
        setIsLoading(false);
        return;
      }
      const profile = await fetchProfile(
        session.user.id,
        session.user.email ?? "",
      );
      setUser(profile ?? null);
      setRoleOverride(null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, fetchProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setIsLoading(false);
        throw error;
      }
      if (data.user) {
        const profile = await fetchProfile(data.user.id, data.user.email ?? "");
        setUser(profile ?? null);
      }
      setIsLoading(false);
    },
    [supabase.auth, fetchProfile],
  );

  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string,
    ): Promise<{ needsEmailVerification: boolean; email?: string }> => {
      setIsLoading(true);
      const origin =
        typeof window !== "undefined" ? window.location.origin : undefined;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name },
          emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
        },
      });
      if (error) {
        setIsLoading(false);
        throw error;
      }
      if (data.user) {
        const displayName = typeof name === "string" ? name.trim() : "";
        if (displayName) {
          await supabase
            .from("profiles")
            .update({
              display_name: displayName,
              updated_at: new Date().toISOString(),
            })
            .eq("id", data.user.id);
        }
        if (data.session) {
          const profile = await fetchProfile(
            data.user.id,
            data.user.email ?? "",
          );
          setUser(
            profile
              ? {
                  ...profile,
                  displayName:
                    displayName || profile.displayName || undefined,
                }
              : null,
          );
          setIsLoading(false);
          return { needsEmailVerification: false };
        }
        setIsLoading(false);
        return {
          needsEmailVerification: true,
          email: data.user.email ?? email,
        };
      }
      setIsLoading(false);
      return { needsEmailVerification: false };
    },
    [supabase, fetchProfile],
  );

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setRoleOverride(null);
      router.replace("/login");
    }
  }, [supabase.auth, router]);

  const switchRole = useCallback((role: UserRole) => {
    setRoleOverride(role);
  }, []);

  const effectiveRole = roleOverride ?? user?.role ?? "listener";

  return (
    <AuthContext.Provider
      value={{
        user,
        role: effectiveRole,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        switchRole,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
