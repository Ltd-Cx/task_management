import { notFound } from "next/navigation";
import { getRepository } from "@/db/queries/projects";
import { getRepositoryMembersWithUsers } from "@/db/queries/members";
import { getAvailableUsersForRepository } from "@/db/queries/users";
import { RepositoryHeader } from "@/components/repository-header";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { MemberTable } from "@/components/members/member-table";
import { AddMemberDialog } from "@/components/members/add-member-dialog";
import { AddUserDialog } from "@/components/members/add-user-dialog";

type Props = {
  params: Promise<{ repositoryId: string }>;
};

/** メンバーページ */
export default async function MembersPage({ params }: Props) {
  const { repositoryId } = await params;

  const [repository, members, availableUsers] = await Promise.all([
    getRepository(repositoryId),
    getRepositoryMembersWithUsers(repositoryId),
    getAvailableUsersForRepository(repositoryId),
  ]);

  if (!repository) {
    notFound();
  }

  return (
    <>
      <RepositoryHeader repositoryName={repository.name} currentPage="メンバー" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageToolbar title="メンバー">
          <div className="flex gap-2">
            <AddUserDialog repositoryId={repositoryId} />
            {/* <AddMemberDialog repositoryId={repositoryId} availableUsers={availableUsers} /> */}
          </div>
        </PageToolbar>

        <MemberTable members={members} repositoryId={repositoryId} />
      </div>
    </>
  );
}
