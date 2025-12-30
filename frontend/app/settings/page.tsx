"use client";

import { useAuth } from "@/app/providers";
import { AppHeader } from "@/components/AppHeader";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Info, Palette } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function SettingsContent() {
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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader username={user.user_metadata?.username} email={user.email} isDemo={isDemo} onSignOut={signOut} />

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to workspaces
            </Button>
          </Link>
        </div>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize your Moji experience
          </p>
        </div>

        <div className="space-y-6">
          {/* Appearance Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Appearance</CardTitle>
                  <CardDescription>Customize the look and feel of Moji</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ThemeSwitcher />
            </CardContent>
          </Card>

          <Separator />

          {/* About Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">About</CardTitle>
                  <CardDescription>Information about Moji</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Build</span>
                  <span className="font-medium font-mono text-xs">2025.12.30</span>
                </div>
                <Separator className="my-3" />
                <p className="text-muted-foreground leading-relaxed">
                  Moji is a workspace-centric productivity app designed to help you stay focused
                  and build momentum. Less bloated, more focused.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return <SettingsContent />;
}
