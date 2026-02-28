/**
 * Shared status banner for success/error messages across admin and dashboard pages.
 */
export function StatusBanner({
  status,
  message,
  className = "",
}: {
  status?: string;
  message?: string;
  className?: string;
}) {
  if (!message) return null;
  const isError = status === "error";
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-green-200 bg-green-50 text-green-700"
      } ${className}`}
    >
      {message}
    </div>
  );
}
