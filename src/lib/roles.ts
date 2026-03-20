export const ROLES = {
  ADMIN: "admin",
  AGENT: "agent",
  BUSINESS_OWNER: "business_owner",
  USER: "user",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export function isAdmin(role: string) {
  return role === ROLES.ADMIN;
}
export function isAgent(role: string) {
  return role === ROLES.AGENT;
}
export function isBusinessOwner(role: string) {
  return role === ROLES.BUSINESS_OWNER;
}
export function isEndUser(role: string) {
  return role === ROLES.USER;
}
export function isAgentOrAdmin(role: string) {
  return role === ROLES.AGENT || role === ROLES.ADMIN;
}
