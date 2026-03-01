export const OFFICER_PERMISSIONS = [
  { value: "manage_members", label: "Manage members" },
  { value: "manage_opportunities", label: "Manage opportunities" },
  { value: "manage_roles", label: "Manage roles" },
  { value: "view_reports", label: "View reports" },
] as const;

export type OfficerPermission = (typeof OFFICER_PERMISSIONS)[number]["value"];
