"use client";

import { useCartStore } from "@/lib/cart-store";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getProduct } from "@/lib/api";
import { calcUnitPrice, formatVND, SIZE_EXTRA, TOPPINGS } from "@/lib/pricing";
import type { Product, Size } from "@/lib/types";

export default function ProductDetailPage() {
  const [addedMessage, setAddedMessage] = useState("");
  const addItem = useCartStore((state) => state.addItem);
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState<Size>("M");
  const [toppings, setToppings] = useState<string[]>([]);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    getProduct(Number(params.id))
      .then(setProduct)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  const toggleTopping = (id: string) =>
    setToppings((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  if (loading) return <p className="p-4">Đang tải...</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;
  if (!product) return <p className="p-4">Không tìm thấy sản phẩm.</p>;

  const unitPrice = calcUnitPrice(product.price, size, toppings);

  const handleAdd = () => {
    addItem(
      {
        productId: String(product.id),
        name: product.name,
        price: product.price,
        size,
        toppings,
        imageUrl: product.imageUrl ?? undefined,
      },
      qty,
    );

    setAddedMessage(
      `Đã thêm ${qty} x ${product.name} (${size}) - ${formatVND(unitPrice * qty)}`,
    );
  };

  return (
    <main className="mx-auto max-w-xl p-4">
      <Link href="/" className="text-sm underline">
        ← Quay lại menu
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{product.name}</h1>
      <p className="text-amber-700">Giá gốc: {formatVND(product.price)}</p>

      <section className="mt-4">
        <h2 className="mb-2 font-medium">Size</h2>
        <div className="flex gap-2">
          {(["S", "M", "L"] as Size[]).map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`rounded border px-4 py-2 ${
                size === s ? "bg-amber-600 text-white" : ""
              }`}
            >
              {s} {SIZE_EXTRA[s] > 0 && `(+${formatVND(SIZE_EXTRA[s])})`}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4">
        <h2 className="mb-2 font-medium">Topping</h2>
        <div className="flex flex-col gap-1">
          {TOPPINGS.map((t) => (
            <label key={t.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={toppings.includes(t.id)}
                onChange={() => toggleTopping(t.id)}
              />
              {t.name} (+{formatVND(t.price)})
            </label>
          ))}
        </div>
      </section>

      <section className="mt-4 flex items-center gap-3">
        <h2 className="font-medium">Số lượng</h2>
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="rounded border px-3"
        >
          -
        </button>
        <span>{qty}</span>
        <button
          onClick={() => setQty((q) => q + 1)}
          className="rounded border px-3"
        >
          +
        </button>
      </section>

      <button
        onClick={handleAdd}
        className="mt-6 w-full rounded bg-amber-600 py-3 text-white"
      >
        Thêm vào giỏ - {formatVND(unitPrice * qty)}
      </button>
            {addedMessage && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4"
        >
          <p className="font-semibold text-green-800">
            ✓ {addedMessage}
          </p>

          <div className="mt-3 flex items-center gap-4">
            <Link
              href="/cart"
              className="rounded-lg bg-amber-800 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-900"
            >
              Xem giỏ hàng
            </Link>

            <button
              type="button"
              onClick={() => setAddedMessage("")}
              className="text-sm text-stone-600 underline"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
