import type { User } from "@/lib/types";

export type AppRole = User["role"];

const ROLE_ALIASES: Record<string, AppRole> = {
  admin: "ADMIN",
  counsellor: "COUNSELLOR",
  counselor: "COUNSELLOR",
  support_officer: "SUPPORT_OFFICER",
  supportofficer: "SUPPORT_OFFICER",
  officer: "SUPPORT_OFFICER",
};

export function normalizeRole(value?: string | null): AppRole | null {
  if (!value) return null;

  const clean = String(value).trim().toLowerCase().replace(/[^a-z]/g, "_");

  if (clean.includes("admin")) return "ADMIN";
  if (clean.includes("counsellor") || clean.includes("counselor")) return "COUNSELLOR";
  if (clean.includes("support") && clean.includes("officer")) return "SUPPORT_OFFICER";
  if (clean.includes("officer")) return "SUPPORT_OFFICER";

  return ROLE_ALIASES[clean] ?? null;
}

export function inferRoleFromEmail(email?: string | null): AppRole {
  const value = (email || "").toLowerCase();
  if (value.includes("admin")) return "ADMIN";
  if (value.includes("counsellor") || value.includes("counselor")) return "COUNSELLOR";
  if (value.includes("officer") || value.includes("support")) return "SUPPORT_OFFICER";
  return "COUNSELLOR";
}

export function resolveFirebaseRole(rawRole?: unknown, email?: string | null): AppRole {
  if (typeof rawRole === "string") {
    const normalized = normalizeRole(rawRole);
    if (normalized) return normalized;
  }

  if (typeof rawRole === "object" && rawRole && "role" in rawRole) {
    const nested = normalizeRole(String((rawRole as { role?: unknown }).role));
    if (nested) return nested;
  }

  return inferRoleFromEmail(email);
}

export function getRoleTitle(role: AppRole): string {
  switch (role) {
    case "ADMIN":
      return "State Administrator";
    case "SUPPORT_OFFICER":
      return "Support Officer";
    case "COUNSELLOR":
    default:
      return "Senior Counsellor";
  }
}
