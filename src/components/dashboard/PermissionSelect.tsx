"use client";

import { useState } from "react";

import { OFFICER_PERMISSIONS } from "@/lib/permissions";

function parseDefaults(value?: string): Set<string> {
  if (!value) return new Set();
  return new Set(
    value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
  );
}

export function PermissionSelect({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => parseDefaults(defaultValue)
  );

  function toggle(permission: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(permission)) {
        next.delete(permission);
      } else {
        next.add(permission);
      }
      return next;
    });
  }

  const serialized = Array.from(selected).join(", ");

  return (
    <div className="mt-2 space-y-2">
      <input type="hidden" name={name} value={serialized} />
      <div className="flex flex-wrap gap-2">
        {OFFICER_PERMISSIONS.map((perm) => {
          const isActive = selected.has(perm.value);
          return (
            <button
              key={perm.value}
              type="button"
              onClick={() => toggle(perm.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? "border-orange-300 bg-orange-50 text-orange-700"
                  : "border-gray-200 bg-white text-muted hover:border-gray-300 hover:text-ink"
              }`}
            >
              {isActive ? "\u2713 " : ""}
              {perm.label}
            </button>
          );
        })}
      </div>
      {selected.size === 0 && (
        <p className="text-[11px] text-red-500">
          Select at least one permission.
        </p>
      )}
    </div>
  );
}
