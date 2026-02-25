import { notFound } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getProject } from "@/db/queries/projects";


/** プロジェクト共通レイアウト（サイドバー + メインコンテンツ） */
export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);

  if (!project) {
    notFound();
  }

  return (
    <SidebarProvider>
      <AppSidebar project={project} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
