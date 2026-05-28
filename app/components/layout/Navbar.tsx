"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-emerald-600">
              TairoTairo
            </span>
          </Link>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/services"
              className="text-gray-600 hover:text-emerald-600 font-medium transition-colors"
            >
              Services
            </Link>
            <Link
              href="/auth/login"
              className="text-gray-600 hover:text-emerald-600 font-medium transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/auth/register"
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              S'inscrire
            </Link>
          </div>

          {/* Bouton menu mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <div className="w-5 h-0.5 bg-current mb-1" />
            <div className="w-5 h-0.5 bg-current mb-1" />
            <div className="w-5 h-0.5 bg-current" />
          </button>
        </div>

        {/* Menu mobile */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 flex flex-col gap-3">
            <Link
              href="/services"
              className="text-gray-600 hover:text-emerald-600 font-medium"
            >
              Services
            </Link>
            <Link
              href="/auth/login"
              className="text-gray-600 hover:text-emerald-600 font-medium"
            >
              Connexion
            </Link>
            <Link
              href="/auth/register"
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-center hover:bg-emerald-700"
            >
              S'inscrire
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}