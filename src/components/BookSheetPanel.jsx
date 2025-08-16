// src/components/BookSheetPanel.jsx
import React, { useMemo, useState } from "react";
import { useAppStore } from "../store/AppStore";
import { THEME } from "../lib/theme";
import { classNames, formatDate } from "../lib/utils";
import BottomSheetForm from "./modals/BottomSheetForm";
import ConfirmModal from "./modals/ConfirmModal"; // ✅ 删除书单前确认
import MoveBookModal from "./modals/MoveBookModal";

// 纯UI组件
import SidebarList from "./ui/SidebarList";
import BookListRow from "./ui/BookListRow";
import EmptyState from "./ui/EmptyState";

/**
 * 左侧：竖排书单；右侧：书籍“行式列表”
 * 保留 BottomSheetForm 的新增/编辑能力；本次仅加入“删除书单确认弹窗”
 */
export default function BookSheetPanel() {
  const {
    // 数据
    sheets,
    sheetBooks,
    activeSheetId,

    // 行为
    setActiveSheetId,
    addSheet,
    renameSheet,
    removeSheet,

    addBookToSheet,
    updateBookInSheet,
    removeBookFromSheet,
    moveBookToSheet,
  } = useAppStore();

  // 当前激活书单
  const activeSheet = useMemo(
    () => (sheets || []).find((s) => s.id === activeSheetId) || null,
    [sheets, activeSheetId]
  );

  // 右侧书籍列表（兼容数组或 map 结构）
  const books = useMemo(() => {
    if (!activeSheetId) return [];
    const src = sheetBooks;
    if (Array.isArray(src)) return src;
    if (src && typeof src === "object") return src[activeSheetId] || [];
    return [];
  }, [sheetBooks, activeSheetId]);

  // ===== 弹层状态（书单） =====
  const [listFormOpen, setListFormOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState(null);

  // ✅ 删除确认弹窗状态
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteSheet, setPendingDeleteSheet] = useState(null);

  // ===== 弹层状态（书籍） =====
  const [bookFormOpen, setBookFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [movingBook, setMovingBook] = useState(null);

  // ===== 书单：新增 / 重命名 =====
  const openCreateSheet = () => {
    setEditingSheet(null);
    setListFormOpen(true);
  };
  const openRenameSheet = (sheet) => {
    setEditingSheet(sheet);
    setListFormOpen(true);
  };
  const submitSheet = async (values) => {
    const name = values?.name ?? values?.title ?? "";
    if (editingSheet?.id) {
      await renameSheet(editingSheet.id, name);
    } else {
      await addSheet(name);
    }
    setListFormOpen(false);
    setEditingSheet(null);
  };

  // ✅ 书单：删除前先弹确认框
  const requestDeleteSheet = (sheet) => {
    setPendingDeleteSheet(sheet);
    setConfirmOpen(true);
  };
  const handleConfirmDeleteSheet = async () => {
    if (pendingDeleteSheet?.id) {
      await removeSheet(pendingDeleteSheet.id);
    }
    setConfirmOpen(false);
    setPendingDeleteSheet(null);
  };
  const handleCancelDeleteSheet = () => {
    setConfirmOpen(false);
    setPendingDeleteSheet(null);
  };

  // ===== 书籍：新增 / 编辑 / 删除 =====
  const openCreateBook = () => {
    setEditingBook(null);
    setBookFormOpen(true);
  };
  const openEditBook = (book) => {
    setEditingBook(book);
    setBookFormOpen(true);
  };
  const submitBook = async (values) => {
    if (!activeSheetId) return;
    if (editingBook?.id) {
      await updateBookInSheet(activeSheetId, editingBook.id, values);
    } else {
      await addBookToSheet(activeSheetId, values);
    }
    setBookFormOpen(false);
    setEditingBook(null);
  };
  const deleteBook = async (book) => {
    if (!activeSheetId) return;
    await removeBookFromSheet(activeSheetId, book.id);
  };

  const openMoveBook = (book) => {
    setMovingBook(book);
    setMoveModalOpen(true);
  };

  // ✅ 仅执行业务并返回 Promise，成功/失败 Toast 交给 MoveBookModal 内部处理
  const handleMoveBook = (toId) => {
    if (!activeSheetId || !movingBook) return Promise.resolve();
    return moveBookToSheet(activeSheetId, movingBook, toId);
  };

  return (
    <>
      {/* 主体：两栏布局 */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-6">
        {/* 左侧竖排书单 */}
        <aside className="lg:sticky lg:top-20 h-fit space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-700">我的书单</div>
            <button
              onClick={openCreateSheet}
              className="text-xs text-pink-500 hover:underline"
            >
              新增
            </button>
          </div>

          <SidebarList
            items={(sheets || []).map((s) => ({
              id: s.id,
              title: s.name || s.title || "未命名书单",
              subtitle:
                "更新 " + (s.updatedAt ? formatDate(s.updatedAt) : "—"),
              badge:
                typeof s.bookCount === "number" ? `${s.bookCount} 本书` : undefined,
              active: s.id === activeSheetId,
              onClick: () => setActiveSheetId(s.id),
              onEdit: () => openRenameSheet(s),
              onDelete: () => requestDeleteSheet(s), // ✅ 先请求确认
            }))}
            emptyHint="还没有书单"
          />
        </aside>

        {/* 右侧该书单下的书籍列表 */}
        <section className="min-h-[320px]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-700">
              {activeSheet
                ? (activeSheet.name || activeSheet.title) + "（" + books.length + "）"
                : "请在左侧选择一个书单"}
            </div>

            {activeSheet && (
              <button
                onClick={openCreateBook}
                className="text-xs text-pink-500 hover:underline"
              >
                添加书籍
              </button>
            )}
          </div>

          {!activeSheet && (
            <EmptyState hint="左侧选择书单后，这里显示该书单中的书" />
          )}

          {activeSheet && books.length === 0 && (
            <EmptyState hint="这个书单还没有书，点击右上角“添加书籍”试试" />
          )}

          {activeSheet && books.length > 0 && (
            <div className="divide-y divide-[#F1E6EB] rounded-2xl border border-[#F1E6EB] bg-white/70">
              {books.map((b) => (
                <BookListRow
                  key={b.id}
                  book={b}
                  onEdit={() => openEditBook(b)}
                  onDelete={() => deleteBook(b)}
                  onMove={() => openMoveBook(b)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ===== 表单弹层：沿用原逻辑，不删除功能 ===== */}
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

      <MoveBookModal
        open={moveModalOpen}
        sheets={sheets.filter((s) => s.id !== activeSheetId)}
        onCancel={() => {
          setMoveModalOpen(false);
          setMovingBook(null);
        }}
        onConfirm={handleMoveBook}
      />

      {/* ✅ 删除书单确认弹窗 */}
      <ConfirmModal
        open={confirmOpen}
        title="删除书单"
        content={`确定删除「${
          pendingDeleteSheet?.name || pendingDeleteSheet?.title || ""
        }」书单吗？此操作将删除书单下所有书籍。`}
        onCancel={handleCancelDeleteSheet}
        onConfirm={handleConfirmDeleteSheet}
      />
    </>
  );
}
