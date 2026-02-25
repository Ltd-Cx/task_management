"use client";

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
} from "@/components/ui/sidebar";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Input } from "@/components/ui/input";
import type { Project } from "@/types";

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
}

/** プロジェクト用サイドバー */
export function AppSidebar({ project, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const basePath = `/projects/${project.id}`;

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        {/* ロゴ */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={basePath}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <FolderKanban className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Backlog Clone</span>
                  <span className="truncate text-xs text-muted-foreground">
                    プロジェクト管理
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* プロジェクト名 */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" className="font-medium">
              <FolderKanban className="size-4" />
              {project.name}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* 検索 */}
        <div className="px-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="検索..."
              className="h-9 pl-8 text-sm"
              readOnly
            />
          </div>
        </div>
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
                      <Link href={href}>
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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <UserAvatar
                user={{ displayName: "管理ユーザー" }}
                size="sm"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">管理ユーザー</span>
                <span className="truncate text-xs text-muted-foreground">
                  admin@example.com
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
