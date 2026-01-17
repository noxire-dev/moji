"use client";

import { useAuth } from "@/app/providers";
import { AppHeader } from "@/components/AppHeader";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Info, MessageSquare, Palette } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function SettingsContent() {
  const { user, loading, signOut, isDemo } = useAuth();
  const router = useRouter();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-background">
        <AppHeader isDemo={isDemo} onSignOut={signOut} />
        <main className="max-w-2xl mx-auto px-6 py-8">
          <div className="mb-6">
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="mb-8 space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleFeedbackSubmit = () => {
    if (!feedbackMessage.trim()) {
      toast.error("Please enter your feedback");
      return;
    }

    if (isDemo) {
      toast.info("Feedback is disabled in demo mode. Please sign in to send feedback.");
      return;
    }

    const subject = encodeURIComponent("Moji Feedback");
    const userInfo = `User: ${user.email}\n\nFeedback:\n`;
    const fullBody = userInfo + feedbackMessage;
    
    // Mailto URLs have ~2000 char limit, truncate if needed
    const maxBodyLength = 1800; // Leave room for encoding overhead
    const truncatedBody = fullBody.length > maxBodyLength 
      ? fullBody.substring(0, maxBodyLength) + "\n\n[Message truncated due to length]"
      : fullBody;
    
    const body = encodeURIComponent(truncatedBody);
    const mailtoLink = `mailto:feedback@usemoji.app?subject=${subject}&body=${body}`;
    
    try {
      window.location.href = mailtoLink;
      toast.success("Opening your email client...");
      setFeedbackMessage("");
      setFeedbackOpen(false);
    } catch (error) {
      toast.error("Failed to open email client. Please email feedback@usemoji.app directly.");
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background">
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

          {/* Feedback Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Feedback</CardTitle>
                  <CardDescription>Share your thoughts, report bugs, or suggest features</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Dialog 
                open={feedbackOpen} 
                onOpenChange={(open) => {
                  setFeedbackOpen(open);
                  if (!open) {
                    // Reset form when dialog closes (via X or outside click)
                    setFeedbackMessage("");
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full" disabled={isDemo}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Feedback
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Feedback</DialogTitle>
                    <DialogDescription>
                      {isDemo 
                        ? "Please sign in to send feedback."
                        : "We'd love to hear from you! Your feedback helps us improve Moji."}
                    </DialogDescription>
                  </DialogHeader>
                  {!isDemo && (
                    <>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="feedback">Your message</Label>
                          <Textarea
                            id="feedback"
                            placeholder="Tell us what you think, report a bug, or suggest a feature..."
                            value={feedbackMessage}
                            onChange={(e) => setFeedbackMessage(e.target.value)}
                            rows={6}
                            className="resize-none"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setFeedbackOpen(false);
                            setFeedbackMessage("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleFeedbackSubmit}>
                          Send Feedback
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>
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
                  <span className="font-medium">0.1.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Build</span>
                  <span className="font-medium font-mono text-xs">2026.01.15</span>
                </div>
                <Separator className="my-3" />
                <p className="text-muted-foreground leading-relaxed">
                  Moji is a minimal, workspace-centric system for focused work.
                  Keep tasks actionable, notes short, and pages evolving.
                </p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>usemoji.app</p>
                  <p>Built by Mirako — mirako.computer</p>
                </div>
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
