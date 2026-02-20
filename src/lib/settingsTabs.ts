/**
 * Shared settings tab constants — importable from both server and client components.
 */

export const SETTINGS_TABS = [
    { key: "profile", label: "Profile", icon: "user" },
    { key: "email", label: "Account Email", icon: "mail" },
    { key: "password", label: "Password", icon: "lock" },
    { key: "notifications", label: "Notifications", icon: "bell" },
    { key: "account", label: "Account Settings", icon: "settings" },
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number]["key"];

export function resolveTab(raw?: string | null): SettingsTab {
    if (raw && SETTINGS_TABS.some((t) => t.key === raw)) {
        return raw as SettingsTab;
    }
    return "profile";
}
