import { cn } from "@/lib/utils";
import type { User } from "@/types";

const sizeClasses = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-7 w-7 text-xs",
  lg: "h-14 w-14 text-base",
} as const;

interface UserAvatarProps {
  user: Pick<User, "displayName">;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** ユーザーアバター（表示名の頭文字） */
export function UserAvatar({
  user,
  size = "md",
  className,
}: UserAvatarProps) {
  const initial = user.displayName.charAt(0);

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-muted font-semibold text-foreground shrink-0",
        sizeClasses[size],
        className
      )}
    >
      {initial}
    </div>
  );
}
