// src/components/modals/MobileMenuDrawer.jsx
import React, { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { Upload, Bell, LogIn, User2, X } from "lucide-react";
import { THEME } from "../../lib/theme";
import { useAppStore } from "../../store/AppStore";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n";

export default function MobileMenuDrawer({ open, onClose, onOpenUpload }) {
  const store = useAppStore();
  const nav = useNavigate();
  const ref = useRef(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose?.();
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  const triggerUpload = () => {
    onClose?.();
    if (store.user) {
      onOpenUpload?.();
    } else {
      store.setAuthOpen(true);
    }
  };

  const triggerNotify = () => {
    onClose?.();
    if (store.user) {
      store.setNotifyOpen(true);
    } else {
      store.setAuthOpen(true);
    }
  };

  const triggerProfile = () => {
    onClose?.();
    if (store.user) {
      nav("/me");
    } else {
      store.setAuthOpen(true);
    }
  };

  const MenuButton = ({ icon: Icon, label, onClick }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-5 py-3 w-full text-left text-lg hover:bg-rose-50"
      type="button"
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  const body = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/30 z-[1000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={ref}
            className="fixed top-0 right-0 h-full w-64 bg-white z-[1001] flex flex-col shadow-lg"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween" }}
            style={{ borderLeft: `1px solid ${THEME.border}` }}
          >
            <div className="flex justify-end p-3 border-b" style={{ borderColor: THEME.border }}>
              <button
                onClick={() => onClose?.()}
                className="p-2 rounded-md hover:bg-rose-50"
                type="button"
                title={t("close")}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 py-2">
              <MenuButton icon={Upload} label={t("upload") } onClick={triggerUpload} />
              <MenuButton icon={Bell} label={t("notifications")} onClick={triggerNotify} />
              <MenuButton
                icon={store.user ? User2 : LogIn}
                label={store.user ? t("myHome") : t("loginRegister")}
                onClick={triggerProfile}
              />
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(body, document.body);
}

