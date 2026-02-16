"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  
  return (
    <nav className="fixed top-0 w-full z-[100] bg-[#0B1121]/95 backdrop-blur-sm border-b border-white/5 py-4">
      <div className="max-w-[1567px] mx-auto px-8 lg:px-16 flex items-center justify-between">
        {/* Left: Logo and Links */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center group">
            <span className="text-xl font-black text-white tracking-wider">OLOS</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/games" className="text-gray-400 hover:text-white transition-colors text-[13px] font-bold">Games</Link>
            <Link href="/leaderboard" className="text-gray-400 hover:text-white transition-colors text-[13px] font-bold">Leaderboards</Link>
          </div>
        </div>

        {/* Right: Badges and Sign In */}
        <div className="flex items-center gap-8">
          <div className="hidden lg:flex items-center gap-4">
            <Link href="#" className="hover:opacity-80 transition-opacity">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                alt="App Store" 
                className="h-9"
              />
            </Link>
            <Link href="#" className="hover:opacity-80 transition-opacity">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                alt="Google Play" 
                className="h-9"
              />
            </Link>
          </div>
          
          <Link href="/login" className="px-10 py-2.5 rounded-lg bg-olos-blue hover:bg-olos-cobalt text-white text-[13px] font-bold transition-all active:scale-95 shadow-lg shadow-blue-900/20">
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  );
}
