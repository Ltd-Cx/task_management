import { notFound } from "next/navigation";
import { getRepository, getCategories } from "@/db/queries/projects";
import { getTasksWithRelations } from "@/db/queries/tasks";
import { getRepositoryMembersWithUsers } from "@/db/queries/members";
import { getRepositoryStatusesWithDefaults } from "@/db/queries/statuses";
import { getTaskProjectsWithCounts } from "@/db/queries/task-groups";
import { RepositoryHeader } from "@/components/repository-header";
import { TaskListToolbar } from "@/components/tasks/task-list-toolbar";
import { TaskTable } from "@/components/tasks/task-table";

type Props = {
  params: Promise<{ repositoryId: string }>;
};

/** 課題一覧ページ */
export default async function TasksPage({ params }: Props) {
  const { repositoryId } = await params;

  const [repository, tasks, members, categories, statuses, taskProjects] = await Promise.all([
    getRepository(repositoryId),
    getTasksWithRelations(repositoryId),
    getRepositoryMembersWithUsers(repositoryId),
    getCategories(repositoryId),
    getRepositoryStatusesWithDefaults(repositoryId),
    getTaskProjectsWithCounts(repositoryId),
  ]);

  if (!repository) {
    notFound();
  }

  return (
    <>
      <RepositoryHeader repositoryName={repository.name} currentPage="課題" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <TaskListToolbar
          repositoryId={repositoryId}
          members={members}
          categories={categories}
          statuses={statuses}
          taskGroups={taskProjects}
        />
        <TaskTable
          tasks={tasks}
          repositoryKey={repository.key}
          repositoryId={repositoryId}
          members={members}
          categories={categories}
          statuses={statuses}
          taskGroups={taskProjects}
        />
      </div>
    </>
  );
}
