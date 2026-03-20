// Permission key constants
export const PERMISSIONS = {
  ADMIN_PANEL: "admin_panel",
  AGENT_PANEL: "agent_panel",
  BUSINESS_PANEL: "business_panel",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Maps a permission key to a human-readable label and badge color
export const PERMISSION_LABELS: Record<string, { label: string; color: string }> = {
  admin_panel: { label: "Admin", color: "bg-purple-50 text-purple-700" },
  agent_panel: { label: "Field Agent", color: "bg-blue-50 text-blue-700" },
  business_panel: { label: "Business Owner", color: "bg-green-50 text-green-700" },
};
