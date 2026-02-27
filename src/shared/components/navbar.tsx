"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BotMessageSquareIcon } from "lucide-react";

const navLinks = [
  { href: "/knowledge-base", label: "Knowledge Base" },
  { href: "/chat", label: "Chat" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-primary">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <BotMessageSquareIcon className="size-5" />
          <span>Janasku</span>
        </Link>
        <div className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-b-2 border-primary bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
