import { notFound } from "next/navigation";
import { getRepository, getCategories } from "@/db/queries/projects";
import { getRepositoryMembersWithUsers } from "@/db/queries/members";
import { getTasksWithDates } from "@/db/queries/tasks";
import { getRepositoryStatusesWithDefaults } from "@/db/queries/statuses";
import { getTaskProjectsWithCounts } from "@/db/queries/task-groups";
import { RepositoryHeader } from "@/components/repository-header";
import { GanttPageClient } from "@/components/gantt/gantt-page-client";

type Props = {
  params: Promise<{ repositoryId: string }>;
};

/** ガントチャートページ */
export default async function GanttPage({ params }: Props) {
  const { repositoryId } = await params;

  const [repository, tasks, members, categories, statuses, taskProjects] =
    await Promise.all([
      getRepository(repositoryId),
      getTasksWithDates(repositoryId),
      getRepositoryMembersWithUsers(repositoryId),
      getCategories(repositoryId),
      getRepositoryStatusesWithDefaults(repositoryId),
      getTaskProjectsWithCounts(repositoryId),
    ]);

  if (!repository) {
    notFound();
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <RepositoryHeader repositoryName={repository.name} currentPage="ガントチャート" />
      <GanttPageClient
        tasks={tasks}
        taskGroups={taskProjects}
        repositoryKey={repository.key}
        repositoryId={repositoryId}
        members={members}
        categories={categories}
        statuses={statuses}
      />
    </div>
  );
}
