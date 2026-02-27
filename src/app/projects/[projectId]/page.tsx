import { notFound } from "next/navigation";
import { getProject } from "@/db/queries/projects";
import { ProjectHeader } from "@/components/project-header";

type Props = {
  params: Promise<{ projectId: string }>;
};

/** プロジェクトダッシュボードページ */
export default async function DashboardPage({ params }: Props) {
  const { projectId } = await params;
  const project = await getProject(projectId);

  if (!project) {
    notFound();
  }

  return (
    <>
      <ProjectHeader projectName={project.name} currentPage="ダッシュボード" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">ダッシュボード</h1>
        <p className="text-muted-foreground">プロジェクトの概要がここに表示されます。</p>
      </div>
    </>
  );
}