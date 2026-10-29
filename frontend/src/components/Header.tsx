"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart-store";

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((state) => state.items);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link href="/" className="text-xl font-bold text-amber-900">
          ☕ BrewLite
        </Link>

        <Link
          href="/cart"
          className="relative flex items-center gap-2 rounded-full border border-stone-400 px-4 py-1.5 text-black hover:bg-stone-100 transition"
        >
          <span className="text-lg">🛒</span>
          <span className="text-sm font-bold text-black">Giỏ hàng</span>
          {mounted && totalQuantity > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow-sm">
              {totalQuantity}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}