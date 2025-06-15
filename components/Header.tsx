"use client";

import { getUserEmailFromToken, isAuthenticated, logout } from "@/actions/auth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiMenu, FiMoon, FiSun, FiX } from "react-icons/fi";

function Header() {
  const [isDark, setIsDark] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isInitiallyDark = saved === "dark";
    document.documentElement.classList.toggle("dark", isInitiallyDark);
    setIsDark(isInitiallyDark);

    const authStatus = isAuthenticated();
    setLoggedIn(authStatus);
    if (authStatus) {
      setUserEmail(getUserEmailFromToken());
    }

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    setIsDark(newTheme);
  };

  const handleLogout = () => {
    logout();
    setLoggedIn(false);
    setUserEmail(null);
    setIsMenuOpen(false);
    router.push("/login");
  };

  return (
    <header className="relative py-3.5 px-4 md:px-10 shadow-md dark:shadow-slate-800 transition-colors duration-300">
      <div className="flex justify-between items-center">
        {/* Logo dan Judul */}
        <h1 className="flex items-center text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
          <Image
            src="/image/library.png"
            width={40}
            height={40}
            alt="Book Library"
            className="mr-2 md:mr-3"
          />
          <Link href="/">
            <span className="hidden sm:inline">Book Library</span>
            <span className="sm:hidden">Library</span>
          </Link>
        </h1>

        {/* Menu Navigasi untuk Desktop */}
        <nav className="hidden md:flex items-center space-x-6">
          {loggedIn && (
            <>
              <Link
                href="/"
                className="text-text-color dark:text-white hover:text-text-hover dark:hover:text-gray-300 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/my-books"
                className="text-text-color dark:text-white hover:text-text-hover dark:hover:text-gray-300 transition-colors"
              >
                My Books
              </Link>
              <Link href={"/add"}>
                <button className="py-2 px-4 bg-btn-color text-white rounded hover:bg-text-hover transition duration-200">
                  Add Book
                </button>
              </Link>
            </>
          )}
          {loggedIn ? (
            <div className="flex items-center space-x-4">
              <span
                className="text-sm text-gray-600 dark:text-gray-300 hidden lg:inline"
                title={userEmail || ""}
              >
                {userEmail}
              </span>
              <button
                onClick={handleLogout}
                className="py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login">
              <button className="py-2 px-4 bg-btn-color text-white rounded hover:bg-text-hover transition duration-200">
                Login
              </button>
            </Link>
          )}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="ml-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {isDark ? (
              <FiSun size={20} className="text-yellow-400" />
            ) : (
              <FiMoon size={20} className="text-gray-700" />
            )}
          </button>
        </nav>

        {/* Tombol Hamburger untuk Mobile */}
        <div className="flex items-center md:hidden">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 mr-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {isDark ? (
              <FiSun size={20} className="text-yellow-400" />
            ) : (
              <FiMoon size={20} className="text-gray-700" />
            )}
          </button>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2"
            aria-label="Open menu"
          >
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Dropdown Menu untuk Mobile */}
      {isMenuOpen && (
        <nav className="md:hidden mt-4 flex flex-col items-center space-y-2 bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-lg absolute top-full left-4 right-4 z-50">
          {loggedIn ? (
            <>
              <div className="w-full text-left pb-3 mb-2 border-b dark:border-zinc-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Signed in as
                </p>
                <p className="font-semibold truncate">{userEmail}</p>
              </div>
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="w-full text-left p-3 rounded hover:bg-gray-100 dark:hover:bg-zinc-700"
              >
                Home
              </Link>
              <Link
                href="/my-books"
                onClick={() => setIsMenuOpen(false)}
                className="w-full text-left p-3 rounded hover:bg-gray-100 dark:hover:bg-zinc-700"
              >
                My Books
              </Link>
              <Link
                href={"/add"}
                onClick={() => setIsMenuOpen(false)}
                className="w-full text-left p-3 rounded hover:bg-gray-100 dark:hover:bg-zinc-700"
              >
                Add Book
              </Link>
              <button
                onClick={handleLogout}
                className="w-full mt-2 py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="w-full">
              <button className="w-full py-2 px-4 bg-btn-color text-white rounded hover:bg-text-hover transition duration-200">
                Login
              </button>
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

export default Header;
