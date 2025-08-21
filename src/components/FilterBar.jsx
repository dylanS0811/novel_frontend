// 筛选条（类别 & 性向）— 选中态更醒目，类别与性向使用不同的高亮色
import React, { useState, useEffect } from "react";
import { RotateCcw, Plus, Minus, ChevronDown } from "lucide-react";
import PinyinMatch from "pinyin-match";
import { THEME } from "../lib/theme";
import { useAppStore } from "../store/AppStore";
import { CATEGORIES, ORIENTATIONS } from "../lib/constants";
import { tagApi } from "../api/sdk";
import { showToast } from "./ui/Toast";

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
  const [tagPanelOpen, setTagPanelOpen] = useState(false);
  const [tagQuery, setTagQuery] = useState("");
  const [tagList, setTagList] = useState([]); // 全部标签列表
  const [loadingTags, setLoadingTags] = useState(false);
  const [tagError, setTagError] = useState(null);

  const category = props.category ?? store.category;
  const setCategory = props.setCategory ?? store.setCategory;

  const orientation = props.orientation ?? store.orientation;
  const setOrientation = props.setOrientation ?? store.setOrientation;

  const includeTags = props.includeTags ?? store.includeTags;
  const setIncludeTags = props.setIncludeTags ?? store.setIncludeTags;
  const excludeTags = props.excludeTags ?? store.excludeTags;
  const setExcludeTags = props.setExcludeTags ?? store.setExcludeTags;

  const handleInclude = (name) => {
    if (includeTags.includes(name)) {
      setIncludeTags(includeTags.filter((t) => t !== name));
      return;
    }
    if (excludeTags.includes(name)) {
      setExcludeTags(excludeTags.filter((t) => t !== name));
      showToast("已从排除移至包含");
    }
    setIncludeTags([...includeTags, name]);
  };

  const handleExclude = (name) => {
    if (excludeTags.includes(name)) {
      setExcludeTags(excludeTags.filter((t) => t !== name));
      return;
    }
    if (includeTags.includes(name)) {
      setIncludeTags(includeTags.filter((t) => t !== name));
      showToast("已从包含移至排除");
    }
    setExcludeTags([...excludeTags, name]);
  };

  const handleReset = () => {
    setCategory("全部");
    setOrientation("全部");
    setIncludeTags([]);
    setExcludeTags([]);
  };

  const ResetButton = () => (
    <button
      type="button"
      onClick={handleReset}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-rose-200 bg-rose-50 text-sm text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition"
      title="清空筛选条件"
    >
      <RotateCcw className="w-4 h-4" />
      <span>重置</span>
    </button>
  );

  useEffect(() => {
    // 标签面板展开时一次性加载全部标签
    if (!tagPanelOpen || tagList.length > 0) return;
    const ctrl = { aborted: false };
    (async () => {
      setLoadingTags(true);
      setTagError(null);
      try {
        const res = await tagApi.list({ page: 1, size: 9999, sort: 'hot' });
        const data = res?.data || res || {};
        if (!ctrl.aborted) setTagList(data.list || []);
      } catch (e) {
        if (!ctrl.aborted) {
          setTagList([]);
          setTagError(e);
        }
      } finally {
        if (!ctrl.aborted) setLoadingTags(false);
      }
    })();
    return () => {
      ctrl.aborted = true;
    };
  }, [tagPanelOpen, tagList.length]);

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
        <div className="grid grid-cols-[auto,1fr] items-start gap-2 sm:flex sm:flex-nowrap sm:items-center sm:gap-3">
          <div className="shrink-0 whitespace-nowrap text-sm text-gray-600">类别：</div>
          <div className="min-w-0 flex flex-wrap gap-2 sm:flex-wrap">
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
          <div className="mt-2 hidden sm:block sm:ml-auto sm:mt-0">
            <ResetButton />
          </div>
        </div>

        {/* 性向 */}
        <div className="mt-3 grid grid-cols-[auto,1fr] items-start gap-2 sm:flex sm:items-center sm:gap-3">
          <div className="shrink-0 whitespace-nowrap text-sm text-gray-600">性向：</div>
          <div className="min-w-0 flex flex-wrap gap-2 sm:flex-wrap">
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

        {/* 移动端“重置” */}
        <div className="mt-2 flex justify-end sm:hidden">
          <ResetButton />
        </div>

        {/* 标签 */}
        <div className="mt-3">
          <div className="grid grid-cols-[auto,1fr] items-start gap-2 sm:flex sm:items-center">
            <div className="shrink-0 whitespace-nowrap text-sm text-gray-600">标签：</div>
            <button
              type="button"
              onClick={() => setTagPanelOpen((v) => !v)}
              className="flex items-center text-sm text-gray-600"
            >
              {tagPanelOpen ? "收起" : "展开"}
              <ChevronDown
                className={`w-4 h-4 ml-1 transition-transform ${tagPanelOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>
          {tagPanelOpen && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                value={tagQuery}
                onChange={(e) => setTagQuery(e.target.value)}
                placeholder="搜索标签（支持拼音/首字母）"
                className="w-full px-3 py-1.5 border rounded-md text-sm"
                style={{ borderColor: THEME.border }}
              />
              {(() => {
                const filtered = tagQuery
                  ? tagList.filter((t) => PinyinMatch.match(t.name, tagQuery))
                  : tagList;
                return (
                  <div className="h-40 overflow-auto flex flex-wrap gap-2 text-sm w-full">
                    {loadingTags ? (
                      <div className="text-gray-500">加载中...</div>
                    ) : tagError ? (
                      <div className="text-gray-500">
                        标签加载失败，请重试
                        <button
                          type="button"
                          className="ml-1 text-rose-500 underline"
                          onClick={() => setTagQuery(tagQuery)}
                        >
                          重试
                        </button>
                      </div>
                    ) : filtered.length === 0 ? (
                      <div className="text-gray-500">无匹配标签</div>
                    ) : (
                      filtered.map((t) => (
                        <div
                          key={t.id || t.name}
                          className={`px-2 py-1 rounded-full border flex items-center gap-1 ${includeTags.includes(t.name) || excludeTags.includes(t.name) ? "text-white shadow-sm" : ""}`}
                          style={{
                            background: includeTags.includes(t.name)
                              ? "linear-gradient(135deg, #FDE68A 0%, #FBBF24 100%)"
                              : excludeTags.includes(t.name)
                              ? "linear-gradient(135deg, #FCA5A5 0%, #F87171 100%)"
                              : THEME.surface,
                            borderColor: THEME.border,
                            boxShadow:
                              includeTags.includes(t.name) || excludeTags.includes(t.name)
                                ? THEME.shadow
                                : "none",
                          }}
                        >
                          <span className="whitespace-nowrap">{t.name}</span>
                          <button
                            type="button"
                            className="w-4 h-4 flex items-center justify-center rounded-full border text-xs bg-white"
                            style={{ borderColor: THEME.border }}
                            onClick={() => handleInclude(t.name)}
                            aria-label="包含标签"
                            title="包含标签"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            className="w-4 h-4 flex items-center justify-center rounded-full border text-xs bg-white"
                            style={{ borderColor: THEME.border }}
                            onClick={() => handleExclude(t.name)}
                            aria-label="排除标签"
                            title="排除标签"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                );
              })()}
              {(includeTags.length > 0 || excludeTags.length > 0) && (
                <div className="pt-2 space-y-1 text-sm">
                  {includeTags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-600">包含：</span>
                      {includeTags.map((t) => (
                        <button
                          key={t}
                          className="px-2 py-1 rounded-full border flex items-center gap-1"
                          style={{ borderColor: THEME.border, background: THEME.surface }}
                          onClick={() => handleInclude(t)}
                        >
                          {t}
                          <span className="ml-1">×</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {excludeTags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-600">排除：</span>
                      {excludeTags.map((t) => (
                        <button
                          key={t}
                          className="px-2 py-1 rounded-full border flex items-center gap-1"
                          style={{ borderColor: THEME.border, background: THEME.surface }}
                          onClick={() => handleExclude(t)}
                        >
                          {t}
                          <span className="ml-1">×</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    className="text-xs text-rose-500 underline"
                    onClick={() => {
                      setIncludeTags([]);
                      setExcludeTags([]);
                    }}
                  >
                    清空标签筛选
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
