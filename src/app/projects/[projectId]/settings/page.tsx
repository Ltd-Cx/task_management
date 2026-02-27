import { notFound } from "next/navigation";
import { getProject } from "@/db/queries/projects";
import { getProjectStatuses } from "@/db/queries/statuses";
import { getCurrentUser } from "@/db/queries/users";
import { ProjectHeader } from "@/components/project-header";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { ProjectSettingsForm } from "@/components/settings/project-settings-form";
import { StatusManagement } from "@/components/settings/status-management";
import { AvatarSettings } from "@/components/settings/avatar-settings";
import { DangerZone } from "@/components/settings/danger-zone";

type Props = {
  params: Promise<{ projectId: string }>;
};

/** プロジェクト設定ページ */
export default async function SettingsPage({ params }: Props) {
  const { projectId } = await params;
  const [project, statuses, currentUser] = await Promise.all([
    getProject(projectId),
    getProjectStatuses(projectId),
    getCurrentUser(),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <>
      <ProjectHeader projectName={project.name} currentPage="プロジェクト設定" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageToolbar title="プロジェクト設定" />
        <ProjectSettingsForm project={project} />
        {currentUser && <AvatarSettings user={currentUser} />}
        <StatusManagement projectId={project.id} statuses={statuses} />
        <DangerZone projectId={project.id} projectName={project.name} />
      </div>
    </>
  );
}
