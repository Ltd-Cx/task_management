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
import type { Repository, User, TaskProject } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AddRepositoryDialog } from "@/components/repositories/add-repository-dialog";

/** リポジトリ情報（プロジェクトと課題数付き） */
interface RepositoryWithStats {
  id: string;
  name: string;
  key: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  taskProjects: TaskProject[];
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
  { title: "リポジトリ設定", href: "/settings", icon: "Settings" },
] as const;

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  repository: Repository;
  currentUser?: User;
  allRepositories?: RepositoryWithStats[];
}

/** リポジトリ用サイドバー */
export function AppSidebar({ repository, currentUser, allRepositories = [], ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const basePath = `/repositories/${repository.id}`;
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
        {/* リポジトリ選択 */}
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
                        {repository.key.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {repository.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {repository.key}
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
                    リポジトリ一覧
                  </DropdownMenuLabel>
                  {allRepositories.map((r) => (
                    <DropdownMenuItem key={r.id} asChild>
                      <Link
                        href={`/repositories/${r.id}`}
                        onClick={handleLinkClick}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="size-6">
                          <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                            {r.key.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm">{r.name}</span>
                            {r.id === repository.id && (
                              <Check className="size-4 shrink-0" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {r.taskProjects.length > 0
                              ? r.taskProjects.map((p) => p.name).join(", ")
                              : "プロジェクトなし"}{" "}
                            · {r.taskCount}件
                          </div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <div className="p-1">
                    <AddRepositoryDialog
                      repositories={allRepositories}
                      currentUserId={currentUser?.id ?? ""}
                    />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton size="lg">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {repository.key.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {repository.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {repository.key}
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
