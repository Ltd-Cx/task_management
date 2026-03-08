"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { DragState } from "../types";
import { GANTT_CONSTANTS } from "../types";
import { pixelsToDays, addDays } from "../utils/date-utils";

interface UseGanttDragProps {
  onDragEnd?: (
    taskId: string,
    newStartDate: string,
    newEndDate: string
  ) => void;
  onTaskClick?: (taskId: string) => void;
  /** ドラッグ中にマウス位置ベースでスクロール速度を調整 */
  onDragScroll?: (clientX: number, onScrollUpdate?: () => void) => void;
  /** ドラッグ開始時のコールバック（開始時のスクロール位置を返す） */
  onDragStart?: () => number;
  /** ドラッグ完了時のコールバック */
  onDragComplete?: () => void;
  /** 現在のスクロール位置を取得 */
  getScrollLeft?: () => number;
}

interface UseGanttDragReturn {
  dragState: DragState | null;
  isDragging: boolean;
  registerTaskBar: (taskId: string, element: HTMLDivElement | null) => void;
  handleMouseDown: (
    e: React.MouseEvent,
    taskId: string,
    mode: DragState["mode"],
    startLeft: number,
    startWidth: number,
    originalStartDate: string,
    originalEndDate: string
  ) => void;
}

export function useGanttDrag({
  onDragEnd,
  onTaskClick,
  onDragScroll,
  onDragStart,
  onDragComplete,
  getScrollLeft,
}: UseGanttDragProps): UseGanttDragReturn {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // タスクバー要素のマップ
  const taskBarRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // ドラッグ関連のref
  const dragStateRef = useRef<DragState | null>(null);
  const hasMoved = useRef(false);
  const rafId = useRef<number | null>(null);
  const currentDeltaX = useRef(0);
  // スクロール追従用
  const startScrollLeft = useRef(0);

  // タスクバー要素の登録
  const registerTaskBar = useCallback(
    (taskId: string, element: HTMLDivElement | null) => {
      if (element) {
        taskBarRefs.current.set(taskId, element);
      } else {
        taskBarRefs.current.delete(taskId);
      }
    },
    []
  );

  const handleMouseDown = useCallback(
    (
      e: React.MouseEvent,
      taskId: string,
      mode: DragState["mode"],
      startLeft: number,
      startWidth: number,
      originalStartDate: string,
      originalEndDate: string
    ) => {
      e.preventDefault();
      e.stopPropagation();

      hasMoved.current = false;
      currentDeltaX.current = 0;

      const state: DragState = {
        taskId,
        mode,
        startX: e.clientX,
        startLeft,
        startWidth,
        originalStartDate,
        originalEndDate,
      };

      dragStateRef.current = state;
      setDragState(state);
    },
    []
  );

  // requestAnimationFrameでDOM更新
  const updateTaskBarPosition = useCallback(() => {
    const state = dragStateRef.current;
    if (!state) return;

    const element = taskBarRefs.current.get(state.taskId);
    if (!element) return;

    // マウス移動量 + スクロール差分
    const currentScroll = getScrollLeft?.() ?? 0;
    const scrollDelta = currentScroll - startScrollLeft.current;
    let totalDeltaX = currentDeltaX.current + scrollDelta;

    // バーが現在のスクロール位置の左端を超えないように制限
    // バーの新しい位置 = startLeft + totalDeltaX
    // これが currentScroll より小さくならないようにする
    if (state.mode === "move" || state.mode === "resize-left") {
      const newBarLeft = state.startLeft + totalDeltaX;
      if (newBarLeft < currentScroll) {
        totalDeltaX = currentScroll - state.startLeft;
      }
    }

    if (state.mode === "move") {
      // transform で移動（GPUアクセラレーション）
      element.style.transform = `translateX(${totalDeltaX}px)`;
    } else if (state.mode === "resize-left") {
      // 左リサイズ: 位置と幅を変更
      const newWidth = Math.max(
        GANTT_CONSTANTS.CELL_WIDTH,
        state.startWidth - totalDeltaX
      );
      element.style.transform = `translateX(${totalDeltaX}px)`;
      element.style.width = `${newWidth}px`;
    } else if (state.mode === "resize-right") {
      // 右リサイズ: 幅のみ変更
      const newWidth = Math.max(
        GANTT_CONSTANTS.CELL_WIDTH,
        state.startWidth + totalDeltaX
      );
      element.style.width = `${newWidth}px`;
    }

    rafId.current = null;
  }, [getScrollLeft]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const state = dragStateRef.current;
      if (!state) return;

      const deltaX = e.clientX - state.startX;
      currentDeltaX.current = deltaX;

      if (Math.abs(deltaX) > 5 && !hasMoved.current) {
        hasMoved.current = true;
        setIsDragging(true);

        // ドラッグ開始を通知し、開始時のスクロール位置を記録
        startScrollLeft.current = onDragStart?.() ?? 0;

        // ドラッグ開始時にスタイルを適用
        const element = taskBarRefs.current.get(state.taskId);
        if (element) {
          element.style.opacity = "0.8";
          element.style.zIndex = "30";
          element.style.cursor = "grabbing";
          element.style.willChange = "transform, width";
        }
      }

      // ドラッグ中にマウス位置ベースでスクロール速度を調整
      if (hasMoved.current && onDragScroll) {
        onDragScroll(e.clientX, updateTaskBarPosition);
      }

      // requestAnimationFrameで次のフレームに更新をスケジュール
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(updateTaskBarPosition);
      }
    },
    [updateTaskBarPosition, onDragScroll, onDragStart]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      const state = dragStateRef.current;
      if (!state) return;

      // RAFをキャンセル
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }

      const element = taskBarRefs.current.get(state.taskId);

      if (hasMoved.current) {
        // マウス移動量 + スクロール差分
        const currentScroll = getScrollLeft?.() ?? 0;
        const scrollDelta = currentScroll - startScrollLeft.current;
        let deltaX = e.clientX - state.startX + scrollDelta;

        // バーが現在のスクロール位置の左端を超えないように制限
        if (state.mode === "move" || state.mode === "resize-left") {
          const newBarLeft = state.startLeft + deltaX;
          if (newBarLeft < currentScroll) {
            deltaX = currentScroll - state.startLeft;
          }
        }

        const daysDelta = pixelsToDays(deltaX);

        let newStartDate = state.originalStartDate;
        let newEndDate = state.originalEndDate;

        if (state.mode === "move") {
          newStartDate = addDays(state.originalStartDate, daysDelta);
          newEndDate = addDays(state.originalEndDate, daysDelta);
        } else if (state.mode === "resize-left") {
          const potentialStart = addDays(state.originalStartDate, daysDelta);
          if (potentialStart <= state.originalEndDate) {
            newStartDate = potentialStart;
          }
        } else if (state.mode === "resize-right") {
          const potentialEnd = addDays(state.originalEndDate, daysDelta);
          if (potentialEnd >= state.originalStartDate) {
            newEndDate = potentialEnd;
          }
        }

        // ドラッグ終了時: transformをリセットし、新しい位置を直接設定
        // これにより、Reactの再レンダリングまでバーが新しい位置に留まる
        if (element) {
          // 日数の差分をピクセルに変換
          const actualDaysDelta = pixelsToDays(deltaX);
          const pixelDelta = actualDaysDelta * GANTT_CONSTANTS.CELL_WIDTH;

          if (state.mode === "move") {
            // 移動: 新しいleft位置を設定
            element.style.transform = "";
            element.style.left = `${state.startLeft + pixelDelta}px`;
          } else if (state.mode === "resize-left") {
            // 左リサイズ: 新しいleftと幅を設定
            element.style.transform = "";
            element.style.left = `${state.startLeft + pixelDelta}px`;
            element.style.width = `${Math.max(
              GANTT_CONSTANTS.CELL_WIDTH,
              state.startWidth - pixelDelta
            )}px`;
          } else if (state.mode === "resize-right") {
            // 右リサイズ: 新しい幅を設定（leftはそのまま）
            element.style.width = `${Math.max(
              GANTT_CONSTANTS.CELL_WIDTH,
              state.startWidth + pixelDelta
            )}px`;
          }

          // その他のスタイルをリセット
          element.style.opacity = "";
          element.style.zIndex = "";
          element.style.cursor = "";
          element.style.willChange = "";
        }

        // 日付が変わった場合のみコールバック
        if (
          newStartDate !== state.originalStartDate ||
          newEndDate !== state.originalEndDate
        ) {
          onDragEnd?.(state.taskId, newStartDate, newEndDate);
        }

        // ドラッグ完了を通知
        onDragComplete?.();
      } else {
        // ドラッグしていない場合はクリックとして処理
        // left と width はリセットしない（Reactが管理しているため）
        if (element) {
          element.style.transform = "";
          element.style.opacity = "";
          element.style.zIndex = "";
          element.style.cursor = "";
          element.style.willChange = "";
        }
        onTaskClick?.(state.taskId);
      }

      dragStateRef.current = null;
      setDragState(null);
      setIsDragging(false);
      hasMoved.current = false;
      currentDeltaX.current = 0;
    },
    [onDragEnd, onTaskClick, onDragComplete, getScrollLeft]
  );

  useEffect(() => {
    if (dragState) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        if (rafId.current !== null) {
          cancelAnimationFrame(rafId.current);
        }
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  return {
    dragState,
    isDragging,
    registerTaskBar,
    handleMouseDown,
  };
}
