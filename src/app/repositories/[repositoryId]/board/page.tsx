import { notFound } from "next/navigation";
import { getRepository } from "@/db/queries/projects";
import { getTasksByStatus } from "@/db/queries/tasks";
import { getRepositoryStatusesWithDefaults } from "@/db/queries/statuses";
import { RepositoryHeader } from "@/components/repository-header";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { BoardView } from "@/components/board/board-view";

type Props = {
  params: Promise<{ repositoryId: string }>;
};

/** ボード（カンバン）ページ */
export default async function BoardPage({ params }: Props) {
  const { repositoryId } = await params;

  const [repository, tasksByStatus, statuses] = await Promise.all([
    getRepository(repositoryId),
    getTasksByStatus(repositoryId),
    getRepositoryStatusesWithDefaults(repositoryId),
  ]);

  if (!repository) {
    notFound();
  }

  return (
    <>
      <RepositoryHeader repositoryName={repository.name} currentPage="ボード" />
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <PageToolbar title="ボード" />
        <BoardView
          tasksByStatus={tasksByStatus}
          statuses={statuses}
          repositoryKey={repository.key}
          repositoryId={repositoryId}
        />
      </div>
    </>
  );
}
