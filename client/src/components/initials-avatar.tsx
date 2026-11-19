import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getAvatarPalette } from "@/lib/initials";
import { cn } from "@/lib/utils";

interface InitialsAvatarProps {
  name: string;
  photoUrl?: string;
  className?: string;
  testId?: string;
}

export function InitialsAvatar({ name, photoUrl, className, testId }: InitialsAvatarProps) {
  return (
    <Avatar className={cn("border-2 border-white shadow-sm dark:border-card", className)} data-testid={testId}>
      {photoUrl ? <AvatarImage src={photoUrl} alt={name} /> : null}
      <AvatarFallback className={cn("font-serif font-extrabold", getAvatarPalette(name))}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
