import { notFound } from "next/navigation";
import { getRepository, getCategories } from "@/db/queries/projects";
import { getRepositoryStatuses } from "@/db/queries/statuses";
import { getCurrentUser } from "@/db/queries/users";
import { RepositoryHeader } from "@/components/repository-header";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { RepositorySettingsForm } from "@/components/settings/repository-settings-form";
import { StatusManagement } from "@/components/settings/status-management";
import { CategoryManagement } from "@/components/settings/category-management";
import { AvatarSettings } from "@/components/settings/avatar-settings";
import { DangerZone } from "@/components/settings/danger-zone";

type Props = {
  params: Promise<{ repositoryId: string }>;
};

/** リポジトリ設定ページ */
export default async function SettingsPage({ params }: Props) {
  const { repositoryId } = await params;
  const [repository, statuses, categories, currentUser] = await Promise.all([
    getRepository(repositoryId),
    getRepositoryStatuses(repositoryId),
    getCategories(repositoryId),
    getCurrentUser(),
  ]);

  if (!repository) {
    notFound();
  }

  return (
    <>
      <RepositoryHeader repositoryName={repository.name} currentPage="リポジトリ設定" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageToolbar title="リポジトリ設定" />
        <RepositorySettingsForm repository={repository} />
        {currentUser && <AvatarSettings user={currentUser} />}
        <StatusManagement repositoryId={repository.id} statuses={statuses} />
        <CategoryManagement repositoryId={repository.id} categories={categories} />
        {/* <DangerZone repositoryId={repository.id} repositoryName={repository.name} /> */}
      </div>
    </>
  );
}
