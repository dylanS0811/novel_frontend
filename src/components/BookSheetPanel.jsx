// src/components/BookSheetPanel.jsx
import React, { useState } from "react";
import { useAppStore } from "../store/AppStore";
import { THEME } from "../lib/theme";
import { classNames, formatDate } from "../lib/utils";
import BottomSheetForm from "./modals/BottomSheetForm";

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

  const [listFormOpen, setListFormOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState(null);
  const [bookFormOpen, setBookFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);

  const handleAddSheet = () => {
    setEditingSheet(null);
    setListFormOpen(true);
  };

  const handleRenameSheet = (id, name) => {
    setEditingSheet({ id, name });
    setListFormOpen(true);
  };

  const handleRemoveSheet = (id) => {
    if (window.confirm("确定删除该书单吗？")) removeSheet(id);
  };

  const submitSheet = async (payload) => {
    const name = payload?.name || "";
    if (editingSheet) await renameSheet(editingSheet.id, name);
    else await addSheet(name);
    setListFormOpen(false);
  };

  const handleAddBook = () => {
    if (!activeSheet) return;
    setEditingBook(null);
    setBookFormOpen(true);
  };

  const handleEditBook = (b) => {
    setEditingBook(b);
    setBookFormOpen(true);
  };

  const submitBook = async (payload) => {
    if (!activeSheet) return;
    if (editingBook) await updateBookInSheet(activeSheet.id, editingBook.id, payload);
    else await addBookToSheet(activeSheet.id, payload);
    setBookFormOpen(false);
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold">我的书单</span>
          <button onClick={handleAddSheet} className="text-xs text-blue-500">
            新增
          </button>
        </div>
        {sheets.length === 0 ? (
          <div className="text-sm text-gray-500">暂无书单</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sheets.map((s) => (
              <div
                key={s.id}
                onClick={() => setActiveSheetId(s.id)}
                className={classNames(
                  "group relative p-4 rounded-2xl border cursor-pointer transition hover:shadow-sm",
                  activeSheetId === s.id && "ring-2 ring-rose-300"
                )}
                style={{ borderColor: THEME.border }}
              >
                <div className="font-semibold mb-1 truncate">{s.name}</div>
                <div className="text-xs text-gray-500 mb-1">
                  {s.bookCount ?? 0} 本书
                </div>
                <div className="text-[11px] text-gray-400">
                  更新 {formatDate(s.updatedAt)}
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 text-[11px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRenameSheet(s.id, s.name);
                    }}
                    className="text-blue-500"
                  >
                    编辑
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSheet(s.id);
                    }}
                    className="text-red-500"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeSheet ? (
        <>
          <div className="flex items-center justify-between mb-3">
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
          {sheetBooks.length === 0 ? (
            <div className="text-sm text-gray-500">暂无书籍</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {sheetBooks.map((b) => (
                <div
                  key={b.id}
                  className="group flex gap-3 p-4 border rounded-2xl"
                  style={{ borderColor: THEME.border }}
                >
                  <div className="w-20 h-28 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                    {b.coverUrl ? (
                      <img
                        src={b.coverUrl}
                        alt="cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm">{b.title?.[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="font-medium truncate">{b.title}</div>
                    {b.author && (
                      <div className="text-xs text-gray-600 truncate">
                        {b.author}
                      </div>
                    )}
                    <div className="text-[11px] text-gray-500">
                      {b.orientation} / {b.category}
                    </div>
                    {b.rating != null && (
                      <div className="text-[11px] text-gray-500">
                        评分: {b.rating}
                      </div>
                    )}
                    {b.review && (
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {b.review}
                      </div>
                    )}
                    <div className="mt-auto flex gap-2 opacity-0 group-hover:opacity-100 text-[11px] pt-2">
                      <button
                        onClick={() => handleEditBook(b)}
                        className="text-blue-500"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => removeBookFromSheet(activeSheet.id, b.id)}
                        className="text-red-500"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-sm text-gray-500">请选择书单</div>
      )}

      <BottomSheetForm
        mode="list"
        open={listFormOpen}
        onClose={() => setListFormOpen(false)}
        onSubmit={submitSheet}
        initialValues={editingSheet || {}}
      />
      <BottomSheetForm
        mode="book"
        open={bookFormOpen}
        onClose={() => setBookFormOpen(false)}
        onSubmit={submitBook}
        initialValues={editingBook || {}}
      />
    </>
  );
}

