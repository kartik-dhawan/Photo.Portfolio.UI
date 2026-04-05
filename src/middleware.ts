import { proxy } from "./proxy";

export { proxy };

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
