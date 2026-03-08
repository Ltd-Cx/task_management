import { notFound } from "next/navigation";
import { getProject, getCategories } from "@/db/queries/projects";
import { getProjectMembersWithUsers } from "@/db/queries/members";
import { getTasksWithDates } from "@/db/queries/tasks";
import { getProjectStatusesWithDefaults } from "@/db/queries/statuses";
import { getTaskGroups } from "@/db/queries/task-groups";
import { ProjectHeader } from "@/components/project-header";
import { GanttView } from "@/components/gantt/gantt-view";
import { PageToolbar } from "@/components/shared/page-toolbar";

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
      getTaskGroups(projectId),
    ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <ProjectHeader projectName={project.name} currentPage="ガントチャート" />
      <div className="flex flex-1 flex-col gap-6 overflow-hidden p-6">
        <PageToolbar title="ガントチャート" />
        <div className="min-h-0 flex-1 overflow-hidden">
          <GanttView
            tasks={tasks}
            taskGroups={taskGroups}
            projectKey={project.key}
            projectId={projectId}
            members={members}
            categories={categories}
            statuses={statuses}
          />
        </div>
      </div>
    </div>
  );
}
