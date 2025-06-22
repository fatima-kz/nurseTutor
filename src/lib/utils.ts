import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createPageUrl(pageName: string): string {
  const routes: Record<string, string> = {
    Home: '/',
    Auth: '/auth',
    Dashboard: '/dashboard',
    Test: '/test'
  }
  
  return routes[pageName] || '/'
}
