// src/components/Navbar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, Home, List, UserCircle, Zap } from "lucide-react";

export default function Navbar() {
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/advice", label: "Get Advice", icon: Zap },
    { to: "/history", label: "History", icon: List },
    { to: "/mock-interview", label: "Mock Interview", icon: BookOpen },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2 font-bold text-indigo-600 dark:text-indigo-400">
            <BookOpen size={28} />
            <span className="text-xl">AI Career Coach</span>
          </Link>
          <div className="hidden md:flex space-x-6">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium
                  ${
                    location.pathname === to
                      ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-800 dark:text-indigo-300"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                  }`}
                aria-current={location.pathname === to ? "page" : undefined}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* Placeholder user avatar */}
          <button
            aria-label="User menu"
            className="rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 p-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            title="User menu (placeholder)"
          >
            <UserCircle size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
}
