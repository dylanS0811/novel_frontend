import React from "react";
import { THEME } from "../../lib/theme";

export default function CuteSelect({ value, onChange, options = [], disabled = false, className = "" }) {
  return (
    <div className={"relative " + className}>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full appearance-none border rounded-xl px-3 py-2 pr-8 bg-white/70 focus:outline-none focus:ring-2 focus:ring-rose-200 transition"
        style={{ borderColor: THEME.border }}
      >
        {options.map((opt) => {
          if (typeof opt === "string") {
            return (
              <option key={opt} value={opt}>
                {opt}
              </option>
            );
          }
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-rose-400"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M7 10l5 5 5-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
