"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigationLoading } from "@/app/providers";

interface AppHeaderProps {
  username?: string;
  email?: string;
  isDemo?: boolean;
  onSignOut: () => void;
}

export function AppHeader({ username, email, isDemo, onSignOut }: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { setLoading } = useNavigationLoading();
  // Fallback: username -> email prefix -> "guest"
  const displayName = username || email?.split('@')[0] || "guest";
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleLinkClick = (href: string) => {
    // Don't navigate if we're already on that page
    if (pathname === href) {
      return;
    }
    setLoading(true);
    router.push(href);
  };

  return (
    <header className="h-12 min-h-[3rem] border-b border-border/40 bg-card/40 backdrop-blur-md flex items-center justify-between px-3 md:px-4">
      {/* Left - Logo */}
      <Link href="/" className="flex items-center gap-2 md:gap-2.5 group flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm shadow-primary/20 group-hover:shadow-primary/30 transition-shadow ring-1 ring-primary/15 flex-shrink-0">
          <Image
            src="/logo.svg"
            alt="Moji"
            width={20}
            height={20}
            className="w-4 h-4 flex-shrink-0"
            priority
            unoptimized
            style={{ width: '18px', height: '18px', display: 'block' }}
          />
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground/90 hidden sm:inline flex-shrink-0">Moji</span>
      </Link>

      {/* Center - Demo Badge */}
      <div className="flex-1 flex items-center justify-center">
        {isDemo && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/15 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/90 animate-pulse flex-shrink-0" />
            <span className="text-xs font-medium text-primary/90 whitespace-nowrap">Demo Mode</span>
          </div>
        )}
      </div>

      {/* Right - User Menu */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 min-h-[2.25rem] min-w-[2.25rem] rounded-full hover:bg-accent/70 flex-shrink-0"
            >
              <Avatar className="h-8 w-8 min-h-[2rem] min-w-[2rem] border border-border/70 flex-shrink-0">
                <AvatarFallback className="text-xs bg-gradient-to-br from-primary/15 to-primary/5 text-primary/90 font-medium flex-shrink-0">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">@{displayName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isDemo ? "Preview mode" : "Personal account"}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer transition-colors"
              onClick={() => handleLinkClick("/profile")}
            >
              <User className="w-4 h-4 mr-2 text-muted-foreground" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer transition-colors"
              onClick={() => handleLinkClick("/settings")}
            >
              <Settings className="w-4 h-4 mr-2 text-muted-foreground" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onSignOut}
              className="cursor-pointer text-destructive focus:text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
