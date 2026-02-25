import { redirect } from "next/navigation";
import { getFirstProject } from "@/db/queries/projects";

/** ルートページ: 最初のプロジェクトの課題一覧にリダイレクト */
export default async function Home() {
  const project = await getFirstProject();

  if (project) {
    redirect(`/projects/${project.id}/tasks`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Backlog Clone</h1>
        <p className="mt-2 text-muted-foreground">
          プロジェクトがまだありません
        </p>
      </div>
    </div>
  );
}


