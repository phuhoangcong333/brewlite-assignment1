"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useCartStore } from "@/lib/cart-store";
import { calcUnitPrice, formatVND } from "@/lib/pricing";

type CreatedOrder = {
  id: number;
  status: string;
  total: number;
};

function toBackendTopping(topping: string): string {
  if (topping === "pearl") return "Trân châu";
  if (topping === "cream") return "Kem";
  return topping;
}

export default function CheckoutPage() {
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdOrder, setCreatedOrder] =
    useState<CreatedOrder | null>(null);

  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    setMounted(true);
  }, []);

  const estimatedTotal = items.reduce(
    (sum, item) =>
      sum +
      calcUnitPrice(item.price, item.size, item.toppings) *
        item.quantity,
    0,
  );

  async function handleCheckout() {
    setError("");

    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (items.length === 0) {
      setError("Giỏ hàng đang trống.");
      return;
    }

    setSubmitting(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

      const response = await fetch(`${apiUrl}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: Number(item.productId),
            qty: item.quantity,
            size: item.size,
            toppings: item.toppings.map(toBackendTopping),
          })),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message;

        throw new Error(
          message || `Không tạo được đơn hàng (HTTP ${response.status})`,
        );
      }

      if (
        !Number.isInteger(data.id) ||
        typeof data.total !== "number" ||
        typeof data.status !== "string"
      ) {
        throw new Error("Phản hồi tạo đơn hàng không hợp lệ.");
      }

      setCreatedOrder({
        id: data.id,
        status: data.status,
        total: data.total,
      });

      // Chỉ xóa giỏ sau khi Backend xác nhận đã tạo đơn thành công.
      clearCart();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể kết nối đến máy chủ.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) {
    return <main className="p-6">Đang tải thông tin thanh toán...</main>;
  }

  if (createdOrder) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
          <div className="mb-4 text-4xl">✅</div>

          <h1 className="text-2xl font-bold text-green-800">
            Đặt hàng thành công!
          </h1>

          <div className="mt-5 space-y-3 rounded-lg bg-stone-50 p-4">
            <p>
              <span className="text-stone-500">Mã đơn hàng:</span>{" "}
              <strong>#{createdOrder.id}</strong>
            </p>
            <p>
              <span className="text-stone-500">Trạng thái:</span>{" "}
              <strong>{createdOrder.status}</strong>
            </p>
            <p>
              <span className="text-stone-500">Tổng tiền:</span>{" "}
              <strong className="text-amber-800">
                {formatVND(createdOrder.total)}
              </strong>
            </p>
          </div>

          <p className="mt-4 text-sm text-stone-600">
            Đơn hàng đã được gửi đến hệ thống. Đây là xác nhận tạo đơn,
            chưa phải xác nhận thanh toán thành công.
          </p>

          <Link
            href="/"
            className="mt-6 block rounded-lg bg-amber-800 px-4 py-3 text-center font-semibold text-white hover:bg-amber-900"
          >
            Quay lại Menu
          </Link>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-xl p-6 text-center">
        <h1 className="text-2xl font-bold">Xác nhận đơn hàng</h1>
        <p className="mt-4 text-stone-600">Giỏ hàng của ông đang trống.</p>

        <Link
          href="/"
          className="mt-5 inline-block rounded-lg bg-amber-800 px-5 py-3 font-semibold text-white"
        >
          Quay lại Menu
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl p-4">
      <Link href="/cart" className="text-sm underline">
        ← Quay lại giỏ hàng
      </Link>

      <h1 className="mt-3 text-2xl font-bold">
        Xác nhận đơn hàng
      </h1>

      <div className="mt-5 space-y-3">
        {items.map((item) => {
          const unitPrice = calcUnitPrice(
            item.price,
            item.size,
            item.toppings,
          );

          return (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 rounded-xl border bg-white p-4"
            >
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="mt-1 text-sm text-stone-500">
                  Size {item.size} · Số lượng {item.quantity}
                </p>

                {item.toppings.length > 0 && (
                  <p className="text-sm text-stone-500">
                    Topping: {item.toppings.join(", ")}
                  </p>
                )}
              </div>

              <p className="whitespace-nowrap font-semibold text-amber-800">
                {formatVND(unitPrice * item.quantity)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Tổng tiền dự kiến</span>
          <strong className="text-xl text-amber-800">
            {formatVND(estimatedTotal)}
          </strong>
        </div>

        <p className="mt-2 text-xs text-stone-500">
          Tổng tiền cuối cùng do Backend tính dựa trên giá hiện tại trong
          cơ sở dữ liệu.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleCheckout}
        disabled={submitting || items.length === 0}
        className="mt-5 w-full rounded-lg bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Đang tạo đơn hàng..." : "Xác nhận đặt hàng"}
      </button>
    </main>
  );
}