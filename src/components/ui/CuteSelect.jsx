import React, { useMemo } from "react";
import { THEME } from "../../lib/theme";

export default function CuteSelect({
  value,
  onChange,
  options = [],
  disabled = false,
  className = "",
  placeholder,
}) {
  const list = useMemo(() => {
    const arr = options.map((opt) =>
      typeof opt === "string" ? { value: opt, label: opt } : opt
    );
    return placeholder
      ? [{ value: "", label: placeholder, disabled: true }, ...arr]
      : arr;
  }, [options, placeholder]);

  return (
    <div className={"relative " + className}>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full appearance-none border rounded-xl px-3 py-2 pr-8 bg-white/70 focus:outline-none focus:ring-2 focus:ring-rose-200 transition"
        style={{ borderColor: THEME.border }}
      >
        {list.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            disabled={opt.disabled}
          >
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
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
