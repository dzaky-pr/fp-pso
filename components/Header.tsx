"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";

function Header() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const isInitiallyDark = saved === "dark" || (!saved && prefersDark);

    document.documentElement.classList.toggle("dark", isInitiallyDark);
    setIsDark(isInitiallyDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    setIsDark(newTheme);
  };

  return (
    <header className="flex justify-between items-center py-3.5 px-10 shadow-md dark:shadow-slate-800 transition-colors duration-300">
      <h1 className="flex items-center text-3xl font-bold text-gray-900 dark:text-white px-14">
        <Image
          src="/image/library.png"
          width={50}
          height={50}
          alt="Book Library"
          className="mr-3"
        />
        <Link href="/">Book Library Halo!</Link>
      </h1>
      <nav className="flex items-center space-x-6">
        <Link
          href="/"
          className="text-text-color dark:text-white hover:text-text-hover dark:hover:text-gray-300 transition-colors"
        >
          Home
        </Link>
        <Link href={"/add"}>
          <button className="py-2 px-4 bg-btn-color text-white rounded hover:bg-text-hover transition duration-200">
            Add Book
          </button>
        </Link>
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
    </header>
  );
}

export default Header;
