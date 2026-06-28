import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on all paths except:
     * - _next/static, _next/image (build assets)
     * - favicon, icons, manifest, service worker, offline page
     * - common image files
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|sw.js|offline.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
