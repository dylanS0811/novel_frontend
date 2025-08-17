// src/components/modals/AuthModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User2,
  Lock,
  Eye,
  EyeOff,
  Info,
  CheckCircle2,
} from "lucide-react";
import { THEME } from "../../lib/theme";
import { useAppStore } from "../../store/AppStore";
import { meApi } from "../../api/sdk";

/** -----------------------------------------------
 * 新版 登录 / 注册 弹窗
 * - 默认游客浏览（不强制登录）
 * - 账号 = 用户名/邮箱/手机号（三选一，其它留空）
 * - 密码 >= 6 位，不强制复杂度
 * - 贴合现有 UI：柔和渐变、圆角、浅边框、阴影
 * ------------------------------------------------ */
export default function AuthModal({ open, onClose }) {
  const { loginWithCredentials, registerAccount } = useAppStore();

  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [handle, setHandle] = useState("");  // 用户名/邮箱/手机号
  const [nick, setNick] = useState(""); // 昵称
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);      // 成功/失败提示

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // ---------- 输入校验 ----------
  const isEmail = (v) =>
    /^\S+@\S+\.\S+$/.test(v.trim());

  const isPhone = (v) =>
    /^\d{7,15}$/.test(v.trim()); // 7~15 位数字，适配国际简单场景

  // 自定义用户名规则（大众网站常见规范）：
  // 3-20 位；允许字母数字与 . _ -；必须以字母或数字开头和结尾；不允许连续的特殊符号
  const isUsername = (v) =>
    /^(?=.{3,20}$)[a-zA-Z0-9](?:[a-zA-Z0-9]|[._-](?![._-]))*[a-zA-Z0-9]$/.test(
      v.trim()
    );

  const handleType = useMemo(() => {
    if (!handle.trim()) return null;
    if (isEmail(handle)) return "email";
    if (isPhone(handle)) return "phone";
    if (isUsername(handle)) return "username";
    return "invalid";
  }, [handle]);

  const handleError =
    !handle
      ? null
      : handleType === "invalid"
      ? "请输入有效的用户名/邮箱/手机号。用户名 3-20 位，可用字母数字与 . _ -，且不能连续符号。"
      : null;

  const pwdError =
    password && password.length < 6 ? "密码至少 6 位" : null;

  const nickTrim = nick.trim();
  const isNickname = (v) =>
    /^(?=.{2,20}$)[\u4e00-\u9fa5A-Za-z0-9._\-\s]+$/.test(v) &&
    !/(\.\.|__|--)/.test(v);
  const nickError =
    mode === "register" && nick
      ? !isNickname(nickTrim)
        ? "昵称支持中文、字母、数字、空格和 . _ -，长度 2-20，且不能连续重复符号"
        : handleType === "username" && nickTrim === handle.trim()
        ? "昵称与用户名冲突，请更换"
        : null
      : null;

  const confirmError =
    mode === "register" && confirm
      ? confirm !== password
        ? "两次输入的密码不一致"
        : null
      : null;

  const canSubmit =
    handle &&
    handleType !== "invalid" &&
    password &&
    password.length >= 6 &&
    (mode === "login" ||
      (mode === "register" &&
        confirm === password &&
        nickTrim &&
        !nickError));

  // ---------- 提交 ----------
  const onSubmit = async (e) => {
    e?.preventDefault?.();
    if (!canSubmit || loading) return;

    setLoading(true);
    setMsg(null);
    try {
      if (mode === "register") {
        const ck = await meApi.checkNickname(nickTrim);
        const exists = ck?.data?.exists ?? ck?.exists;
        if (exists) {
          setMsg({ type: "error", text: "昵称已被占用" });
          setLoading(false);
          return;
        }
        await registerAccount(handle.trim(), nickTrim, password);
        // 注册完成给出成功提示，并自动切换到登录
        setMsg({ type: "success", text: "注册成功，请登录" });
        setMode("login");
      } else {
        await loginWithCredentials(handle.trim(), password);
        setMsg(null);
        onClose?.();
      }
    } catch (err) {
      setMsg({ type: "error", text: err?.message || "操作失败，请稍后重试" });
    } finally {
      setLoading(false);
    }
  };

  // 回车提交
  const onKeyDown = (e) => {
    if (e.key === "Enter") onSubmit(e);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center"
          style={{ background: "rgba(20,16,21,0.38)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="w-[92%] max-w-[460px] rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(180deg,#FFFFFF 0%,#FFF4F7 100%)",
              border: `1px solid ${THEME.border}`,
              boxShadow: THEME.shadowHover,
            }}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
          >
            {/* 顶部栏 */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: THEME.border }}
            >
              <div className="font-semibold">登录 / 注册</div>
              <button onClick={onClose} className="p-1 rounded hover:bg-rose-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 选项卡 */}
            <div className="px-4 pt-3">
              <div
                className="grid grid-cols-2 p-1 rounded-xl mb-3"
                style={{ background: "#F9F6F8", border: `1px solid ${THEME.border}` }}
              >
                {["login", "register"].map((k) => (
                  <button
                    key={k}
                    onClick={() => setMode(k)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      mode === k ? "shadow" : "opacity-70 hover:opacity-100"
                    }`}
                    style={
                      mode === k
                        ? {
                            background:
                              "linear-gradient(135deg,#F86C8B,#8B7CF6)",
                            color: "white",
                          }
                        : { background: "transparent" }
                    }
                  >
                    {k === "login" ? "登录" : "注册"}
                  </button>
                ))}
              </div>
            </div>

            {/* 表单体 */}
            <form className="px-5 pb-5" onSubmit={onSubmit}>
              {/* 成功/错误提示 */}
              {msg && (
                <div
                  className={`mb-3 text-sm rounded-lg px-3 py-2 flex items-center gap-2 ${
                    msg.type === "success" ? "bg-green-50" : "bg-rose-50"
                  }`}
                  style={{ border: `1px solid ${THEME.border}` }}
                >
                  {msg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                  <span>{msg.text}</span>
                </div>
              )}

              {/* 账号 */}
              <div className="mb-3">
                <label className="text-xs text-gray-600">用户名 / 邮箱 / 手机号</label>
                <div className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 border bg-white/70">
                  <User2 className="w-4 h-4 opacity-60" />
                  <input
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    onKeyDown={onKeyDown}
                    className="flex-1 outline-none bg-transparent text-sm"
                    placeholder="如：aqiuyu、name@example.com 或 13000000000"
                  />
                </div>
              {handleError && (
                <div className="mt-1 text-xs text-rose-500">{handleError}</div>
              )}
            </div>

            {/* 昵称（注册） */}
            {mode === "register" && (
              <div className="mb-3">
                <label className="text-xs text-gray-600">昵称（对外展示，可修改）</label>
                <div className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 border bg-white/70">
                  <User2 className="w-4 h-4 opacity-60" />
                  <input
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    onKeyDown={onKeyDown}
                    className="flex-1 outline-none bg-transparent text-sm"
                    placeholder="昵称（对外展示，可修改）"
                  />
                </div>
                {nickError && (
                  <div className="mt-1 text-xs text-rose-500">{nickError}</div>
                )}
              </div>
            )}

              {/* 密码 */}
              <div className="mb-3">
                <label className="text-xs text-gray-600">密码（至少 6 位）</label>
                <div className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 border bg-white/70">
                  <Lock className="w-4 h-4 opacity-60" />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={onKeyDown}
                    className="flex-1 outline-none bg-transparent text-sm"
                    placeholder="请输入密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="opacity-70 hover:opacity-100"
                    aria-label="切换密码可见"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwdError && <div className="mt-1 text-xs text-rose-500">{pwdError}</div>}
              </div>

              {/* 确认密码（仅注册） */}
              {mode === "register" && (
                <div className="mb-3">
                  <label className="text-xs text-gray-600">确认密码</label>
                  <div className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 border bg-white/70">
                    <Lock className="w-4 h-4 opacity-60" />
                    <input
                      type={showPwd2 ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onKeyDown={onKeyDown}
                      className="flex-1 outline-none bg-transparent text-sm"
                      placeholder="请再次输入密码"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd2((v) => !v)}
                      className="opacity-70 hover:opacity-100"
                      aria-label="切换密码可见"
                    >
                      {showPwd2 ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {confirmError && (
                    <div className="mt-1 text-xs text-rose-500">{confirmError}</div>
                  )}
                </div>
              )}

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="w-full mt-2 py-3 rounded-xl text-white font-medium disabled:opacity-60"
                style={{
                  background:
                    "linear-gradient(135deg,#F86C8B 0%, #8B7CF6 100%)",
                  boxShadow: THEME.shadow,
                }}
              >
                {loading ? "处理中..." : mode === "login" ? "登录" : "注册"}
              </button>

              {/* 游客继续 + 协议 */}
              <div className="mt-3 flex flex-col items-center gap-2 text-xs text-gray-500">
                <button type="button" onClick={onClose} className="underline underline-offset-2">
                  继续以游客身份浏览
                </button>
                <div className="opacity-80">
                  注册/登录即表示同意
                  <a className="underline underline-offset-2 cursor-pointer">《用户协议》</a>
                  与
                  <a className="underline underline-offset-2 cursor-pointer">《隐私政策》</a>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
