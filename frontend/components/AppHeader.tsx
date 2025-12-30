"use client";

import Link from "next/link";
import { LogOut, Sparkles, Settings } from "lucide-react";
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
  email?: string;
  isDemo?: boolean;
  onSignOut: () => void;
}

export function AppHeader({ email, isDemo, onSignOut }: AppHeaderProps) {
  const initials = email ? email.slice(0, 2).toUpperCase() : "MO";

  return (
    <header className="h-14 border-b border-border/50 bg-card/50 backdrop-blur-md flex items-center justify-between px-4">
      {/* Left - Logo */}
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Moji</span>
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
              <p className="text-sm font-medium">{email || "Guest User"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isDemo ? "Preview mode" : "Personal account"}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="w-4 h-4 mr-2 text-muted-foreground" />
              Settings
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
