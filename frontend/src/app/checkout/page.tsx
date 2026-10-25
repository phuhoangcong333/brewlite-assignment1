"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { cartSubtotal, lineTotalOf, useCart, useHydrated } from "@/lib/cart";
import { formatVND, TOPPINGS } from "@/lib/pricing";
import { ApiError, createOrder, createPayment, type PaymentInput } from "@/lib/orders-api";

type Method = "WALLET" | "CARD";

export default function CheckoutPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { items, clear } = useCart();

  const [method, setMethod] = useState<Method>("WALLET");
  const [walletId, setWalletId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Đã tạo đơn thì giữ id để thử lại thanh toán mà không tạo đơn mới.
  const orderId = useRef<number | null>(null);
  const idemKey = useRef<string | null>(null);

  const goLogin = () => router.replace("/login?next=/checkout");

  useEffect(() => {
    if (!getToken()) goLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hydrated) return <p className="p-4">Đang tải...</p>;

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-4xl p-4">
        <p>Giỏ hàng trống, chưa có gì để thanh toán.</p>
        <Link href="/" className="mt-3 inline-block underline">
          Quay lại menu
        </Link>
      </main>
    );
  }

  const total = cartSubtotal(items);
  const detail = method === "WALLET" ? walletId.trim() : cardNumber.replace(/\s/g, "");

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      if (orderId.current === null) {
        orderId.current = (await createOrder(items)).id;
      }
      if (!idemKey.current) idemKey.current = crypto.randomUUID();

      const input: PaymentInput =
        method === "WALLET"
          ? { orderId: orderId.current, method, walletId: detail }
          : { orderId: orderId.current, method, cardNumber: detail };
      const result = await createPayment(input, idemKey.current);
      idemKey.current = null;

      if (result.order_status === "PAID") {
        const id = orderId.current;
        clear(); // chỉ xoá giỏ khi thanh toán thành công
        router.replace(`/orders/${id}`);
      } else {
        setError(`${result.message}. Giỏ hàng vẫn được giữ, bạn có thể thử lại.`);
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return goLogin();
      if (e instanceof ApiError && e.status === 409) idemKey.current = null;
      setError(e instanceof Error ? e.message : "Không thanh toán được");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Thanh toán</h1>

      {/* Danh sách sản phẩm: cùng bố cục với giỏ hàng, chỉ để xem */}
      <ul className="space-y-3">
        {items.map((i) => {
          const toppingText =
            i.toppings.length > 0
              ? i.toppings.map((id) => TOPPINGS.find((t) => t.id === id)?.name ?? id).join(", ")
              : "Không topping";

          return (
            <li
              key={i.key}
              className="flex items-center gap-5 rounded border px-4"
              style={{ height: 96 }}
            >
              <div
                className="shrink-0 overflow-hidden rounded bg-amber-100"
                style={{ width: 72, height: 72 }}
              >
                {i.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={i.imageUrl}
                    alt={i.name}
                    style={{ width: 72, height: 72, objectFit: "cover" }}
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-3xl">☕</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{i.name}</p>
                <p className="text-sm text-gray-500">Size {i.size}</p>
                <p className="truncate text-sm text-gray-500">{toppingText}</p>
              </div>

              <p className="shrink-0 text-center" style={{ width: 112 }}>
                × {i.qty}
              </p>

              <p className="shrink-0 text-right font-medium" style={{ width: 120 }}>
                {formatVND(lineTotalOf(i))}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-center justify-between text-lg">
        <span>Tổng</span>
        <span className="font-bold">{formatVND(total)}</span>
      </div>

      <section className="mt-6 mb-4">
        <h2 className="mb-2 font-medium">Phương thức</h2>
        <label className="mb-1 flex items-center gap-2">
          <input type="radio" checked={method === "WALLET"} onChange={() => setMethod("WALLET")} />
          Ví điện tử
        </label>
        <label className="mb-3 flex items-center gap-2">
          <input type="radio" checked={method === "CARD"} onChange={() => setMethod("CARD")} />
          Thẻ ngân hàng
        </label>
        {method === "WALLET" ? (
          <input
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            placeholder="Mã ví, ví dụ WALLET-1234"
            className="w-full rounded border p-2"
          />
        ) : (
          <input
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            inputMode="numeric"
            placeholder="Số thẻ"
            className="w-full rounded border p-2"
          />
        )}
        <p className="mt-2 text-sm text-gray-500">Không dùng tiền mặt</p>
      </section>

      {error && (
        <p role="alert" className="mb-3 rounded border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}

      <button
        onClick={handleConfirm}
        disabled={busy || !detail}
        className="w-full rounded bg-amber-600 py-3 text-white disabled:opacity-50"
      >
        {busy ? "Đang xử lý..." : "Xác nhận trả"}
      </button>
    </main>
  );
}