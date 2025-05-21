import { IBook } from "@/types";
import Link from "next/link";

function BookCard({ book }: { book: IBook }) {
  return (
    <div className="p-6 bg-slate-100 rounded-lg shadow-lg">
      <h3 className="text-2xl font-semibold">
        {book.title}
      </h3>
      <p className="text-lg text-gray-600">
        by {book.author}
      </p>
      <div className="mt-2 text-xl font-bold">
        {book.price}
      </div>
      <button className="mt-4 py-2 px-4 bg-btn-color text-white rounded hover:bg-text-hover transition duration-200">
        <Link href={`/${book.id}`}>View Book</Link>
      </button>
    </div>
  );
}

export default BookCard;
