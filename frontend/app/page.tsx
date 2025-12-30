"use client";

import { useAuth } from "@/app/providers";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkspaceList } from "@/components/WorkspaceList";
import { LogOut, Settings, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function Dashboard() {
  const { user, loading, signOut, isDemo } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const username = user.user_metadata?.username || user.email?.split('@')[0] || "guest";
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Image src="/logo.svg" alt="Moji" width={16} height={16} className="w-4 h-4" />
            </div>
            <span className="text-lg font-semibold">Moji</span>
          </div>

          <div className="flex items-center gap-3">
            {isDemo && (
              <Badge variant="secondary" className="text-xs">
                Demo
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-secondary text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium truncate">@{username}</p>
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
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Demo Banner */}
      {isDemo && (
        <div className="bg-primary/10 border-b border-primary/20 px-6 py-2 text-center text-sm text-primary">
          Demo Mode — Data is not saved
        </div>
      )}

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <WorkspaceList isDemo={isDemo} />
      </main>
    </div>
  );
}

export default function Home() {
  return <Dashboard />;
}
