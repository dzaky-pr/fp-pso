import { getBooks } from "@/actions/data";
import BookList from "@/components/BookList";
import Header from "@/components/Header";
import type { IBook } from "@/types";

export default async function Home() {
  const booksData = await getBooks();
  const books: IBook[] = Array.isArray(booksData?.data) ? booksData.data : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 dark:from-zinc-900 dark:to-zinc-800 transition-colors duration-300">
      <Header />

      <main className="py-12 px-6 md:px-12 lg:px-24">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-800 dark:text-white">
            Explore Our Collections Bro!
          </h2>
        </div>

        {/* Book list with search */}
        <BookList books={books} />
      </main>
    </div>
  );
}
