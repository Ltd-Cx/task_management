import { notFound } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getRepository, getRepositoriesWithStats } from "@/db/queries/projects";
import { getCurrentUser } from "@/db/queries/users";


/** リポジトリ共通レイアウト（サイドバー + メインコンテンツ） */
export default async function RepositoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ repositoryId: string }>;
}) {
  const { repositoryId } = await params;
  const [repository, currentUser, repositoriesWithStats] = await Promise.all([
    getRepository(repositoryId),
    getCurrentUser(),
    getRepositoriesWithStats(),
  ]);

  if (!repository) {
    notFound();
  }

  return (
    <SidebarProvider>
      <AppSidebar
        repository={repository}
        currentUser={currentUser ?? undefined}
        allRepositories={repositoriesWithStats}
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
