// src/components/BookSheetPanel.jsx
import React from "react";
import { useAppStore } from "../store/AppStore";
import { THEME } from "../lib/theme";
import { classNames, formatDate } from "../lib/utils";

export default function BookSheetPanel() {
  const {
    sheets,
    sheetBooks,
    activeSheetId,
    setActiveSheetId,
    addSheet,
    renameSheet,
    removeSheet,
    addBookToSheet,
    updateBookInSheet,
    removeBookFromSheet,
  } = useAppStore();

  const activeSheet = sheets.find((s) => s.id === activeSheetId);

  const handleAddSheet = async () => {
    const name = prompt("输入书单名");
    if (name) await addSheet(name);
  };

  const handleRenameSheet = async (id, name) => {
    const v = prompt("修改书单名", name);
    if (v && v !== name) await renameSheet(id, v);
  };

  const handleAddBook = async () => {
    if (!activeSheet) return;
    const title = prompt("书名");
    if (!title) return;
    const author = prompt("作者") || "";
    const orientation = prompt("性向") || "";
    const category = prompt("类型") || "";
    const ratingStr = prompt("评分（1-10）") || "";
    const rating = ratingStr ? Number(ratingStr) : undefined;
    const review = prompt("评价") || "";
    await addBookToSheet(activeSheet.id, {
      title,
      author,
      orientation,
      category,
      rating,
      review,
    });
  };

  const handleEditBook = async (b) => {
    const title = prompt("书名", b.title);
    if (!title) return;
    const author = prompt("作者", b.author || "") || "";
    const orientation = prompt("性向", b.orientation || "") || "";
    const category = prompt("类型", b.category || "") || "";
    const ratingStr = prompt(
      "评分（1-10）",
      b.rating != null ? String(b.rating) : ""
    ) || "";
    const rating = ratingStr ? Number(ratingStr) : undefined;
    const review = prompt("评价", b.review || "") || "";
    await updateBookInSheet(activeSheet.id, b.id, {
      title,
      author,
      orientation,
      category,
      rating,
      review,
    });
  };

  return (
    <div className="flex">
      <div
        className="w-48 flex-shrink-0 pr-2 border-r"
        style={{ borderColor: THEME.border }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">书单</span>
          <button onClick={handleAddSheet} className="text-xs text-blue-500">
            新增
          </button>
        </div>
        <ul className="text-sm space-y-1">
          {sheets.map((s) => (
            <li
              key={s.id}
              className={classNames(
                "flex items-center gap-1 p-1 rounded cursor-pointer",
                activeSheetId === s.id && "bg-amber-50"
              )}
            >
              <span
                className="flex-1 truncate"
                onClick={() => setActiveSheetId(s.id)}
              >
                {s.name}
              </span>
              <button
                onClick={() => handleRenameSheet(s.id, s.name)}
                className="text-[10px] text-gray-400"
              >
                改
              </button>
              <button
                onClick={() => removeSheet(s.id)}
                className="text-[10px] text-red-500"
              >
                删
              </button>
            </li>
          ))}
          {sheets.length === 0 && <li className="text-gray-400">暂无书单</li>}
        </ul>
      </div>

      <div className="flex-1 pl-4">
        {activeSheet ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">
                {activeSheet.name}（{sheetBooks.length}）
              </span>
              <button
                onClick={handleAddBook}
                className="text-xs text-blue-500"
              >
                添加书籍
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sheetBooks.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded border"
                  style={{ borderColor: THEME.border }}
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{b.title}</div>
                      <div className="text-xs text-gray-600">{b.author}</div>
                      <div className="text-[11px] text-gray-500">
                        {b.orientation} / {b.category}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        评分: {b.rating ?? "-"}
                      </div>
                      {b.review && (
                        <div className="text-xs text-gray-600 mt-1">
                          {b.review}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleEditBook(b)}
                        className="text-[10px] text-blue-500"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => removeBookFromSheet(activeSheet.id, b.id)}
                        className="text-[10px] text-red-500"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    加入: {formatDate(b.createdAt)}
                  </div>
                </div>
              ))}
              {sheetBooks.length === 0 && (
                <div className="text-sm text-gray-500">暂无书籍</div>
              )}
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-500">请选择书单</div>
        )}
      </div>
    </div>
  );
}

