import { notFound } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getProject } from "@/db/queries/projects";
import { getCurrentUser } from "@/db/queries/users";


/** プロジェクト共通レイアウト（サイドバー + メインコンテンツ） */
export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [project, currentUser] = await Promise.all([
    getProject(projectId),
    getCurrentUser(),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <SidebarProvider>
      <AppSidebar project={project} currentUser={currentUser ?? undefined} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
