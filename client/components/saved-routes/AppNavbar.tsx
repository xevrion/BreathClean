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
    <nav className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-[#102216]/80">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-6">
        <Link href="/home" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2bee6c] shadow-md">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16.9688 8.39062V8.39062V8.39062M6.51562 9.98438V9.98438V9.98438M13.4531 7.59375C12.1406 8.3125 10.9844 9.20312 9.98438 10.2656C8.98438 9.20312 7.82812 8.3125 6.51562 7.59375C6.60938 6.375 7 5.02344 7.6875 3.53906C8.375 2.05469 9.15625 0.875 10.0312 0C12.125 2.09375 13.2656 4.625 13.4531 7.59375V7.59375M0 7.96875C2.125 7.96875 4.0625 8.48438 5.8125 9.51562C7.5625 10.5469 8.95312 11.8594 9.98438 13.4531C11.0156 11.8594 12.4062 10.5469 14.1562 9.51562C15.9062 8.48438 17.8438 7.96875 19.9688 7.96875C19.9688 10.5938 19.2266 12.9531 17.7422 15.0469C16.2578 17.1406 14.3281 18.6094 11.9531 19.4531C11.4219 19.6406 10.7656 19.8125 9.98438 19.9688C9.32812 19.875 8.67188 19.7031 8.01562 19.4531C5.64062 18.6094 3.71094 17.1406 2.22656 15.0469C0.742188 12.9531 0 10.5938 0 7.96875V7.96875"
                fill="white"
              />
            </svg>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            BreatheClean
          </span>
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
