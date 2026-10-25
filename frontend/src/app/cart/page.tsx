"use client";

import Link from "next/link";
import { cartSubtotal, lineTotalOf, useCart, useHydrated } from "@/lib/cart";
import { formatVND, TOPPINGS } from "@/lib/pricing";

export default function CartPage() {
  const hydrated = useHydrated();
  const { items, setQty, remove } = useCart();

  if (!hydrated) return <p className="p-4">Đang tải giỏ hàng...</p>;

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <h1 className="mb-4 text-2xl font-bold">Giỏ hàng</h1>
        <p>Giỏ hàng đang trống.</p>
        <Link href="/" className="mt-3 inline-block underline">
          Chọn đồ uống từ menu
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Giỏ hàng</h1>

      <ul className="divide-y rounded border">
        {items.map((i) => {
          const toppingText =
            i.toppings.length > 0
              ? i.toppings.map((id) => TOPPINGS.find((t) => t.id === id)?.name ?? id).join(", ")
              : "Không topping";

          return (
            <li key={i.key} className="flex items-center gap-4 p-3">
              {/* Ảnh */}
              <div
                className="shrink-0 overflow-hidden rounded bg-amber-100"
                style={{ width: 64, height: 64 }}
              >
                {i.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={i.imageUrl}
                    alt={i.name}
                    style={{ width: 64, height: 64, objectFit: "cover" }}
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xl">☕</span>
                )}
              </div>

              {/* Tên, size, topping */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{i.name}</p>
                <p className="text-sm text-gray-500">Size {i.size}</p>
                <p className="truncate text-sm text-gray-500">{toppingText}</p>
              </div>

              {/* Số lượng (tối thiểu 1) + Xoá */}
              <div className="flex shrink-0 flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <button
                    aria-label="Giảm số lượng"
                    disabled={i.qty <= 1}
                    onClick={() => setQty(i.key, Math.max(1, i.qty - 1))}
                    className="h-7 w-7 rounded border leading-none disabled:opacity-30"
                  >
                    -
                  </button>
                  <span className="w-6 text-center">{i.qty}</span>
                  <button
                    aria-label="Tăng số lượng"
                    onClick={() => setQty(i.key, i.qty + 1)}
                    className="h-7 w-7 rounded border leading-none"
                  >
                    +
                  </button>
                </div>
                <button onClick={() => remove(i.key)} className="text-xs text-red-600 underline">
                  Xoá
                </button>
              </div>

              {/* Thành tiền */}
              <p className="w-28 shrink-0 text-right font-medium">{formatVND(lineTotalOf(i))}</p>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-center justify-between text-lg">
        <span>Tạm tính</span>
        <span className="font-bold">{formatVND(cartSubtotal(items))}</span>
      </div>

      <Link
        href="/checkout"
        className="mt-4 block rounded bg-amber-600 py-3 text-center text-white"
      >
        Tiến hành thanh toán
      </Link>
      <Link href="/" className="mt-3 block text-center text-sm underline">
        Thêm đồ uống khác
      </Link>
    </main>
  );
}