import React from "react";
import Link from "next/link";

interface LayoutProps {
  children: React.ReactNode;
  theme?: "dark" | "light";
}

export default function Layout({ children, theme = "dark" }: LayoutProps) {
  const isDark = theme === "dark";
  
  return (
    <div className={`min-h-screen ${isDark ? "bg-black text-white" : "bg-gradient-to-br from-gray-50 to-white"}`}>
      {/* Header */}
      <header className={`border-b ${isDark ? "border-gray-800 bg-gray-950/50" : "border-gray-200 bg-white"} backdrop-blur-sm sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                  {/* <Zap className="w-5 h-5 text-white" /> */}
                  <img src="/logo.png" alt="Turbo Logo" className="invert brightness-0 filter" />
                </div>
              <h1 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Turbo</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/"
                className={`${isDark ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors font-medium`}
              >
                Home
              </Link>
              <Link
                href="/blog"
                className={`${isDark ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors font-medium`}
              >
                Blog
              </Link>
              <Link
                href="/dashboard"
                className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg transition-colors text-white font-medium"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className={`border-t ${isDark ? "border-gray-800" : "border-gray-200"} ${isDark ? "bg-black" : "bg-white"} py-12 px-4 sm:px-6 lg:px-8`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                {/* <Zap className="w-5 h-5 text-white" /> */}
                <img src="/logo.png" alt="Turbo Logo" className="invert brightness-0 filter" />
              </div>
              <span className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Turbo</span>
            </div>
            <div className={`flex gap-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              <a 
                href="https://github.com/L1shed/Turbo" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`${isDark ? "hover:text-white" : "hover:text-gray-900"} transition-colors`}
                aria-label="View source on GitHub"
              >
                {/* GitHub Icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a 
                href="https://discord.gg/ZqdvQkSEc7"
                target="_blank" 
                rel="noopener noreferrer"
                className={`${isDark ? "hover:text-white" : "hover:text-gray-900"} transition-colors`}
                aria-label="Join our Discord"
              >
                {/* Discord Icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
              <a 
                href="https://x.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`${isDark ? "hover:text-white" : "hover:text-gray-900"} transition-colors`}
                aria-label="Follow us on X"
              >
                {/* X (Twitter) Icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
