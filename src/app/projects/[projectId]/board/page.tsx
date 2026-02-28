import { notFound } from "next/navigation";
import { getProject } from "@/db/queries/projects";
import { getTasksByStatus } from "@/db/queries/tasks";
import { getProjectStatusesWithDefaults } from "@/db/queries/statuses";
import { ProjectHeader } from "@/components/project-header";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { BoardView } from "@/components/board/board-view";

type Props = {
  params: Promise<{ projectId: string }>;
};

/** ボード（カンバン）ページ */
export default async function BoardPage({ params }: Props) {
  const { projectId } = await params;

  const [project, tasksByStatus, statuses] = await Promise.all([
    getProject(projectId),
    getTasksByStatus(projectId),
    getProjectStatusesWithDefaults(projectId),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <>
      <ProjectHeader projectName={project.name} currentPage="ボード" />
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <PageToolbar title="ボード" />
        <BoardView
          tasksByStatus={tasksByStatus}
          statuses={statuses}
          projectKey={project.key}
          projectId={projectId}
        />
      </div>
    </>
  );
}
