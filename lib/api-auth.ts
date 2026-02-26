import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/types";

export interface AuthUser {
  id: string;
  email?: string | null;
  user_metadata?: { display_name?: string; signup_role?: string };
}

export interface AuthResult {
  user: AuthUser;
  profile: Profile;
}

export interface AuthError {
  error: NextResponse;
}

/**
 * Get current user from Supabase. Returns 401 response if not authenticated.
 */
export async function requireAuth(
  supabase: SupabaseClient
): Promise<AuthResult | AuthError> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return {
      error: NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      ),
    };
  }
  const profile = await getProfile(supabase, user.id, user.email ?? "");
  if (!profile) {
    return {
      error: NextResponse.json(
        { error: "Profile not found" },
        { status: 401 }
      ),
    };
  }
  return {
    user: {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata as AuthUser["user_metadata"],
    },
    profile,
  };
}

/**
 * Require one of the given roles. Call after requireAuth or with supabase + user.
 * Returns 403 response if role not allowed.
 */
export async function requireRole(
  supabase: SupabaseClient,
  userId: string,
  allowedRoles: UserRole[]
): Promise<AuthResult | AuthError> {
  const profile = await getProfile(supabase, userId, "");
  if (!profile) {
    return {
      error: NextResponse.json({ error: "Profile not found" }, { status: 403 }),
    };
  }
  if (!allowedRoles.includes(profile.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return {
    user: { id: profile.id, email: undefined, user_metadata: undefined },
    profile,
  };
}

/**
 * Fetch profile by user id. Uses profiles table + email from auth if needed.
 */
export async function getProfile(
  supabase: SupabaseClient,
  userId: string,
  email: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, role, created_at, listener_access_granted_at")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  const row = data as {
    id: string;
    display_name: string | null;
    role: string;
    created_at: string;
    listener_access_granted_at?: string | null;
  };
  return {
    id: row.id,
    email,
    displayName: row.display_name?.trim() || undefined,
    role: row.role as UserRole,
    createdAt: row.created_at,
    listenerAccessGrantedAt: row.listener_access_granted_at ?? undefined,
  };
}
