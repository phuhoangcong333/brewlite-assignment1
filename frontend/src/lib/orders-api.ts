import { clearSession, getToken } from "./auth";
import type { CartItem } from "./cart";
import { calcUnitPrice } from "./pricing";
import type { Size } from "./types";
 
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
 
/** BE validate topping theo TÊN, không phải id. */
export const TOPPING_NAME: Record<string, string> = {
  pearl: "Trân châu",
  cream: "Kem",
};
 
export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "PAYMENT_FAILED"
  | "CANCELLED";
 
export type Order = {
  id: number;
  status: OrderStatus;
  total: number;
  createdAt: string;
};
 
export type PaymentInput =
  | { orderId: number; method: "WALLET"; walletId: string }
  | { orderId: number; method: "CARD"; cardNumber: string };
 
export type PaymentResult = {
  orderId: number;
  order_status: OrderStatus;
  message: string;
};
 
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
 
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((init.headers as Record<string, string>) ?? {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) clearSession();
    const m = data?.message;
    throw new ApiError(
      res.status,
      Array.isArray(m) ? m.join(", ") : (m ?? "Có lỗi xảy ra, vui lòng thử lại")
    );
  }
  return data as T;
}
 
/* ---------- mock (lưu đơn trong localStorage) ---------- */
const MOCK_KEY = "brewlite_mock_orders";
const readMock = (): Order[] => {
  try {
    return JSON.parse(localStorage.getItem(MOCK_KEY) ?? "[]");
  } catch {
    return [];
  }
};
const writeMock = (o: Order[]) =>
  localStorage.setItem(MOCK_KEY, JSON.stringify(o));
 
/* ---------- auth ---------- */
type AuthResponse = {
  access_token: string;
  user: { id: number; email: string };
};
 
export async function login(email: string, password: string) {
  if (USE_MOCK) {
    await delay(300);
    return { access_token: "mock-token", user: { id: 1, email } } as AuthResponse;
  }
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
 
export async function register(email: string, password: string) {
  if (USE_MOCK) {
    await delay(300);
    return;
  }
  await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
 
/* ---------- orders ---------- */
export async function createOrder(cart: CartItem[]): Promise<{ id: number; total: number }> {
  if (USE_MOCK) {
    await delay(500);
    const total = cart.reduce(
      (s, i) => s + calcUnitPrice(i.basePrice, i.size as Size, i.toppings) * i.qty,
      0
    );
    const order: Order = {
      id: Math.floor(Math.random() * 90000) + 10000,
      status: "PENDING",
      total,
      createdAt: new Date().toISOString(),
    };
    writeMock([order, ...readMock()]);
    return { id: order.id, total };
  }
  return request<{ id: number; total: number }>("/orders", {
    method: "POST",
    body: JSON.stringify({
      items: cart.map((i) => ({
        productId: i.productId,
        qty: i.qty,
        size: i.size,
        toppings: i.toppings.map((t) => TOPPING_NAME[t]),
      })),
    }),
  });
}
 
export async function getMyOrders(): Promise<Order[]> {
  if (USE_MOCK) {
    await delay(300);
    return readMock();
  }
  return request<Order[]>("/orders/me");
}
 
/* ---------- payment ---------- */
export async function createPayment(
  input: PaymentInput,
  idempotencyKey: string
): Promise<PaymentResult> {
  if (USE_MOCK) {
    await delay(800);
    const orders = readMock();
    const order = orders.find((o) => o.id === input.orderId);
    if (!order) throw new ApiError(404, "Không tìm thấy đơn hàng");
    const tail = input.method === "WALLET" ? input.walletId : input.cardNumber;
    const ok = !tail.endsWith("0000"); // giống BE: 4 ký tự cuối 0000 => thất bại
    order.status = ok ? "PAID" : "PAYMENT_FAILED";
    writeMock(orders);
    return {
      orderId: order.id,
      order_status: order.status,
      message: ok ? "Thanh toán thành công" : "Thanh toán thất bại",
    };
  }
  return request<PaymentResult>("/payments", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(input),
  });
}