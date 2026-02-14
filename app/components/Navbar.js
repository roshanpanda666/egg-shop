"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (pathname === "/login" || pathname === "/register") return null;
  if (status === "loading") return null;
  if (!session) return null;

  const links = [
    { href: "/", label: "Stock", icon: "📦" },
    { href: "/sell", label: "Sell", icon: "💰" },
    { href: "/reports", label: "Reports", icon: "📊" },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🥚</span>
            <span className="text-lg font-bold bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
              Egg Shop
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "bg-amber-500/15 text-amber-400"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.icon} {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop User */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-slate-400">
              {session.user?.name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition"
            >
              Logout
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white text-xl"
          >
            {isOpen ? "✖" : "☰"}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-amber-500/15 text-amber-400"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.icon} {link.label}
                </Link>
              );
            })}

            <div className="border-t border-white/10 pt-3 mt-3">
              <p className="text-sm text-slate-400 px-4 mb-2">
                {session.user?.name}
              </p>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
