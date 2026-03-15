"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EditMemberDialog } from "@/components/members/edit-member-dialog";
import { USER_ROLE_CONFIG } from "@/lib/constants";
import type { ProjectMemberWithUser } from "@/types";

interface MemberTableProps {
  members: ProjectMemberWithUser[];
  projectId: string;
}

/** メンバーテーブル */
export function MemberTable({ members, projectId }: MemberTableProps) {
  const [selectedMember, setSelectedMember] = useState<ProjectMemberWithUser | null>(null);

  console.log(members)

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">名前</TableHead>
              <TableHead>メールアドレス</TableHead>
              <TableHead className="w-[120px]">ロール</TableHead>
              <TableHead className="w-[120px]">登録日</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const roleConfig = USER_ROLE_CONFIG[member.role];
              return (
                <TableRow
                  key={member.userId}
                  className="cursor-pointer"
                  onClick={() => setSelectedMember(member)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar user={member.user} size="md" />
                      <span>{member.user.displayName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleConfig.variant}>{roleConfig.label}</Badge>
                  </TableCell>
                  <TableCell>
                    {member.user.createdAt.toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedMember && (
        <EditMemberDialog
          member={selectedMember}
          projectId={projectId}
          open={!!selectedMember}
          onOpenChange={(open) => {
            if (!open) setSelectedMember(null);
          }}
        />
      )}
    </>
  );
}
