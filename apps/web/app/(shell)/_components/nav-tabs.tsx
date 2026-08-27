"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HEADER_NAV } from "../../lib/nav";

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 text-[13px]">
      {HEADER_NAV.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 ${
              active ? "bg-primary-50 font-medium text-primary" : "text-neutral-700"
            }`}
          >
            <Icon size={16} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
