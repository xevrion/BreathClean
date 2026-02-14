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
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-bc-primary flex h-8 w-8 items-center justify-center rounded-lg">
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
              <span className="text-xl font-extrabold tracking-tight dark:text-white">
                BreatheClean
              </span>
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
