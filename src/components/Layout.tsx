"use client"

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPageUrl } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";


interface LayoutProps {
  children: React.ReactNode;
  currentPageName?: string;
}

export default function Layout({ children, currentPageName }: LayoutProps) {
  const pathname = usePathname();
  const { user, userProfile, signOut } = useAuth();

  // Development-only logging
  if (process.env.NODE_ENV === 'development') {
    console.log("Current page:", currentPageName || pathname);
  }

  const handleLogout = async () => {
    console.log("Logging out user:", user?.email || "Unknown User");
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={createPageUrl("Home")} className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                NurseID
              </span>
            </Link>

            <div className="flex items-center space-x-4">
              {/* AI Assistant Button - Always visible */}
              <Link 
                    href={createPageUrl("aiAssistant")}
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 hidden sm:inline"
                  >
                    AI Assistent
              </Link>

              
              {user ? (
                <>
                  <Link 
                    href={createPageUrl("Dashboard")}
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 hidden sm:inline"
                  >
                    Dashboard
                  </Link>
                  <span className="text-gray-600 hidden md:inline">
                    Welcome, {userProfile?.full_name || user.user_metadata?.full_name || 'Student'}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition-all duration-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href={createPageUrl("Auth")}
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 hidden sm:inline"
                  >
                    Login
                  </Link>
                  <Link 
                    href={createPageUrl("Auth")}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer - only show on Home page */}
      {pathname === "/" && (
        <footer className="bg-white border-t border-blue-100">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">N</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">NurseID</span>
                </div>
                <p className="text-gray-600">
                  Empowering future nurses with comprehensive exam preparation tools.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>
                <div className="space-y-2 text-gray-600">
                  <p>support@nurseid.com</p>
                  <p>1-800-NURSE-ID</p>
                  <p>Mon-Fri 9AM-6PM EST</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
                <div className="space-y-2">
                  <a href="#" className="block text-gray-600 hover:text-blue-600 transition-colors">
                    Privacy Policy
                  </a>
                  <a href="#" className="block text-gray-600 hover:text-blue-600 transition-colors">
                    Terms of Service
                  </a>
                  <a href="#" className="block text-gray-600 hover:text-blue-600 transition-colors">
                    Refund Policy
                  </a>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-600">
              <p>&copy; 2024 NurseID. All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
