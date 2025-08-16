// src/components/modals/AuthModal.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, QrCode, ShieldCheck } from "lucide-react";
import { THEME } from "../../lib/theme";
import { useAppStore } from "../../store/AppStore";

/**
 * 登录 / 注册（游客）弹窗
 * - 永远居中（fixed + flex）
 * - 点击遮罩任意位置即可关闭
 * - 微信登录：移动端尝试调起 weixin://（失败则回退为后端登录）
 * - 手机号登录：短信验证码真实对接后端
 */
export default function AuthModal({ open, onClose }) {
  const { loginWithWeChat, loginWithPhone, sendPhoneCode } = useAppStore();

  // 本地输入状态（新增）
  const [phone, setPhone] = useState("");
  const [code, setCode]   = useState("");
  const [count, setCount] = useState(0); // 发送按钮倒计时

  // ESC 关闭（保持原有）
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 倒计时（新增）
  useEffect(() => {
    if (count <= 0) return;
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  const tryWeChatDeepLink = () => {
    const ua = navigator.userAgent || "";
    const isMobile =
      /iPhone|iPad|iPod|Android|Mobile/i.test(ua) || window.innerWidth < 768;
    const inWeChat = /MicroMessenger/i.test(ua);

    if (isMobile && !inWeChat) {
      const timer = setTimeout(() => {
        loginWithWeChat();
      }, 1200);
      try {
        window.location.href = "weixin://";
      } catch {
        loginWithWeChat();
      } finally {
        setTimeout(() => clearTimeout(timer), 2000);
      }
    } else {
      loginWithWeChat();
    }
  };

  // 发送验证码（新增）
  const onSendCode = async () => {
    if (!phone) {
      alert("请输入手机号");
      return;
    }
    try {
      await sendPhoneCode(phone);
      setCount(60); // 60s 倒计时
    } catch (e) {
      alert(e?.message || "验证码发送失败");
    }
  };

  // 提交手机号登录（新增）
  const onPhoneLogin = async () => {
    if (!phone || !code) {
      alert("请输入手机号和验证码");
      return;
    }
    try {
      await loginWithPhone(phone, code);
      onClose?.();
    } catch (e) {
      alert(e?.message || "登录失败");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center"
          style={{ background: "rgba(20,16,21,0.35)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose} // 点击遮罩关闭（保留）
        >
          {/* 内容容器：阻止事件冒泡，确保只点遮罩时才关闭 */}
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="w-[92%] max-w-[420px] rounded-2xl"
            style={{
              background: "linear-gradient(180deg,#FFFFFF 0%,#FFF4F7 100%)",
              boxShadow: THEME.shadowHover,
              border: `1px solid ${THEME.border}`,
            }}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: THEME.border }}
            >
              <div className="font-semibold">登录 / 注册</div>
              <button onClick={onClose} className="p-1 rounded hover:bg-rose-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 pt-4 pb-5">
              <div className="text-xs text-gray-500 mb-3">
                （demo）验证码已接入后端，发送后请查看服务端日志中的 6 位码
              </div>

              {/* 手机号 + 验证码区域：保持视觉风格，与按钮区同层级 */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input
                  className="col-span-2 border rounded-xl px-3 py-2 bg-white/70"
                  style={{ borderColor: THEME.border }}
                  placeholder="手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <button
                  onClick={onSendCode}
                  disabled={count > 0}
                  className="col-span-1 px-3 py-2 rounded-xl text-white disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#60A5FA,#4F46E5)" }}
                >
                  {count > 0 ? `${count}s` : "获取验证码"}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <input
                  className="col-span-2 border rounded-xl px-3 py-2 bg-white/70"
                  style={{ borderColor: THEME.border }}
                  placeholder="验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button
                  onClick={onPhoneLogin}
                  className="col-span-1 px-3 py-2 rounded-xl text-white"
                  style={{ background: "linear-gradient(135deg,#22C55E,#16A34A)" }}
                >
                  <Smartphone className="w-4 h-4 inline mr-1" />
                  登录
                </button>
              </div>

              {/* 原有按钮区：完全保留 */}
              <div className="space-y-3">
                <button
                  onClick={tryWeChatDeepLink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white"
                  style={{ background: "linear-gradient(135deg,#22C55E,#16A34A)" }}
                >
                  <QrCode className="w-5 h-5" />
                  微信/扫码登录
                </button>

                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <ShieldCheck className="w-4 h-4" />
                  <span>你的隐私将得到保护。</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
