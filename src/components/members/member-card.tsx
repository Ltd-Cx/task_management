import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { USER_ROLE_CONFIG } from "@/lib/constants";
import type { ProjectMemberWithUser } from "@/types";

interface MemberCardProps {
  member: ProjectMemberWithUser;
}

/** メンバーカード */
export function MemberCard({ member }: MemberCardProps) {
  const roleConfig = USER_ROLE_CONFIG[member.role];

  return (
    <Card className="shadow-sm">
      <CardContent className="flex flex-col items-center gap-3 py-8">
        <UserAvatar user={member.user} size="lg" />
        <span className="text-base font-semibold">{member.user.displayName}</span>
        <span className="text-sm text-muted-foreground">
          {member.user.email}
        </span>
        <Badge variant={roleConfig.variant}>
          {roleConfig.label}
        </Badge>
      </CardContent>
    </Card>
  );
}
