"use client";

import Link from "next/link";
import { cartCount, useCart, useHydrated } from "@/lib/cart";

export default function Header() {
  const hydrated = useHydrated();
  const count = useCart((s) => cartCount(s.items));

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link href="/" className="font-bold text-amber-700">
          BrewLite
        </Link>

        <Link
        href="/cart"
        aria-label="Giỏ hàng"
        className="relative flex items-center justify-center gap-2 rounded bg-amber-600 px-4 py-2 text-white whitespace-nowrap shrink-0 min-w-[200px]"
        >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
        >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
        </svg>
        <span>Giỏ hàng</span>
        {hydrated && count > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs text-white">
            {count}
            </span>
        )}
        </Link>
      </div>
    </header>
  );
}