import { notFound } from "next/navigation";
import { getProject, getCategories } from "@/db/queries/projects";
import { getTasksWithRelations } from "@/db/queries/tasks";
import { getProjectMembersWithUsers } from "@/db/queries/members";
import { ProjectHeader } from "@/components/project-header";
import { TaskListToolbar } from "@/components/tasks/task-list-toolbar";
import { TaskTable } from "@/components/tasks/task-table";

type Props = {
  params: Promise<{ projectId: string }>;
};

/** 課題一覧ページ */
export default async function TasksPage({ params }: Props) {
  const { projectId } = await params;

  const [project, tasks, members, categories] = await Promise.all([
    getProject(projectId),
    getTasksWithRelations(projectId),
    getProjectMembersWithUsers(projectId),
    getCategories(projectId),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <>
      <ProjectHeader projectName={project.name} currentPage="課題" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <TaskListToolbar
          projectId={projectId}
          members={members}
          categories={categories}
        />
        <TaskTable
          tasks={tasks}
          projectKey={project.key}
          projectId={projectId}
          members={members}
          categories={categories}
        />
      </div>
    </>
  );
}
