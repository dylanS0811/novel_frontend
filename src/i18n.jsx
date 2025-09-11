import React, { createContext, useContext, useState, useEffect } from "react";

const resources = {
  zh: {
    loading: "加载中...",
    search: "搜索",
    searchPlaceholder: "搜索 书名/作者/标签",
    quickUpload: "闪电上传",
    cancel: "取消",
    publish: "发布",
    publishing: "发布中…",
    publish_success: "发布成功",
    publish_failed: "发布失败",
    need_title: "请先填写书名",
    title_exists: "已存在同名书籍",
    menu: "菜单",
    tagSearchPlaceholder: "搜索标签（支持拼音/首字母）",
    newNicknamePlaceholder: "输入新的昵称",
    handlePlaceholder: "如：aqiuyu、name@example.com 或 13000000000",
    nicknamePlaceholder: "昵称（对外展示，可修改）",
    passwordPlaceholder: "请输入密码",
    confirmPasswordPlaceholder: "请再次输入密码",
    replyPlaceholder: "回复……",
    commentPlaceholder: "说点什么……",
    optional: "可选",
    selectOrientationPlaceholder: "请选择性向",
    selectCategoryPlaceholder: "请选择类别",
    oneSentenceReasonPlaceholder: "一句话强推理由（建议≤60字）",
    summaryPlaceholder: "内容梗概（建议≤200字）",
    tagInputPlaceholder: "输入标签后回车添加；支持自动检索",
    pleaseSelect: "请选择",
  },
  en: {
    loading: "Loading...",
    search: "Search",
    searchPlaceholder: "Search title/author/tags",
    quickUpload: "Lightning Upload",
    cancel: "Cancel",
    publish: "Publish",
    publishing: "Publishing...",
    publish_success: "Published successfully",
    publish_failed: "Publish failed",
    need_title: "Please provide a title",
    title_exists: "A book with the same title exists",
    menu: "Menu",
    tagSearchPlaceholder: "Search tags (supports pinyin/initials)",
    newNicknamePlaceholder: "Enter new nickname",
    handlePlaceholder: "e.g. username, name@example.com or 13000000000",
    nicknamePlaceholder: "Nickname (public, editable)",
    passwordPlaceholder: "Enter password",
    confirmPasswordPlaceholder: "Re-enter password",
    replyPlaceholder: "Reply...",
    commentPlaceholder: "Say something...",
    optional: "Optional",
    selectOrientationPlaceholder: "Select orientation",
    selectCategoryPlaceholder: "Select category",
    oneSentenceReasonPlaceholder: "One-sentence pitch (≤60 chars)",
    summaryPlaceholder: "Synopsis (≤200 chars)",
    tagInputPlaceholder: "Press Enter after typing tags; auto-search supported",
    pleaseSelect: "Please select",
  },
};

const cache = JSON.parse(localStorage.getItem("i18nCache") || "{}");

async function translateDocument(lang) {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  );
  const tasks = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const original = node.__i18nOriginal || node.textContent;
    if (!node.__i18nOriginal) node.__i18nOriginal = original;
    if (lang === "zh") {
      node.textContent = original;
      continue;
    }
    if (/\p{Script=Han}/u.test(original.trim())) {
      let translated = cache[original];
      if (!translated) {
        tasks.push(
          fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
              original
            )}&langpair=zh-CN|en-US`
          )
            .then((res) => res.json())
            .then((data) => {
              translated = data.responseData.translatedText || original;
              cache[original] = translated;
            })
            .catch(() => {
              translated = original;
            })
            .finally(() => {
              node.textContent = translated;
            })
        );
      } else {
        node.textContent = translated;
      }
    }
  }
  if (tasks.length) {
    await Promise.all(tasks);
    localStorage.setItem("i18nCache", JSON.stringify(cache));
  }
}

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem("lang") || "zh");
  const t = (key) =>
    lang === "en" ? resources.en[key] || cache[key] || key : resources.zh[key] || key;
  const toggle = () => {
    const next = lang === "zh" ? "en" : "zh";
    setLang(next);
    localStorage.setItem("lang", next);
  };
  useEffect(() => {
    translateDocument(lang);
    const observer = new MutationObserver(() => translateDocument(lang));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [lang]);
  return (
    <LanguageContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
