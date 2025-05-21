import type { IBook } from "@/types";
import Link from "next/link";

function BookCard({ book }: { book: IBook }) {
  return (
    <div className="rounded-2xl p-6 backdrop-blur-md bg-white/50 dark:bg-white/10 shadow-md border border-white/30 dark:border-white/20 transition hover:shadow-xl hover:scale-[1.02] duration-300">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
        {book.title}
      </h3>
      <p className="text-lg text-gray-600 dark:text-gray-300 italic">
        by {book.author}
      </p>
      <div className="mt-2 text-xl font-semibold text-blue-700 dark:text-blue-300">
        ${book.price.toFixed(2)}
      </div>
      <Link href={`/${book.id}`}>
        <button className="mt-4 py-2 px-4 bg-btn-color text-white rounded-lg hover:bg-text-hover transition duration-200">
          View Book
        </button>
      </Link>
    </div>
  );
}

export default BookCard;
