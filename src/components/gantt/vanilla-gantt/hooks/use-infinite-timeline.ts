"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { GANTT_CONSTANTS } from "../types";

const DAYS_TO_ADD = 365; // 追加する日数（1年）
const SCROLL_THRESHOLD = 400; // スクロール閾値（px）
const EDGE_ZONE_RATIO = 0.15; // エッジゾーン（画面幅の15%）
const MAX_SCROLL_SPEED = 5; // 最大スクロール速度（px/frame）
const MIN_SCROLL_SPEED = 1; // 最小スクロール速度（px/frame）

interface UseInfiniteTimelineProps {
  initialStartDate: Date;
  initialEndDate: Date;
}

interface UseInfiniteTimelineReturn {
  viewStartDate: Date;
  viewEndDate: Date;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  isLoadingPast: boolean;
  isLoadingFuture: boolean;
  /** ドラッグ中にスクロールを制御（マウス位置ベースの速度調整） */
  handleDragScroll: (clientX: number, onScrollUpdate?: () => void) => void;
  /** ドラッグ開始時のスクロール位置を記録 */
  startDrag: () => number;
  /** ドラッグ終了 */
  endDrag: () => void;
  /** 現在のスクロール位置を取得 */
  getScrollLeft: () => number;
}

export function useInfiniteTimeline({
  initialStartDate,
  initialEndDate,
}: UseInfiniteTimelineProps): UseInfiniteTimelineReturn {
  const [viewStartDate, setViewStartDate] = useState(initialStartDate);
  const [viewEndDate, setViewEndDate] = useState(initialEndDate);
  const [isLoadingPast, setIsLoadingPast] = useState(false);
  const [isLoadingFuture, setIsLoadingFuture] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const isAddingRef = useRef(false);
  const lastScrollLeftRef = useRef(0);

  // ドラッグ中フラグ（日付追加を完全に無効化するため）
  const isDraggingRef = useRef(false);

  // 慣性スクロール用
  const scrollVelocityRef = useRef(0); // 現在のスクロール速度（正=右、負=左）
  const autoScrollRafRef = useRef<number | null>(null);
  const isInEdgeZoneRef = useRef(false);
  const onScrollUpdateRef = useRef<(() => void) | null>(null);

  // 過去の日付を追加（ドラッグ中は絶対に実行しない）
  const addPastDates = useCallback(() => {
    // ドラッグ中は完全にスキップ
    if (isDraggingRef.current) return;
    if (isAddingRef.current || isLoadingPast) return;

    const timeline = timelineRef.current;
    if (!timeline) return;

    isAddingRef.current = true;
    setIsLoadingPast(true);

    // 現在のスクロール位置を保存
    const currentScrollLeft = timeline.scrollLeft;
    const addedWidth = DAYS_TO_ADD * GANTT_CONSTANTS.CELL_WIDTH;

    // 日付を追加
    setViewStartDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - DAYS_TO_ADD);
      return newDate;
    });

    // スクロール位置を調整（次フレームで実行）
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (timeline) {
          timeline.scrollLeft = currentScrollLeft + addedWidth;
        }
        isAddingRef.current = false;
        setIsLoadingPast(false);
      });
    });
  }, [isLoadingPast]);

  // 未来の日付を追加（ドラッグ中は絶対に実行しない）
  const addFutureDates = useCallback(() => {
    // ドラッグ中は完全にスキップ
    if (isDraggingRef.current) return;
    if (isAddingRef.current || isLoadingFuture) return;

    isAddingRef.current = true;
    setIsLoadingFuture(true);

    // 日付を追加
    setViewEndDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + DAYS_TO_ADD);
      return newDate;
    });

    // 次フレームで完了
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        isAddingRef.current = false;
        setIsLoadingFuture(false);
      });
    });
  }, [isLoadingFuture]);

  // スクロールイベントハンドラ（ドラッグ中は日付追加を完全スキップ）
  const handleScroll = useCallback(() => {
    const timeline = timelineRef.current;
    if (!timeline || isAddingRef.current) return;

    // ドラッグ中は日付追加を完全にスキップ
    if (isDraggingRef.current) {
      lastScrollLeftRef.current = timeline.scrollLeft;
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = timeline;
    const scrollRight = scrollWidth - scrollLeft - clientWidth;

    // 左端に近づいた場合
    if (scrollLeft < SCROLL_THRESHOLD) {
      addPastDates();
    }

    // 右端に近づいた場合
    if (scrollRight < SCROLL_THRESHOLD) {
      addFutureDates();
    }

    lastScrollLeftRef.current = scrollLeft;
  }, [addPastDates, addFutureDates]);

  // 自動スクロールアニメーションループ
  const runAutoScroll = useCallback(() => {
    const timeline = timelineRef.current;
    if (!timeline || !isDraggingRef.current) {
      autoScrollRafRef.current = null;
      return;
    }

    const velocity = scrollVelocityRef.current;
    if (velocity !== 0 && isInEdgeZoneRef.current) {
      timeline.scrollLeft += velocity;
      // スクロール後にバー位置を更新
      onScrollUpdateRef.current?.();
      autoScrollRafRef.current = requestAnimationFrame(runAutoScroll);
    } else {
      autoScrollRafRef.current = null;
    }
  }, []);

  // 自動スクロールを開始
  const startAutoScroll = useCallback(
    (velocity: number) => {
      scrollVelocityRef.current = velocity;
      isInEdgeZoneRef.current = true;

      if (autoScrollRafRef.current === null) {
        autoScrollRafRef.current = requestAnimationFrame(runAutoScroll);
      }
    },
    [runAutoScroll]
  );

  // 自動スクロールを停止
  const stopAutoScroll = useCallback(() => {
    isInEdgeZoneRef.current = false;
    scrollVelocityRef.current = 0;

    if (autoScrollRafRef.current !== null) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  }, []);

  // ドラッグ開始（現在のスクロール位置を返す）
  const startDrag = useCallback(() => {
    isDraggingRef.current = true;
    return timelineRef.current?.scrollLeft ?? 0;
  }, []);

  // 現在のスクロール位置を取得
  const getScrollLeft = useCallback(() => {
    return timelineRef.current?.scrollLeft ?? 0;
  }, []);

  // ドラッグ終了
  const endDrag = useCallback(() => {
    isDraggingRef.current = false;
    stopAutoScroll();
  }, [stopAutoScroll]);

  // ドラッグ中にスクロールを制御（マウス位置ベースの速度調整）
  // 画面の左端に近いほど左スクロールが速く、右端に近いほど右スクロールが速い
  const handleDragScroll = useCallback(
    (clientX: number, onScrollUpdate?: () => void) => {
      const timeline = timelineRef.current;
      if (!timeline) return;

      // コールバックを保存
      if (onScrollUpdate) {
        onScrollUpdateRef.current = onScrollUpdate;
      }

      // タイムラインの画面上の位置を取得
      const rect = timeline.getBoundingClientRect();
      const timelineWidth = rect.width;
      const edgeZoneWidth = timelineWidth * EDGE_ZONE_RATIO;

      // マウスのタイムライン内での相対位置
      const relativeX = clientX - rect.left;

      // マウスがタイムライン外の場合はスクロール停止
      if (relativeX < 0 || relativeX > timelineWidth) {
        stopAutoScroll();
        return;
      }

      // 左エッジゾーン内の場合
      if (relativeX < edgeZoneWidth) {
        // 左端に近いほど速い（0で最大速度、edgeZoneWidthで最小速度）
        const ratio = 1 - relativeX / edgeZoneWidth;
        const speed = MIN_SCROLL_SPEED + (MAX_SCROLL_SPEED - MIN_SCROLL_SPEED) * ratio;
        startAutoScroll(-speed);
        return;
      }

      // 右エッジゾーン内の場合
      if (relativeX > timelineWidth - edgeZoneWidth) {
        // 右端に近いほど速い
        const distanceFromRight = timelineWidth - relativeX;
        const ratio = 1 - distanceFromRight / edgeZoneWidth;
        const speed = MIN_SCROLL_SPEED + (MAX_SCROLL_SPEED - MIN_SCROLL_SPEED) * ratio;
        startAutoScroll(speed);
        return;
      }

      // 中央エリアではスクロール停止
      stopAutoScroll();
    },
    [startAutoScroll, stopAutoScroll]
  );

  // 初期表示時に今日の日付にスクロール
  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    // initialStartDateから今日までの日数を計算
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(initialStartDate);
    startDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 今日の日付が画面中央付近に来るようにスクロール
    const todayPosition = diffDays * GANTT_CONSTANTS.CELL_WIDTH;
    const centerOffset = timeline.clientWidth / 3; // 画面の1/3地点に今日を配置
    const initialScrollLeft = Math.max(0, todayPosition - centerOffset);

    timeline.scrollLeft = initialScrollLeft;
    lastScrollLeftRef.current = initialScrollLeft;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 初回マウント時のみ実行

  // スクロールイベントのリスナー設定
  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    // debounce用のタイマー
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debouncedScroll = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(handleScroll, 50);
    };

    timeline.addEventListener("scroll", debouncedScroll, { passive: true });

    return () => {
      timeline.removeEventListener("scroll", debouncedScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [handleScroll]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (autoScrollRafRef.current !== null) {
        cancelAnimationFrame(autoScrollRafRef.current);
      }
    };
  }, []);

  return {
    viewStartDate,
    viewEndDate,
    timelineRef,
    isLoadingPast,
    isLoadingFuture,
    handleDragScroll,
    startDrag,
    endDrag,
    getScrollLeft,
  };
}
