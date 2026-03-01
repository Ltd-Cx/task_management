import { notFound } from "next/navigation";
import { getProject, getCategories } from "@/db/queries/projects";
import { getProjectMembersWithUsers } from "@/db/queries/members";
import { getTasksWithDates } from "@/db/queries/tasks";
import { getProjectStatusesWithDefaults } from "@/db/queries/statuses";
import { ProjectHeader } from "@/components/project-header";
import { GanttTestWrapper } from "./gantt-test-wrapper";
import { PageToolbar } from "@/components/shared/page-toolbar";

type Props = {
  params: Promise<{ projectId: string }>;
};

/** ガントチャートページ */
export default async function GanttPage({ params }: Props) {
  const { projectId } = await params;

  const [project, tasks, members, categories, statuses] = await Promise.all([
    getProject(projectId),
    getTasksWithDates(projectId),
    getProjectMembersWithUsers(projectId),
    getCategories(projectId),
    getProjectStatusesWithDefaults(projectId),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <ProjectHeader projectName={project.name} currentPage="ガントチャート" />
      <div className="flex-1 overflow-hidden gap-6 p-6">
        <PageToolbar title="ガントチャート" />
        <div className="h-full mt-8 overflow-hidden">
          <GanttTestWrapper
            tasks={tasks}
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
