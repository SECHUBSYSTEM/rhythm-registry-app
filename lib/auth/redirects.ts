import type { Profile } from "@/types";
import type { SignupRole } from "@/components/providers/AuthProvider";

/**
 * Sentinel value: the user has no signup intent, so they should be signed out
 * and sent back through signup/login to properly select their role.
 */
export const SIGN_OUT_REDIRECT = "__sign_out__" as const;

/**
 * Returns the path to redirect to, the SIGN_OUT_REDIRECT sentinel, or null
 * if the user may stay on the current path.
 *
 * Rules:
 *  - Admin / approved creator → always full access, stay on current page.
 *  - Listener with listenerAccessGrantedAt → full access (paid).
 *  - Creator-intent (signup_role=creator, profile.role still listener) → /dashboard/become-creator only.
 *  - Listener-intent (signup_role=listener), no access → /dashboard/onboarding only.
 *  - No intent (signup_role=null) and no full access → sign out & re-authenticate.
 */
export function getRedirectForUser(
  profile: Profile | null,
  signupRole: SignupRole,
  pathname: string
): string | typeof SIGN_OUT_REDIRECT | null {
  if (!profile) return null;

  const role = profile.role;
  const hasListenerAccess = !!profile.listenerAccessGrantedAt;
  const isAdmin = role === "admin";
  const isApprovedCreator = role === "creator";

  // Full-access users: admin, approved creator, or paid listener
  if (isAdmin || isApprovedCreator || (role === "listener" && hasListenerAccess)) {
    if (pathname === "/dashboard/onboarding" || pathname === "/onboarding") {
      return "/dashboard";
    }
    if (pathname === "/dashboard/become-creator" && isApprovedCreator) {
      return "/dashboard";
    }
    return null;
  }

  // Unpaid/unapproved users below this point

  // No signup intent → user bypassed proper flow, force re-auth
  if (signupRole === null) {
    return SIGN_OUT_REDIRECT;
  }

  const isOnboarding =
    pathname === "/dashboard/onboarding" || pathname === "/onboarding";
  const isBecomeCreator = pathname === "/dashboard/become-creator";

  if (signupRole === "creator") {
    if (isBecomeCreator) return null;
    return "/dashboard/become-creator";
  }

  // signupRole === "listener" without access → onboarding only
  if (isOnboarding) return null;
  return "/dashboard/onboarding";
}
