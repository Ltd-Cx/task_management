import { redirect } from "next/navigation";
import { getFirstRepository } from "@/db/queries/projects";

/** ルートページ: 最初のリポジトリの課題一覧にリダイレクト */
export default async function Home() {
  const repository = await getFirstRepository();

  if (repository) {
    redirect(`/repositories/${repository.id}/tasks`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Backlog Clone</h1>
        <p className="mt-2 text-muted-foreground">
          リポジトリがまだありません
        </p>
      </div>
    </div>
  );
}
