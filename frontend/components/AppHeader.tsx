"use client";

import Link from "next/link";
import Image from "next/image";
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

interface AppHeaderProps {
  username?: string;
  email?: string;
  isDemo?: boolean;
  onSignOut: () => void;
}

export function AppHeader({ username, email, isDemo, onSignOut }: AppHeaderProps) {
  // Fallback: username -> email prefix -> "guest"
  const displayName = username || email?.split('@')[0] || "guest";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="h-14 border-b border-border/50 bg-card/50 backdrop-blur-md flex items-center justify-between px-3 md:px-4">
      {/* Left - Logo */}
      <Link href="/" className="flex items-center gap-2 md:gap-2.5 group">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow ring-1 ring-primary/20">
          <Image src="/logo.svg" alt="Moji" width={20} height={20} className="w-5 h-5" />
        </div>
        <span className="text-sm font-semibold tracking-tight hidden sm:inline">Moji</span>
      </Link>

      {/* Center - Demo Badge */}
      {isDemo && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-primary">Demo Mode</span>
        </div>
      )}

      {/* Right - User Menu */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-accent"
            >
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium">
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
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href="/profile">
                <User className="w-4 h-4 mr-2 text-muted-foreground" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href="/settings">
                <Settings className="w-4 h-4 mr-2 text-muted-foreground" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onSignOut}
              className="cursor-pointer text-destructive focus:text-destructive"
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
