"use client";

interface ToggleProps {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  label?: string; // Opsional jika Anda ingin label di sampingnya
  "data-testid"?: string;
}

export default function Toggle({
  enabled,
  setEnabled,
  label,
  "data-testid": dataTestId,
}: ToggleProps) {
  return (
    <div className="flex items-center">
      {label && (
        <label
          htmlFor="toggle-button"
          className="font-semibold text-gray-800 dark:text-gray-200 mr-4"
        >
          {label}
        </label>
      )}
      <button
        type="button"
        id="toggle-button"
        data-testid={dataTestId}
        onClick={() => setEnabled(!enabled)}
        className={`${
          enabled ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          aria-hidden="true"
          className={`${
            enabled ? "translate-x-5" : "translate-x-0"
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
    </div>
  );
}
