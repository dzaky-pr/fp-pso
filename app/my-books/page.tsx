"use client";

import { getAuthToken } from "@/actions/auth";
import { getMyBooks } from "@/actions/data";
import AuthRequiredWrapper from "@/components/AuthRequiredWrapper";
import BookList from "@/components/BookList";
import Header from "@/components/Header";
import type { IBook } from "@/types";
import { useEffect, useState } from "react";

export default function MyBooksPage() {
  const [myBooks, setMyBooks] = useState<IBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyBooks = async () => {
      setLoading(true);
      const token = getAuthToken();
      const res = await getMyBooks(token);

      if (res.status === 200 && Array.isArray(res.data)) {
        setMyBooks(res.data);
      }
      setLoading(false);
    };

    fetchMyBooks();
  }, []);

  return (
    <AuthRequiredWrapper>
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 dark:from-zinc-900 dark:to-zinc-800 transition-colors duration-300">
        <Header />
        <main className="py-12 px-6 md:px-12 lg:px-24">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-4xl font-extrabold tracking-tight text-gray-800 dark:text-white">
              My Books
            </h2>
          </div>
          {loading ? (
            <div className="text-center">Loading your books...</div>
          ) : (
            <BookList books={myBooks} />
          )}
        </main>
      </div>
    </AuthRequiredWrapper>
  );
}
