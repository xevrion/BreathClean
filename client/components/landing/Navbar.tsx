"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (pathname === "/") {
      e.preventDefault();
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        setOpen(false);
      }
    } else {
      setOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between pr-5">
        <Link href="/" className="mt-2 flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="BreathClean logo"
            width={180}
            height={180}
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            className="hover:text-bc-primary text-sm font-semibold transition-colors"
            href="/#how-it-works"
            onClick={(e) => handleClick(e, "how-it-works")}
          >
            How it Works
          </Link>
          <Link
            className="hover:text-bc-primary text-sm font-semibold transition-colors"
            href="/#mission"
            onClick={(e) => handleClick(e, "mission")}
          >
            Mission
          </Link>
          <Link
            className="hover:text-bc-primary text-sm font-semibold transition-colors"
            href="/#team"
            onClick={(e) => handleClick(e, "team")}
          >
            Team
          </Link>
          <Link
            className="rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 px-6 py-2.5 font-bold text-white shadow-[0_4px_0_0_#166534,0_6px_12px_rgba(0,0,0,0.15)] transition-all duration-150 hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#166534,0_4px_8px_rgba(0,0,0,0.15)] active:translate-y-[3px] active:shadow-[0_1px_0_0_#166534,0_2px_4px_rgba(0,0,0,0.15)]"
            href="/login"
          >
            Login
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="rounded-lg p-2 transition-colors hover:bg-slate-100 md:hidden dark:hover:bg-slate-800"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="dark:bg-bc-bg-dark/95 border-t border-slate-200 bg-white/95 shadow-xl backdrop-blur-md md:hidden dark:border-slate-800">
          <div className="flex flex-col space-y-4 px-6 py-4">
            <Link
              className="hover:text-bc-primary py-2 text-sm font-semibold transition-colors"
              href="/#how-it-works"
              onClick={(e) => handleClick(e, "how-it-works")}
            >
              How it Works
            </Link>
            <Link
              className="hover:text-bc-primary py-2 text-sm font-semibold transition-colors"
              href="/#mission"
              onClick={(e) => handleClick(e, "mission")}
            >
              Mission
            </Link>
            <Link
              className="hover:text-bc-primary py-2 text-sm font-semibold transition-colors"
              href="/#team"
              onClick={(e) => handleClick(e, "team")}
            >
              Team
            </Link>
            <Link
              className="rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 px-6 py-3 text-center font-bold text-white shadow-[0_4px_0_0_#166534,0_6px_12px_rgba(0,0,0,0.15)] transition-all duration-150 hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#166534,0_4px_8px_rgba(0,0,0,0.15)] active:translate-y-[3px] active:shadow-[0_1px_0_0_#166534,0_2px_4px_rgba(0,0,0,0.15)]"
              href="/login"
              onClick={() => setOpen(false)}
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
