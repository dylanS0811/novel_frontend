// src/components/ui/CuteSelect.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { THEME } from '../../lib/theme';
import { useLanguage } from '../../i18n';

/**
 * CuteSelect
 * props:
 *  - value: string
 *  - options: string[]
 *  - placeholder?: string
 *  - disabled?: boolean
 *  - onChange: (eventLike: { target: { value: string } }) => void
 *  - className?: string
 */
export default function CuteSelect({
  value = '',
  options = [],
  placeholder,
  disabled = false,
  onChange,
  className = ''
}) {
  const { t } = useLanguage();
  placeholder = placeholder ?? t('pleaseSelect');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(-1);

  // 贴合现有主题的可爱小图标（展示用，不影响真实值）
  const emojiMap = useMemo(
    () => ({
      // 性向
      BL主受: '🐰',
      BL主攻: '🐺',
      言情: '💞',
      男主无CP: '🧩',
      女主无CP: '🌙',
      男频: '🔥',
      女频: '🌸',
      其他: '✨',
      // 类别
      爱情: '💗',
      剧情: '🎬',
      都市: '🏙️',
      历史: '🏺',
      奇幻: '🦄',
      仙侠: '🗡️',
      同人: '🧸',
      海棠: '🌊',
      酸涩: '🍋',
      职场: '💼',
      无限流: '♾️',
      快穿: '⏩',
      游戏: '🎮',
      科幻: '🚀',
      童话: '🧚',
      惊悚: '😱',
      悬疑: '🕵️',
      年代: '📼'
    }),
    []
  );

  const prettyLabel = (txt) => {
    const e = emojiMap[txt] || '💫';
    return `${e}  ${txt}`;
  };

  // 点击外部关闭
  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // 键盘操作
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (!options?.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHoverIdx((i) => (i + 1) % options.length);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHoverIdx((i) => (i - 1 + options.length) % options.length);
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const idx = hoverIdx >= 0 ? hoverIdx : Math.max(0, options.indexOf(value));
        const v = options[idx] ?? value ?? '';
        if (v && onChange) onChange({ target: { value: v } });
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, hoverIdx, options, value, onChange]);

  // 打开时定位 hover 到当前值
  useEffect(() => {
    if (open) {
      const idx = options.indexOf(value);
      setHoverIdx(idx >= 0 ? idx : 0);
    }
  }, [open, options, value]);

  const handlePick = (v) => {
    if (onChange) onChange({ target: { value: v } });
    setOpen(false);
  };

  const displayText = value || '';

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {/* 触发器 */}
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className="w-full px-3 py-2 rounded-2xl border flex items-center justify-between select-none"
        style={{
          background: 'rgba(255,255,255,0.85)',
          borderColor: open ? '#FBCFE8' : THEME.border,
          boxShadow: open ? '0 8px 28px rgba(244,114,182,0.22)' : 'none',
          transition: 'all .18s ease'
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={`text-sm ${displayText ? 'text-gray-800' : 'text-gray-400'}`}
          style={{ fontWeight: 600 }}
        >
          {displayText ? prettyLabel(displayText) : '🩷  ' + placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {/* 下拉面板 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 8, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30, mass: 0.7 }}
            className="absolute left-0 right-0 z-[2000]"
          >
            <div
              role="listbox"
              tabIndex={-1}
              className="mt-2 max-h-64 overflow-auto rounded-2xl border backdrop-blur"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,244,247,0.96) 100%)',
                borderColor: '#FCE7F3',
                boxShadow: '0 16px 42px rgba(244,114,182,0.25)'
              }}
            >
              {options.map((opt, idx) => {
                const selected = opt === value;
                const hovered = idx === hoverIdx;
                return (
                  <div
                    key={opt}
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setHoverIdx(idx)}
                    onClick={() => handlePick(opt)}
                    className="px-3 py-2 cursor-pointer flex items-center justify-between"
                    style={{
                      background: hovered ? 'rgba(253, 242, 248, 0.9)' : 'transparent'
                    }}
                  >
                    <span
                      className="text-sm"
                      style={{
                        color: selected ? '#DB2777' : '#374151',
                        fontWeight: selected ? 700 : 500
                      }}
                    >
                      {prettyLabel(opt)}
                    </span>
                    {selected && <Check className="w-4 h-4" style={{ color: '#DB2777' }} />}
                  </div>
                );
              })}
              {!options?.length && <div className="px-3 py-3 text-sm text-gray-400">暂无选项</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
