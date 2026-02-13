"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Don't show navbar on login/register pages
  if (pathname === "/login" || pathname === "/register") return null;
  if (status === "loading") return null;
  if (!session) return null;

  const links = [
    { href: "/", label: "Stock", icon: "📦" },
    { href: "/sell", label: "Sell", icon: "💰" },
    { href: "/reports", label: "Reports", icon: "📊" },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
              🥚
            </span>
            <span className="text-lg font-bold bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
              Egg Shop
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-amber-500/15 text-amber-400 shadow-inner shadow-amber-500/10"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="text-base">{link.icon}</span>
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 hidden sm:block">
              {session.user?.name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
