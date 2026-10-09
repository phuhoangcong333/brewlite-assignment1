
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { calcUnitPrice, formatVND } from "@/lib/pricing";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="p-8 text-center text-stone-400">
        Đang tải giỏ hàng...
      </main>
    );
  }

  // Tính tổng tiền theo giá gốc + size + topping
  const totalPrice = items.reduce(
    (sum, item) =>
      sum +
      calcUnitPrice(item.price, item.size, item.toppings) * item.quantity,
    0,
  );

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <h1 className="mb-4 text-xl font-bold text-white">Giỏ hàng</h1>
        <div className="rounded-xl border border-stone-700 bg-white p-8 shadow-xs">
          <p className="text-stone-600">Giỏ hàng của bạn đang trống</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-amber-800 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-900"
          >
            Xem Menu gọi món
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-4 pb-20">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Giỏ hàng</h1>

        <button
          onClick={clearCart}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
        >
          Xóa tất cả
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const unitPrice = calcUnitPrice(
            item.price,
            item.size,
            item.toppings,
          );

          return (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-3 shadow-xs"
            >
              <div className="flex-1 pr-2">
                <p className="font-semibold text-stone-900">{item.name}</p>

                <p className="text-xs text-stone-500">
                  Size {item.size}
                  {item.toppings.length > 0 &&
                    ` | ${item.toppings.join(", ")}`}
                </p>

                <p className="mt-1 text-sm font-bold text-amber-800">
                  {formatVND(unitPrice * item.quantity)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, -1)}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-300 bg-stone-100 text-base font-bold text-black hover:bg-stone-200"
                >
                  -
                </button>

                <span className="w-6 text-center text-sm font-bold text-black">
                  {item.quantity}
                </span>

                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-300 bg-stone-100 text-base font-bold text-black hover:bg-stone-200"
                >
                  +
                </button>

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="ml-2 text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  Xóa
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3 text-base">
          <span className="font-bold text-black">Tổng tiền:</span>
          <span className="text-lg font-bold text-black">
            {formatVND(totalPrice)}
          </span>
        </div>

        <Link
          href="/checkout"
          className="mt-4 block w-full rounded-lg bg-emerald-700 py-3 text-center font-bold text-white transition hover:bg-emerald-800"
        >
          Thanh toán
        </Link>
      </div>
    </main>
  );
}