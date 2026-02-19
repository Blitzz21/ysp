/**
 * Shared settings tab constants — importable from both server and client components.
 */

export const SETTINGS_TABS = [
    { key: "profile", label: "Profile" },
    { key: "email", label: "Account Email" },
    { key: "password", label: "Password" },
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number]["key"];

export function resolveTab(raw?: string | null): SettingsTab {
    if (raw && SETTINGS_TABS.some((t) => t.key === raw)) {
        return raw as SettingsTab;
    }
    return "profile";
}
