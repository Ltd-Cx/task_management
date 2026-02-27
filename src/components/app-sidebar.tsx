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
import { Input } from "@/components/ui/input";
import type { Project, User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
}

/** プロジェクト用サイドバー */
export function AppSidebar({ project, currentUser, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const basePath = `/projects/${project.id}`;

  const displayName = currentUser?.displayName ?? "ゲスト";
  const email = currentUser?.email ?? "";
  const avatarUrl = currentUser?.avatarUrl ?? undefined;

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        {/* ロゴ */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={basePath}>
                <Avatar>
                  <AvatarImage src="/goff.jpg" alt={project.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {project.key.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    Simple Todo App
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    プロジェクト管理
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
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
      </SidebarFooter>
    </Sidebar>
  );
}
