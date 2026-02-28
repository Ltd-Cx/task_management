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
import { USER_ROLE_CONFIG } from "@/lib/constants";
import type { ProjectMemberWithUser } from "@/types";

interface MemberTableProps {
  members: ProjectMemberWithUser[];
}

/** メンバーテーブル */
export function MemberTable({ members }: MemberTableProps) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">名前</TableHead>
            <TableHead>メールアドレス</TableHead>
            <TableHead className="w-[120px]">ロール</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const roleConfig = USER_ROLE_CONFIG[member.role];
            return (
              <TableRow key={member.userId}>
                <TableCell>
                  {member.user.displayName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {member.user.email}
                </TableCell>
                <TableCell>
                  <Badge variant={roleConfig.variant}>{roleConfig.label}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
