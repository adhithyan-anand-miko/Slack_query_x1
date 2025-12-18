
import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  LogOut, 
  Settings, 
  Users, 
  Menu,
  ShieldCheck
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Email<span className="text-primary">Checker</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard">
              <a className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location === "/dashboard" ? "text-primary" : "text-slate-600 dark:text-slate-400"
              )}>
                Dashboard
              </a>
            </Link>
            <Link href="/settings">
              <a className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location === "/settings" ? "text-primary" : "text-slate-600 dark:text-slate-400"
              )}>
                Settings
              </a>
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-900 dark:text-white">Admin User</span>
              <span className="text-xs text-slate-500">admin@company.com</span>
            </div>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <LogOut className="h-5 w-5 text-slate-500 hover:text-red-500 transition-colors" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 md:px-6">
        {children}
      </main>
    </div>
  );
}
