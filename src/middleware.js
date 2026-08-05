import { NextResponse } from 'next/server';

// Routes nécessitant une authentification
const protectedRoutes = [
  '/dashboard',
  '/students',
  '/trainers',
  '/formateurs',
  '/courses',
  '/modules',
  '/grades',
  '/schedule',
  '/attendance',
  '/finances',
  '/inventory',
  '/staff',
  '/leaves',
  '/users',
  '/roles',
  '/system',
  '/settings',
  '/formateur-portal',
];

// Routes accessibles uniquement si NON authentifié
const publicRoutes = ['/login'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Dans Next.js Edge Middleware, on ne peut pas lire le localStorage.
  // On utilise donc les cookies pour stocker le token.
  const token = request.cookies.get('token')?.value;

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // 1. Rediriger vers /login si non authentifié et tente d'accéder à une route protégée
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Rediriger vers /dashboard si déjà connecté et tente d'aller sur /login
  if (isPublicRoute && token) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Ignorer les requêtes pour les assets statiques, _next, api, etc.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|\\.png$).*)'],
};
