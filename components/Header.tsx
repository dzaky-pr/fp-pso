"use client";

import { getUserEmailFromToken, isAuthenticated, logout } from "@/actions/auth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiMenu, FiMoon, FiSun, FiX } from "react-icons/fi";

function Header() {
  const [isDark, setIsDark] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);

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
      if (window.innerWidth >= 768) setIsMenuOpen(false);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
    setIsProfileOpen(false);
    router.push("/login");
  };

  return (
    <header className="relative py-3.5 px-4 md:px-10 shadow-md dark:shadow-slate-800 transition-colors duration-300">
      <div className="flex justify-between items-center">
        <h1 className="flex items-center text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
          <Image
            src="/image/library.png"
            width={40}
            height={40}
            alt="Book Library"
            className="mr-2 md:mr-3"
          />
          <Link href="/">
            <span className="hidden sm:inline">Book Library Hai</span>
            <span className="sm:hidden">Library</span>
          </Link>
        </h1>

        <nav className="hidden md:flex items-center space-x-4">
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
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme Website"
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {isDark ? (
              <FiSun size={20} className="text-yellow-400" />
            ) : (
              <FiMoon size={20} className="text-gray-700" />
            )}
          </button>

          <div className="relative" ref={profileRef}>
            {loggedIn ? (
              <button
                aria-label="Toggle Profile Menu"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[150px]">
                  {userEmail}
                </span>
                <FiChevronDown
                  className={`transition-transform duration-200 ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            ) : (
              <Link href="/login">
                <button className="py-2 px-4 bg-btn-color text-white rounded hover:bg-text-hover transition duration-200">
                  Login
                </button>
              </Link>
            )}

            {isProfileOpen && loggedIn && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-md shadow-lg py-1 z-50 border dark:border-zinc-700">
                <div className="px-4 py-3 border-b dark:border-zinc-600">
                  <p className="text-sm text-gray-500">Signed in as</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {userEmail}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center md:hidden">
          <button
            onClick={toggleTheme}
            aria-label="Toogle Theme Mobile"
            className="p-2 mr-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {isDark ? (
              <FiSun size={20} className="text-yellow-400" />
            ) : (
              <FiMoon size={20} className="text-gray-700" />
            )}
          </button>
          {loggedIn ? (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
              aria-label="Open menu"
            >
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          ) : (
            <Link href="/login">
              <button className="py-2 px-3 text-sm bg-btn-color text-white rounded hover:bg-text-hover transition duration-200">
                Login
              </button>
            </Link>
          )}
        </div>
      </div>

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
