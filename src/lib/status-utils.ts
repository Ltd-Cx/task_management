import { z } from "zod";
import type { TaskStatusConfig } from "@/types";

/** ステータス設定の型 */
export type StatusConfigItem = {
  label: string;
  color: string;
  dotClass: string;
  bgClass: string;
  barClass: string;
};

export type StatusConfigMap = Record<string, StatusConfigItem>;

/**
 * 色コードからTailwindクラスを生成するヘルパー
 * 注: 動的クラスはTailwindでパージされる可能性があるため、
 * インラインスタイルを使用するか、safelist に追加が必要
 */
function colorToClasses(color: string) {
  // 動的クラス生成は Tailwind のパージに対応できないため、
  // インラインスタイルで色を適用することを推奨
  return {
    dotClass: "", // インラインスタイルで対応
    bgClass: "", // インラインスタイルで対応
    barClass: "", // インラインスタイルで対応
  };
}

/**
 * TaskStatusConfig配列からステータス設定マップを生成
 */
export function buildStatusConfig(statuses: TaskStatusConfig[]): StatusConfigMap {
  return Object.fromEntries(
    statuses.map((status) => [
      status.key,
      {
        label: status.label,
        color: status.color,
        ...colorToClasses(status.color),
      },
    ])
  );
}

/**
 * ステータスキーに基づく動的Zodバリデーターを生成
 */
export function createStatusValidator(statuses: TaskStatusConfig[]) {
  const keys = statuses.map((s) => s.key) as [string, ...string[]];
  return z.enum(keys);
}

/**
 * ステータスキーが有効かどうかを検証
 */
export function isValidStatusKey(statuses: TaskStatusConfig[], key: string): boolean {
  return statuses.some((s) => s.key === key);
}

/**
 * ステータスキーから設定を取得
 */
export function getStatusConfig(statuses: TaskStatusConfig[], key: string): TaskStatusConfig | undefined {
  return statuses.find((s) => s.key === key);
}

/**
 * displayOrderでソートされたステータス配列を返す
 */
export function sortStatusesByOrder(statuses: TaskStatusConfig[]): TaskStatusConfig[] {
  return [...statuses].sort((a, b) => a.displayOrder - b.displayOrder);
}
