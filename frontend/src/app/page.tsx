"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getProducts } from "@/lib/api";
import { formatVND } from "@/lib/pricing";
import type { Product } from "@/lib/types";

export default function MenuPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);

    getProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setAuthorized(true);
    load();
  }, [router]);

  // Chưa kiểm tra xong thì không hiển thị menu
  if (!authorized) {
    return null;
  }

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-bold">
        BrewLite - Menu
      </h1>

      {loading && <p>Đang tải menu...</p>}

      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-4 text-red-700">
          <p>{error}</p>

          <button
            onClick={load}
            className="mt-2 underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <p>Hiện chưa có sản phẩm nào.</p>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            className="rounded-lg border p-3 transition hover:shadow-md"
          >
            <div className="mb-2 flex h-28 items-center justify-center rounded bg-amber-100 text-4xl">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="h-full w-full rounded object-cover"
                />
              ) : (
                "☕"
              )}
            </div>

            <p className="font-medium">{p.name}</p>

            <p className="text-amber-700">
              {formatVND(p.price)}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}