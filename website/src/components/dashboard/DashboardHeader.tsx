import React from "react";
import Link from "next/link";
import { UserProfile } from "../UserProfile";

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between p-6 pb-0">
      <Link href="/" className="flex items-center gap-4 group p-6">
        <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 p-">
          <img 
            src="/logo.png" 
            alt="Turbo Logo" 
            className="w-10 h-10 invert brightness-0 filter" 
          />
        </div>
        <h1 className="text-3xl font-bold text-white transition-colors">
          Turbo
        </h1>
      </Link>

      <UserProfile />
    </div>
  );
}
