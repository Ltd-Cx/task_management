import { notFound } from "next/navigation";
import { getProject } from "@/db/queries/projects";
import { getTasksWithDates } from "@/db/queries/tasks";
import { ProjectHeader } from "@/components/project-header";
import { GanttView } from "@/components/gantt/gantt-view";

type Props = {
  params: Promise<{ projectId: string }>;
};

/** ガントチャートページ */
export default async function GanttPage({ params }: Props) {
  const { projectId } = await params;

  const [project, tasks] = await Promise.all([
    getProject(projectId),
    getTasksWithDates(projectId),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <ProjectHeader projectName={project.name} currentPage="ガントチャート" />
      <GanttView tasks={tasks} projectKey={project.key} projectId={projectId} />
    </div>
  );
}
