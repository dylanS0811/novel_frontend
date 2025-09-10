import React from "react";
import { useLanguage } from "../i18n";

export default function LanguageToggle() {
  const { lang, toggle } = useLanguage();
  return (
    <label className="inline-flex items-center cursor-pointer ml-2">
      <span className="mr-2 text-sm">{lang === "zh" ? "中文" : "EN"}</span>
      <input
        type="checkbox"
        className="sr-only"
        checked={lang === "en"}
        onChange={toggle}
      />
      <div className="w-10 h-5 bg-gray-300 rounded-full relative">
        <div
          className={`w-5 h-5 bg-white rounded-full shadow absolute top-0 transition-all ${
            lang === "en" ? "left-5" : "left-0"
          }`}
        />
      </div>
    </label>
  );
}
