import { notFound } from "next/navigation";
import { getProject } from "@/db/queries/projects";
import { getProjectMembersWithUsers } from "@/db/queries/members";
import { getAvailableUsersForProject } from "@/db/queries/users";
import { ProjectHeader } from "@/components/project-header";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { MemberTable } from "@/components/members/member-table";
import { AddMemberDialog } from "@/components/members/add-member-dialog";
import { AddUserDialog } from "@/components/members/add-user-dialog";

type Props = {
  params: Promise<{ projectId: string }>;
};

/** メンバーページ */
export default async function MembersPage({ params }: Props) {
  const { projectId } = await params;

  const [project, members, availableUsers] = await Promise.all([
    getProject(projectId),
    getProjectMembersWithUsers(projectId),
    getAvailableUsersForProject(projectId),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <>
      <ProjectHeader projectName={project.name} currentPage="メンバー" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageToolbar title="メンバー">
          <div className="flex gap-2">
            <AddUserDialog projectId={projectId} />
            {/* <AddMemberDialog projectId={projectId} availableUsers={availableUsers} /> */}
          </div>
        </PageToolbar>

        <MemberTable members={members} />
      </div>
    </>
  );
}
