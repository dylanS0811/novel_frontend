import React from "react";
import { useLanguage } from "../i18n";
import { THEME } from "../lib/theme";
import { classNames } from "../lib/utils";

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <div
      className="ml-2 inline-flex shrink-0 rounded-full overflow-hidden border text-xs sm:text-sm whitespace-nowrap"
      style={{ borderColor: THEME.border }}
    >
      <button
        type="button"
        onClick={() => setLang("zh")}
        className={classNames(
          "px-2 py-1 transition-colors",
          lang === "zh" ? "text-white" : "text-gray-600"
        )}
        style={{
          background:
            lang === "zh"
              ? "linear-gradient(135deg, #F86C8B 0%, #FFA2B6 60%, #FFD0DA 100%)"
              : THEME.surface,
        }}
      >
        中文
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={classNames(
          "px-2 py-1 transition-colors border-l",
          lang === "en" ? "text-white" : "text-gray-600"
        )}
        style={{
          background:
            lang === "en"
              ? "linear-gradient(135deg, #C084FC 0%, #A78BFA 100%)"
              : THEME.surface,
          borderColor: THEME.border,
        }}
      >
        EN
      </button>
    </div>
  );
}

