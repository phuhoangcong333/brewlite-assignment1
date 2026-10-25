"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { formatVND } from "@/lib/pricing";
import { ApiError, getMyOrders, type Order } from "@/lib/orders-api";

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) return router.replace(`/login?next=/orders/${id}`);
    // BE chưa có GET /orders/:id
    getMyOrders()
      .then((orders) => setOrder(orders.find((o) => o.id === Number(id)) ?? null))
      .catch((e) =>
        e instanceof ApiError && e.status === 401
          ? router.replace(`/login?next=/orders/${id}`)
          : setError(e.message)
      )
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return <p className="p-4">Đang tải...</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;
  if (!order) {
    return (
      <main className="mx-auto max-w-md p-4 text-center">
        <p>Không tìm thấy đơn hàng.</p>
        <Link href="/" className="mt-3 inline-block underline">
          Về trang chủ
        </Link>
      </main>
    );
  }

  const paid = order.status === "PAID";
  const failed = order.status === "PAYMENT_FAILED";

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="rounded border p-8 text-center">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl text-white ${
            paid ? "bg-green-600" : failed ? "bg-red-600" : "bg-amber-600"
          }`}
        >
          {paid ? "✓" : failed ? "✕" : "…"}
        </div>

        <h1 className="mt-4 text-2xl font-bold">
          {paid
            ? "Đặt hàng thành công"
            : failed
              ? "Thanh toán thất bại"
              : "Đơn hàng chưa thanh toán"}
        </h1>

        <dl className="mt-5 space-y-2 text-left">
          <div className="flex justify-between">
            <dt className="text-gray-500">Mã đơn</dt>
            <dd className="font-medium">#{order.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Trạng thái</dt>
            <dd className="font-medium">{order.status}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Tổng tiền</dt>
            <dd className="font-medium">{formatVND(order.total)}</dd>
          </div>
        </dl>

        {paid && <p className="mt-5">Mời tới quầy lấy nước</p>}
        {failed && (
          <p className="mt-5 text-sm text-gray-500">
            Giỏ hàng vẫn được giữ nguyên, bạn có thể thanh toán lại.
          </p>
        )}

        {!paid && (
          <Link
            href="/checkout"
            className="mt-5 block rounded bg-amber-600 py-3 text-white"
          >
            Quay lại thanh toán
          </Link>
        )}
        <Link
          href="/"
          className={`mt-3 block rounded py-3 ${
            paid ? "bg-amber-600 text-white" : "border"
          }`}
        >
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}