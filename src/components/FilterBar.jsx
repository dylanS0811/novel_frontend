// 筛选条（类别 & 性向）— 选中态更醒目，类别与性向使用不同的高亮色
import React, { useState } from "react";
import { RotateCcw } from "lucide-react";
import { THEME } from "../lib/theme";
import { useAppStore } from "../store/AppStore";
import { CATEGORIES, ORIENTATIONS } from "../lib/constants";

function Pill({ active, onClick, label, kind = "cat" }) {
  // kind: "cat" | "ori"  -> 用于区分不同选中颜色
  const activeBg =
    kind === "cat"
      ? "linear-gradient(135deg, #FB7185 0%, #F472B6 100%)" // 玫瑰粉
      : "linear-gradient(135deg, #C084FC 0%, #A78BFA 100%)"; // 兰花紫

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded-full text-sm border transition whitespace-nowrap " +
        (active ? "text-white shadow-sm" : "bg-white hover:border-rose-200")
      }
      style={{
        background: active ? activeBg : THEME.surface,
        borderColor: THEME.border,
        boxShadow: active ? THEME.shadow : "none",
      }}
    >
      {label}
    </button>
  );
}

/**
 * 受控优先：如果父组件传入 category/setCategory 或 orientation/setOrientation 则优先使用；
 * 否则回退到全局 store（与原工程保持兼容）
 */
export default function FilterBar(props) {
  const store = useAppStore();

  const [menuOpen, setMenuOpen] = useState(false);

  const category = props.category ?? store.category;
  const setCategory = props.setCategory ?? store.setCategory;

  const orientation = props.orientation ?? store.orientation;
  const setOrientation = props.setOrientation ?? store.setOrientation;

  const handleReset = () => {
    setCategory("全部");
    setOrientation("全部");
  };

  return (
    <div
      className="w-full border-b"
      style={{
        borderColor: THEME.border,
        background: `linear-gradient(180deg, ${THEME.bgFrom} 0%, ${THEME.bgTo} 100%)`,
      }}
    >
      <div className="max-w-[1200px] mx-auto px-4 py-3">
        {/* 类别 */}
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 shrink-0">类别：</div>
          <div className="flex items-center gap-2 overflow-x-auto flex-nowrap sm:flex-wrap sm:overflow-visible">
            {["全部", ...CATEGORIES].map((c) => (
              <Pill
                key={c}
                label={c}
                active={category === c}
                onClick={() => setCategory(c)}
                kind="cat"
              />
            ))}
          </div>

          {/* 右侧“重置” */}
          <div className="ml-auto relative">
            <button
              type="button"
              onClick={handleReset}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-rose-200 bg-rose-50 text-sm text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition"
              title="清空筛选条件"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重置</span>
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="px-3 py-1.5 rounded-full border text-sm sm:hidden"
              style={{ borderColor: THEME.border, background: THEME.surface }}
            >
              筛选
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-24 rounded-md border bg-white shadow-md p-2"
                style={{ borderColor: THEME.border }}
              >
                <button
                  type="button"
                  onClick={() => {
                    handleReset();
                    setMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 flex items-center justify-center gap-1 text-sm text-rose-500 rounded-full hover:bg-rose-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>重置</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 性向 */}
        <div className="mt-3 flex items-center gap-3">
          <div className="text-sm text-gray-600 shrink-0">性向：</div>
          <div className="flex items-center gap-2 overflow-x-auto flex-nowrap sm:flex-wrap sm:overflow-visible">
            {["全部", ...ORIENTATIONS].map((o) => (
              <Pill
                key={o}
                label={o}
                active={orientation === o}
                onClick={() => setOrientation(o)}
                kind="ori"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
