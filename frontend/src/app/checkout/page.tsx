"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { cartSubtotal, lineTotalOf, useCart, useHydrated } from "@/lib/cart";
import { formatVND, TOPPINGS } from "@/lib/pricing";
import { ApiError, createOrder, createPayment, type PaymentInput } from "@/lib/orders-api";

type Method = "WALLET" | "CARD";
type Step = "idle" | "creating" | "paying" | "done";

const STEP_TEXT: Record<Exclude<Step, "idle">, { title: string; hint: string }> = {
  creating: { title: "Đang tạo đơn hàng...", hint: "Vui lòng không đóng trang" },
  paying: { title: "Đang xử lý thanh toán...", hint: "Vui lòng không đóng trang" },
  done: { title: "Thanh toán thành công", hint: "Đang chuyển tới màn hình xác nhận..." },
};

export default function CheckoutPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { items, clear } = useCart();

  const [method, setMethod] = useState<Method>("WALLET");
  const [walletId, setWalletId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);

  const orderId = useRef<number | null>(null);
  const idemKey = useRef<string | null>(null);

  const busy = step !== "idle";
  const goLogin = () => router.replace("/login?next=/checkout");

  useEffect(() => {
    if (!getToken()) goLogin();
  }, []);

  if (!hydrated) return <p className="p-4">Đang tải...</p>;

  if (step === "done") {
    return (
      <main className="mx-auto max-w-4xl p-4">
        <Overlay step="done" />
      </main>
    );
  }

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

  const detailError = (() => {
    if (!detail) return null;
    if (method === "CARD") {
      const ok = /^[0-9][0-9 -]*[0-9]$/.test(detail) && detail.length >= 4 && detail.length <= 32;
      return ok ? null : "Số thẻ chỉ gồm chữ số, dài 4 đến 32 ký tự";
    }
    return detail.length >= 4 && detail.length <= 64 ? null : "Mã ví phải từ 4 đến 64 ký tự";
  })();

  const handleConfirm = async () => {
    if (busy) return;
    setError(null);
    try {
      if (orderId.current === null) {
        setStep("creating");
        orderId.current = (await createOrder(items)).id;
      }
      setStep("paying");
      if (!idemKey.current) idemKey.current = crypto.randomUUID();

      const input: PaymentInput =
        method === "WALLET"
          ? { orderId: orderId.current, method, walletId: detail }
          : { orderId: orderId.current, method, cardNumber: detail };
      const result = await createPayment(input, idemKey.current);
      idemKey.current = null;

      if (result.order_status === "PAID") {
        const id = orderId.current;
        setStep("done");
        clear();
        router.replace(`/orders/${id}`);
      } else {
        setStep("idle");
        setError(`${result.message}. Giỏ hàng vẫn được giữ, bạn có thể thử lại.`);
      }
    } catch (e) {
      setStep("idle");
      if (e instanceof ApiError && e.status === 401) return goLogin();
      if (e instanceof ApiError && e.status === 409) idemKey.current = null;
      setError(e instanceof Error ? e.message : "Không thanh toán được");
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-4">
      {busy && <Overlay step={step as Exclude<Step, "idle">} />}

      <h1 className="mb-4 text-2xl font-bold">Thanh toán</h1>

      {}
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
          <input
            type="radio"
            disabled={busy}
            checked={method === "WALLET"}
            onChange={() => setMethod("WALLET")}
          />
          Ví điện tử
        </label>
        <label className="mb-3 flex items-center gap-2">
          <input
            type="radio"
            disabled={busy}
            checked={method === "CARD"}
            onChange={() => setMethod("CARD")}
          />
          Thẻ ngân hàng
        </label>
        {method === "WALLET" ? (
          <input
            value={walletId}
            disabled={busy}
            onChange={(e) => setWalletId(e.target.value)}
            placeholder="Mã ví, ví dụ WALLET-1234"
            className="w-full rounded border p-2 disabled:opacity-50"
          />
        ) : (
          <input
            value={cardNumber}
            disabled={busy}
            onChange={(e) => setCardNumber(e.target.value)}
            inputMode="numeric"
            placeholder="Số thẻ"
            className="w-full rounded border p-2 disabled:opacity-50"
          />
        )}
        {detailError && <p className="mt-1 text-sm text-red-600">{detailError}</p>}
        <p className="mt-2 text-sm text-gray-500">Không dùng tiền mặt</p>
      </section>

      {error && (
        <p role="alert" className="mb-3 rounded border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}

      <button
        onClick={handleConfirm}
        disabled={busy || !detail || !!detailError}
        className="flex w-full items-center justify-center gap-2 rounded bg-amber-600 py-3 text-white disabled:opacity-50"
      >
        {busy && <Spinner />}
        {step === "creating" ? "Đang tạo đơn..." : step === "paying" ? "Đang thanh toán..." : "Xác nhận trả"}
      </button>
    </main>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
    />
  );
}

function Overlay({ step }: { step: Exclude<Step, "idle"> }) {
  const { title, hint } = STEP_TEXT[step];
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
    >
      <div className="w-72 rounded-lg border bg-neutral-900 p-6 text-center text-white">
        {step === "done" ? (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-2xl">
            ✓
          </div>
        ) : (
          <span
            aria-hidden
            className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"
          />
        )}
        <p className="mt-4 font-medium">{title}</p>
        <p className="mt-1 text-sm text-gray-400">{hint}</p>
      </div>
    </div>
  );
}