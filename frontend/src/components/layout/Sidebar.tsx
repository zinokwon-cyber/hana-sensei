"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Grid3X3, User, LogOut, Zap, LayoutDashboard, BarChart2, Users, Images, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/generate", label: "이모티콘 생성", icon: Sparkles },
  { href: "/my-emojis", label: "내 이모티콘", icon: Grid3X3 },
  { href: "/profile", label: "내 정보", icon: User },
];

const adminNavItems = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/reports", label: "통계 리포트", icon: BarChart2 },
  { href: "/admin/users", label: "사용자 관리", icon: Users },
  { href: "/admin/emojis", label: "이모티콘 관리", icon: Images },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-sm">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold text-brand-purple uppercase tracking-widest">3TOP</p>
          <p className="text-sm font-bold text-gray-900 leading-tight">Emoji Studio</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-brand-gradient text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" size={18} />
              {item.label}
            </Link>
          );
        })}

        {user?.is_admin && (
          <>
            <Separator className="my-3" />
            <div className="flex items-center gap-1.5 px-3 py-1">
              <ShieldCheck size={13} className="text-brand-purple" />
              <p className="text-xs font-semibold text-brand-purple uppercase tracking-widest">Admin</p>
            </div>
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-brand-gradient text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" size={18} />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-3 rounded-lg p-3 bg-gray-50">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="로그아웃"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
