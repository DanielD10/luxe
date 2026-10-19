"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSaved } from "@/lib/client/store";
import { HeartIcon, MenuIcon } from "./Icons";

const NAV = [
  { href: "/destinations", label: "Destinations" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/plan", label: "Plan a trip" },
];

export default function Header() {
  const path = usePathname();
  const saved = useSaved();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="logo" aria-label="LUXE, home">
          LUXE
        </Link>
        <nav className={`nav${open ? " open" : ""}`} aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={path.startsWith(n.href) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="header-right">
          <Link href="/saved" className="saved-link" aria-label={`Saved places, ${saved.length}`}>
            <HeartIcon />
            <span className="sr-only">Saved</span>
            {saved.length ? <span className="count">{saved.length}</span> : null}
          </Link>
          <Link href="/plan" className="btn solid sm">
            Plan a trip
          </Link>
          <button className="menu-btn" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <MenuIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
