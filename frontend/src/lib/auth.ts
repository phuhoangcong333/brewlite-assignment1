//Tui lấy code mới nhất từ dev về không thấy đăng nhập đăng ký nên tui nhét tạm
const TOKEN_KEY = "brewlite_token";
const EMAIL_KEY = "brewlite_email";

// Tạm tắt đăng nhập: đặt NEXT_PUBLIC_REQUIRE_AUTH=true trong .env.local để bật lại.
const REQUIRE_AUTH = process.env.NEXT_PUBLIC_REQUIRE_AUTH === "true";

export const getToken = () => {
  if (!REQUIRE_AUTH) return "dev-token";
  return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
};

export const getEmail = () =>
  typeof window === "undefined" ? null : localStorage.getItem(EMAIL_KEY);

export function setSession(token: string, email: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
  window.dispatchEvent(new Event("brewlite-auth"));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
  window.dispatchEvent(new Event("brewlite-auth"));
}