"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Bookmark, Home, LogOut, User } from "lucide-react";

import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/saved-routes", label: "Saved Routes", icon: Bookmark },
];

interface UserData {
  name: string;
  picture: string;
}

export default function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/user`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.user && setUser(data.user))
      .catch(() => null);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    router.push(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/google/logout`
    );
  }

  return (
    <nav className="border-slate-2000 fixed top-0 z-50 w-full border-b bg-white/85">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between pr-6">
        <Link href="/" className="mt-2 flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="BreathClean logo"
            width={180}
            height={150}
          />
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#2bee6c]/10 text-[#2bee6c]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}

          {/* User avatar with dropdown */}
          <div className="relative ml-1" ref={dropdownRef}>
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-2 ring-transparent transition-all hover:ring-[#2bee6c] focus:outline-none"
              aria-label="User menu"
            >
              {user?.picture ? (
                <Image
                  src={user.picture}
                  alt={user.name ?? "User"}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-slate-200 dark:bg-slate-700">
                  <User className="h-4 w-4 text-slate-500" />
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-[#1a2e22]">
                {user?.name && (
                  <p className="truncate border-b border-slate-100 px-4 py-2 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    {user.name}
                  </p>
                )}
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
