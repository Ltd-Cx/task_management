import { notFound } from "next/navigation";
import { getProject } from "@/db/queries/projects";
import { getProjectMembersWithUsers } from "@/db/queries/members";
import { ProjectHeader } from "@/components/project-header";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MemberTable } from "@/components/members/member-table";

type Props = {
  params: Promise<{ projectId: string }>;
};

/** メンバーページ */
export default async function MembersPage({ params }: Props) {
  const { projectId } = await params;

  const [project, members] = await Promise.all([
    getProject(projectId),
    getProjectMembersWithUsers(projectId),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <>
      <ProjectHeader projectName={project.name} currentPage="メンバー" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageToolbar title="メンバー">
          <Button size="sm">
            <Plus className="size-4" />
            メンバー追加
          </Button>
        </PageToolbar>

        <MemberTable members={members} />
      </div>
    </>
  );
}
