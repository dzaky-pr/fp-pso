"use client";

import { getBooks } from "@/actions/actions";
import { getAuthToken } from "@/actions/auth";
import AuthProtectedBookList from "@/components/AuthProtectedBookList";
import Header from "@/components/Header";
import type { IBook } from "@/types";
import { useEffect, useState } from "react";

export default function Home() {
  const [books, setBooks] = useState<IBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      const token = getAuthToken();
      const booksData = await getBooks(token);

      if (booksData.status === 200 && Array.isArray(booksData.data)) {
        setBooks(booksData.data);
      }
      setLoading(false);
    };

    fetchBooks();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 dark:from-zinc-900 dark:to-zinc-800 transition-colors duration-300">
      <Header />

      <main className="py-12 px-6 md:px-12 lg:px-24">
        <div className="flex items-center justify-between mb-6  md:mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-800 dark:text-white">
            Explore Our Collections
          </h2>
        </div>
        {loading ? (
          <div className="text-center py-20">Loading books...</div>
        ) : (
          <AuthProtectedBookList initialBooks={books} />
        )}
      </main>
    </div>
  );
}
