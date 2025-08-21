// 筛选条（类别 & 性向 & 标签）— 仅修改 UI：更精致的胶囊样式、对齐与留白、主题化阴影与过渡
import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, Minus, ChevronDown, Search } from 'lucide-react';
import PinyinMatch from 'pinyin-match';
import { THEME } from '../lib/theme';
import { useAppStore } from '../store/AppStore';
import { CATEGORIES, ORIENTATIONS } from '../lib/constants';
import { tagApi } from '../api/sdk';
import { showToast } from './ui/Toast';

function Pill({ active, onClick, label, kind = 'cat' }) {
  // kind: "cat" | "ori" -> 仅视觉区分不同选中颜色
  const activeBg =
    kind === 'cat'
      ? 'linear-gradient(135deg, #FB7185 0%, #F472B6 100%)' // 玫瑰粉
      : 'linear-gradient(135deg, #C084FC 0%, #A78BFA 100%)'; // 兰花紫

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'px-3 py-1.5 rounded-full text-sm border transition-all duration-200 whitespace-nowrap ' +
        (active
          ? 'text-white shadow-sm'
          : 'bg-white/70 hover:bg-white hover:border-rose-200 hover:shadow-[0_1px_6px_rgba(244,114,182,.25)]')
      }
      style={{
        background: active ? activeBg : THEME.surface,
        borderColor: THEME.border,
        boxShadow: active ? THEME.shadow : 'none',
        backdropFilter: active ? undefined : 'saturate(120%) blur(2px)'
      }}
    >
      {label}
    </button>
  );
}

/**
 * 受控优先（逻辑不变）：如果父组件传入 category/setCategory 或 orientation/setOrientation 则优先使用；
 * 否则回退到全局 store（与原工程保持兼容）
 */
export default function FilterBar(props) {
  const store = useAppStore();

  const [tagPanelOpen, setTagPanelOpen] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
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
      showToast('已从排除移至包含');
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
      showToast('已从包含移至排除');
    }
    setExcludeTags([...excludeTags, name]);
  };

  const handleReset = () => {
    setCategory('全部');
    setOrientation('全部');
    setIncludeTags([]);
    setExcludeTags([]);
  };

  const ResetButton = () => (
    <button
      type="button"
      onClick={handleReset}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-rose-200 bg-rose-50/70 text-sm text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
      title="清空筛选条件"
    >
      <RotateCcw className="w-4 h-4" />
      <span>重置</span>
    </button>
  );

  useEffect(() => {
    // 标签面板展开时一次性加载全部标签（逻辑不变）
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
        backdropFilter: 'saturate(140%) blur(4px)'
      }}
    >
      <div className="max-w-[1200px] mx-auto px-4 py-4">
        {/* —— 类别（桌面端右侧带重置；移动端重置隐藏） —— */}
        <div className="grid grid-cols-[auto,1fr] items-start gap-2 sm:flex sm:flex-nowrap sm:items-center sm:gap-3">
          <div className="shrink-0 whitespace-nowrap text-sm text-gray-600">类别：</div>
          <div className="min-w-0 flex flex-wrap gap-2">
            {['全部', ...CATEGORIES].map((c) => (
              <Pill
                key={c}
                label={c}
                active={category === c}
                onClick={() => setCategory(c)}
                kind="cat"
              />
            ))}
          </div>
          {/* 桌面端右侧“重置”（仅 sm 及以上显示） */}
          <div className="mt-2 hidden sm:block sm:ml-auto sm:mt-0">
            <ResetButton />
          </div>
        </div>

        {/* —— 性向 —— */}
        <div className="mt-3 grid grid-cols-[auto,1fr] items-start gap-2 sm:flex sm:items-center sm:gap-3">
          <div className="shrink-0 whitespace-nowrap text-sm text-gray-600">性向：</div>
          <div className="min-w-0 flex flex-wrap gap-2">
            {['全部', ...ORIENTATIONS].map((o) => (
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

        {/* —— 标签 —— */}
        <div className="mt-3">
          <div className="grid grid-cols-[auto,1fr] items-center gap-2">
            <div className="shrink-0 whitespace-nowrap text-sm text-gray-600">标签：</div>
            <button
              type="button"
              onClick={() => setTagPanelOpen((v) => !v)}
              className="flex items-center text-sm text-gray-700/90 hover:text-rose-500 transition-colors"
            >
              {tagPanelOpen ? '收起' : '展开'}
              <ChevronDown
                className={`w-4 h-4 ml-1 transition-transform ${tagPanelOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {tagPanelOpen && (
            <div
              className="mt-2 rounded-xl border p-3 sm:p-4"
              style={{ borderColor: THEME.border, background: THEME.surface }}
            >
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={tagQuery}
                  onChange={(e) => setTagQuery(e.target.value)}
                  placeholder="搜索标签（支持拼音/首字母）"
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 transition-shadow"
                  style={{
                    borderColor: THEME.border,
                    boxShadow:
                      '0 1px 6px rgba(244,114,182,.12), inset 0 0 0 9999px rgba(255,255,255,.65)'
                  }}
                />
              </div>

              {/* 标签列表 */}
              <div className="mt-3">
                {(() => {
                  const filtered = tagQuery
                    ? tagList.filter((t) => PinyinMatch.match(t.name, tagQuery))
                    : tagList;
                  return (
                    <div className="h-44 sm:h-48 overflow-auto flex flex-wrap content-start gap-2 text-sm w-full pr-1">
                      {loadingTags ? (
                        <div className="text-gray-500 m-2">加载中...</div>
                      ) : tagError ? (
                        <div className="text-gray-500 m-2">
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
                        <div className="text-gray-500 m-2">无匹配标签</div>
                      ) : (
                        filtered.map((t) => {
                          const included = includeTags.includes(t.name);
                          const excluded = excludeTags.includes(t.name);
                          const isActive = included || excluded;

                          return (
                            <div
                              key={t.id || t.name}
                              className={`group px-2 py-1 rounded-full border flex items-center gap-1 transition-all duration-150 ${
                                isActive ? 'text-white shadow-sm' : 'bg-white/70 hover:bg-white'
                              }`}
                              style={{
                                background: included
                                  ? 'linear-gradient(135deg, #FDE68A 0%, #FBBF24 100%)' // 含金黄
                                  : excluded
                                  ? 'linear-gradient(135deg, #FCA5A5 0%, #F87171 100%)' // 排红
                                  : THEME.surface,
                                borderColor: THEME.border,
                                boxShadow: isActive ? THEME.shadow : 'none'
                              }}
                            >
                              <span className="whitespace-nowrap">{t.name}</span>
                              {/* + 包含 */}
                              <button
                                type="button"
                                className="w-5 h-5 flex items-center justify-center rounded-full border text-xs bg-white/95 hover:bg-white transition-colors"
                                style={{ borderColor: THEME.border }}
                                onClick={() => handleInclude(t.name)}
                                aria-label="包含标签"
                                title="包含标签"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              {/* - 排除 */}
                              <button
                                type="button"
                                className="w-5 h-5 flex items-center justify-center rounded-full border text-xs bg-white/95 hover:bg-white transition-colors"
                                style={{ borderColor: THEME.border }}
                                onClick={() => handleExclude(t.name)}
                                aria-label="排除标签"
                                title="排除标签"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* 已选总结区 */}
              {(includeTags.length > 0 || excludeTags.length > 0) && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: THEME.border }}>
                  <div className="space-y-2 text-sm">
                    {includeTags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="shrink-0 text-gray-600">包含</span>
                        {includeTags.map((t) => (
                          <button
                            key={t}
                            className="px-2 py-1 rounded-full border flex items-center gap-1 hover:bg-white/80 transition-colors"
                            style={{ borderColor: THEME.border, background: THEME.surface }}
                            onClick={() => handleInclude(t)}
                            title="点击移除该包含"
                          >
                            {t}
                            <span className="ml-1">×</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {excludeTags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="shrink-0 text-gray-600">排除</span>
                        {excludeTags.map((t) => (
                          <button
                            key={t}
                            className="px-2 py-1 rounded-full border flex items-center gap-1 hover:bg-white/80 transition-colors"
                            style={{ borderColor: THEME.border, background: THEME.surface }}
                            onClick={() => handleExclude(t)}
                            title="点击移除该排除"
                          >
                            {t}
                            <span className="ml-1">×</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1">
                      <button
                        type="button"
                        className="text-xs text-rose-500 underline decoration-rose-300 underline-offset-2 hover:text-rose-600"
                        onClick={() => {
                          setIncludeTags([]);
                          setExcludeTags([]);
                        }}
                      >
                        清空标签筛选
                      </button>
                      <span className="text-xs text-gray-500">
                        小贴士：点击上方“包含/排除”胶囊可快速移除
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 移动端：只保留这一处重置（与上方桌面端互斥显示） */}
        <div className="mt-3 flex justify-end sm:hidden">
          <ResetButton />
        </div>
      </div>
    </div>
  );
}
