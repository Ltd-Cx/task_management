import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Supabaseクライアント（ブラウザ用） */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Storageバケット名 */
export const AVATAR_BUCKET = "user";
export const CONTENT_BUCKET = "user"; // コンテンツ画像も同じバケットを使用

/**
 * アバター画像をSupabase Storageにアップロード
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  // ファイル拡張子を取得
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const allowedExts = ["jpg", "jpeg", "png", "gif", "webp"];

  if (!allowedExts.includes(ext)) {
    return { error: "許可されていないファイル形式です（jpg, png, gif, webpのみ）" };
  }

  // ファイルサイズチェック（5MB以下）
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: "ファイルサイズは5MB以下にしてください" };
  }

  // ファイル名を生成（ユーザーIDベース）
  const fileName = `${userId}/avatar.${ext}`;

  // 既存ファイルを削除（存在する場合）
  await supabase.storage.from(AVATAR_BUCKET).remove([fileName]);

  // アップロード
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { error: "アップロードに失敗しました" };
  }

  // 公開URLを取得
  const { data } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(fileName);

  return { url: data.publicUrl };
}

/**
 * アバター画像を削除
 */
export async function deleteAvatar(userId: string): Promise<{ success: boolean; error?: string }> {
  // ユーザーフォルダ内のファイルをリスト
  const { data: files, error: listError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .list(userId);

  if (listError) {
    console.error("List error:", listError);
    return { success: false, error: "ファイル一覧の取得に失敗しました" };
  }

  if (!files || files.length === 0) {
    return { success: true };
  }

  // ファイルを削除
  const filePaths = files.map((f) => `${userId}/${f.name}`);
  const { error: removeError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove(filePaths);

  if (removeError) {
    console.error("Remove error:", removeError);
    return { success: false, error: "ファイルの削除に失敗しました" };
  }

  return { success: true };
}

/**
 * エディタ用画像をSupabase Storageにアップロード
 */
export async function uploadEditorImage(
  file: File
): Promise<{ url: string } | { error: string }> {
  // ファイル拡張子を取得
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const allowedExts = ["jpg", "jpeg", "png", "gif", "webp"];

  if (!allowedExts.includes(ext)) {
    return { error: "許可されていないファイル形式です（jpg, png, gif, webpのみ）" };
  }

  // ファイルサイズチェック（10MB以下）
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: "ファイルサイズは10MB以下にしてください" };
  }

  // ユニークなファイル名を生成
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const fileName = `content/${timestamp}-${randomStr}.${ext}`;

  // アップロード
  const { error: uploadError } = await supabase.storage
    .from(CONTENT_BUCKET)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { error: "アップロードに失敗しました" };
  }

  // 公開URLを取得
  const { data } = supabase.storage
    .from(CONTENT_BUCKET)
    .getPublicUrl(fileName);

  return { url: data.publicUrl };
}
