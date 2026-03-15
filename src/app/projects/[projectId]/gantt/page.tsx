import { notFound } from "next/navigation";
import { getProject, getCategories } from "@/db/queries/projects";
import { getProjectMembersWithUsers } from "@/db/queries/members";
import { getTasksWithDates } from "@/db/queries/tasks";
import { getProjectStatusesWithDefaults } from "@/db/queries/statuses";
import { getTaskGroupsWithCounts } from "@/db/queries/task-groups";
import { ProjectHeader } from "@/components/project-header";
import { GanttPageClient } from "@/components/gantt/gantt-page-client";

type Props = {
  params: Promise<{ projectId: string }>;
};

/** ガントチャートページ */
export default async function GanttPage({ params }: Props) {
  const { projectId } = await params;

  const [project, tasks, members, categories, statuses, taskGroups] =
    await Promise.all([
      getProject(projectId),
      getTasksWithDates(projectId),
      getProjectMembersWithUsers(projectId),
      getCategories(projectId),
      getProjectStatusesWithDefaults(projectId),
      getTaskGroupsWithCounts(projectId),
    ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <ProjectHeader projectName={project.name} currentPage="ガントチャート" />
      <GanttPageClient
        tasks={tasks}
        taskGroups={taskGroups}
        projectKey={project.key}
        projectId={projectId}
        members={members}
        categories={categories}
        statuses={statuses}
      />
    </div>
  );
}
