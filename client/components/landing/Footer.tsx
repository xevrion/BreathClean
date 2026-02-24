import Image from "next/image";
import Link from "next/link";

import { AtSign, Globe } from "lucide-react";

const footerLinks = {
  "Web App": [
    { label: "Route Planner", href: "#" },
    { label: "AQI Map", href: "#" },
    { label: "Live Updates", href: "#" },
  ],
  Resources: [
    { label: "How it Works", href: "#" },
    { label: "Health Research", href: "#" },
    { label: "Community", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Support", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 grid gap-12 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="BreathClean logo"
                width={180}
                height={54}
                className="-ml-2"
              />
            </Link>
            <p className="text-sm leading-relaxed text-slate-500">
              Leading the transition to health-first urban mobility. Accessible
              everywhere, every breath matters.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h5 className="mb-4 font-bold dark:text-white">{category}</h5>
              <ul className="space-y-2 text-sm text-slate-500">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      className="hover:text-bc-primary transition-colors"
                      href={link.href}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-sm text-slate-400 md:flex-row dark:border-slate-800">
          <p>&copy; 2026 BreatheClean. All rights reserved.</p>
          <div className="flex gap-6">
            <a className="hover:text-bc-primary" href="#">
              <Globe className="h-5 w-5" />
            </a>
            <a className="hover:text-bc-primary" href="#">
              <AtSign className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
