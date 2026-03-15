"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ListChecks,
  Columns3,
  Calendar,
  Users,
  Settings,
  Search,
  FolderKanban,
  Plus,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { Project, User, TaskGroup } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AddProjectDialog } from "@/components/projects/add-project-dialog";

/** プロジェクト情報（グループと課題数付き） */
interface ProjectWithStats {
  id: string;
  name: string;
  key: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  taskGroups: TaskGroup[];
  taskCount: number;
}
/** アイコンマッピング */
const iconMap = {
  LayoutDashboard,
  ListChecks,
  Columns3,
  Calendar,
  Users,
  Settings,
} as const;

/** ナビゲーション項目 */
const NAV_ITEMS = [
  { title: "ダッシュボード", href: "", icon: "LayoutDashboard" },
  { title: "課題", href: "/tasks", icon: "ListChecks" },
  { title: "ボード", href: "/board", icon: "Columns3" },
  { title: "ガントチャート", href: "/gantt", icon: "Calendar" },
  { title: "メンバー", href: "/members", icon: "Users" },
  { title: "プロジェクト設定", href: "/settings", icon: "Settings" },
] as const;

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  project: Project;
  currentUser?: User;
  allProjects?: ProjectWithStats[];
}

/** プロジェクト用サイドバー */
export function AppSidebar({ project, currentUser, allProjects = [], ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const basePath = `/projects/${project.id}`;
  const [mounted, setMounted] = useState(false);

  const displayName = currentUser?.displayName ?? "ゲスト";
  const email = currentUser?.email ?? "";
  const avatarUrl = currentUser?.avatarUrl ?? undefined;

  // クライアントサイドでマウント後にのみDropdownMenuを表示（ハイドレーションエラー回避）
  useEffect(() => {
    setMounted(true);
  }, []);

  /** モバイルでサイドバーを閉じる */
  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        {/* プロジェクト選択 */}
        <SidebarMenu>
          <SidebarMenuItem>
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {project.key.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {project.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {project.key}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  align="start"
                  side="bottom"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    プロジェクト一覧
                  </DropdownMenuLabel>
                  {allProjects.map((p) => (
                    <DropdownMenuItem key={p.id} asChild>
                      <Link
                        href={`/projects/${p.id}`}
                        onClick={handleLinkClick}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="size-6">
                          <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                            {p.key.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm">{p.name}</span>
                            {p.id === project.id && (
                              <Check className="size-4 shrink-0" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {p.taskGroups.length > 0
                              ? p.taskGroups.map((g) => g.name).join(", ")
                              : "グループなし"}{" "}
                            · {p.taskCount}件
                          </div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <div className="p-1">
                    <AddProjectDialog
                      projects={allProjects}
                      currentUserId={currentUser?.id ?? ""}
                    />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton size="lg">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {project.key.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {project.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {project.key}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const Icon = iconMap[item.icon];
                const href = `${basePath}${item.href}`;
                const isActive =
                  item.href === ""
                    ? pathname === basePath
                    : pathname.startsWith(href);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={href} onClick={handleLinkClick}>
                        <Icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <Avatar className="size-8">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {displayName.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {email}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter> */}
    </Sidebar>
  );
}
