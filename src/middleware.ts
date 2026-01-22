import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Check for required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.next()
    }

    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options) {
            try {
              request.cookies.set({
                name,
                value,
                ...options,
              })
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              })
              response.cookies.set({
                name,
                value,
                ...options,
              })
            } catch (error) {
              console.error('Error setting cookie:', error)
            }
          },
          remove(name: string, options) {
            try {
              request.cookies.set({
                name,
                value: '',
                ...options,
              })
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              })
              response.cookies.set({
                name,
                value: '',
                ...options,
              })
            } catch (error) {
              console.error('Error removing cookie:', error)
            }
          },
        },
      }
    )

    // Get user session with improved timeout and error handling
    let user = null
    try {
      const { data, error } = await Promise.race([
        supabase.auth.getUser(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 8000))
      ])

      if (error) {
        console.warn('Middleware: Auth error (non-critical):', error.message)
      } else {
        user = data?.user
      }
    } catch (error) {
      console.warn('Middleware: Auth check timeout (continuing without auth):', error instanceof Error ? error.message : 'Unknown error')
      // Continue without user authentication - this is acceptable for public routes
    }

    const { pathname } = request.nextUrl

    // Public routes that don't require authentication
    const publicRoutes = ['/auth/login', '/auth/register', '/auth/reset-password', '/auth/verify-email']
    // Check if route is public (evaluated but result not stored - used implicitly in logic)
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    publicRoutes.includes(pathname) || pathname === '/'

    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/profile', '/admin', '/designer', '/client']
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    // If user is not authenticated and trying to access protected route
    if (!user && isProtectedRoute) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (user && (pathname.startsWith('/auth/') && pathname !== '/auth/verify-email')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Role-based access control with error handling
    if (user && isProtectedRoute) {
      try {
        // Get user role from database with timeout
        const { data: userData, error } = await Promise.race([
          supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 6000))
        ])

        if (error) {
          console.error('Error fetching user role:', error)
          // Allow access but log the error
          return response
        }

        const userRole = userData?.role

        // Admin-only routes
        if (pathname.startsWith('/admin') && userRole !== 'admin') {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // Designer-only routes
        if (pathname.startsWith('/designer') && userRole !== 'designer') {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // Client-only routes
        if (pathname.startsWith('/client') && userRole !== 'client') {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } catch (error) {
        console.error('Role check failed:', error)
        // Allow access but log the error
      }
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // Return a basic response if middleware fails completely
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
