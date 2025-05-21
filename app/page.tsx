import { getBooks } from "@/actions/data";
import BookCard from "@/components/BookCard";
import Header from "@/components/Header";
import type { IBook } from "@/types";
import Link from "next/link";
import { FiPlus } from "react-icons/fi";

export const dynamic = "force-dynamic";

export default async function Home() {
  const books: IBook[] = (await getBooks()).data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 dark:from-zinc-900 dark:to-zinc-800 transition-colors duration-300">
      <Header />

      <main className="py-12 px-6 md:px-12 lg:px-24">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-800 dark:text-white">
            Explore Our Collections
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {books.map((book, idx) => (
            <BookCard key={idx} book={book} />
          ))}
        </div>
        <div>
          <Link href="/add">
            <button className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-btn-color text-white shadow-lg hover:bg-text-hover transition-all duration-300">
              <FiPlus size={24} />
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
