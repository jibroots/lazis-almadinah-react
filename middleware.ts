import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/cetak-struk')) {
    return NextResponse.next();
  }
  const { pathname } = request.nextUrl;

  // 1. Ambil token otentikasi dari Cookies browser
  // (Pastikan nama cookie ini sesuai dengan yang Anda set di file app/api/auth/login/route.ts)
  const token = request.cookies.get('token')?.value;

  // 2. Daftar rute API yang BOLEH diakses tanpa harus login (Bypass)
  const isPublicApi = 
    pathname.startsWith('/api/auth/login') || 
    pathname.startsWith('/api/auth/logout') ||
    pathname.startsWith('/api/ping') ||
    pathname.startsWith('/api/init'); // Rute inisialisasi database awal

  // 3. Proteksi untuk semua Rute API (/api/...)
  if (pathname.startsWith('/api') && !isPublicApi) {
    // Jika tidak ada token, langsung tolak dengan status 401 Unauthorized
    if (!token) {
      return NextResponse.json(
        { error: 'Akses ditolak! Anda harus login terlebih dahulu untuk mengakses data ini.' },
        { status: 401 }
      );
    }
  }
}

// 4. Batasi jalur kerja Middleware hanya untuk rute API demi efisiensi performa
export const config = {
  matcher: [
    '/api/:path*', // Menjaga semua sub-folder di dalam folder api
    '/((?!api/cetak-struk|api/auth|_next/static|_next/image|favicon.ico).*)', // Pengecualian di sini agar tidak memblokir API struk
  ],
};