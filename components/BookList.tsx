// "use client";

// import type { IBook } from "@/types";
// import BookCard from "./BookCard";
// import SearchBar from "./SearchBar";

// export default function BookList({ books }: { books: IBook[] }) {
//   const [filteredBooks, setFilteredBooks] = useState<IBook[]>(books);

//   const handleSearch = (query: string) => {
//     const filtered = books.filter(
//       (book) =>
//         book.title.toLowerCase().includes(query.toLowerCase()) ||
//         book.author.toLowerCase().includes(query.toLowerCase()),
//     );
//     setFilteredBooks(filtered);
//   };

//   return (
//     <>
//       {/* <div className="mb-6">
//         <SearchBar onSearch={handleSearch} />
//       </div>

//       {books.length === 0 ? (
//         <div className="text-center py-12">
//           <p className="text-gray-600 dark:text-gray-400 text-lg">
//             No books available. Add some books to get started!
//           </p>
//         </div>
//       ) : filteredBooks.length === 0 ? (
//         <div className="text-center py-12">
//           <p className="text-gray-600 dark:text-gray-400 text-lg">
//             No books found matching your search.
//           </p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
//           {filteredBooks.map((book, idx) => (
//             <BookCard key={idx} book={book} />
//           ))}
//         </div>
//       )}

//       <div>
//         <Link href="/add">
//           <button className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-btn-color text-white shadow-lg hover:bg-text-hover transition-all duration-300">
//             <FiPlus size={24} />
//           </button>
//         </Link>
//       </div> */}
//       {books.length === 0 ? (
//         <div className="text-center py-12">
//           <p className="text-gray-600 dark:text-gray-400 text-lg">
//             No books available. Add some books to get started!
//           </p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
//           {books.map((book, idx) => (
//             <BookCard key={idx} book={book} />
//           ))}
//         </div>
//       )}
//     </>
//   );
// }

"use client";

import type { IBook } from "@/types";
import Link from "next/link";
import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import BookCard from "./BookCard";
import SearchBar from "./SearchBar";

export default function BookList({ books }: { books: IBook[] }) {
  const [filteredBooks, setFilteredBooks] = useState<IBook[]>(books);

  const handleSearch = (query: string) => {
    const filtered = books.filter(
      (book) =>
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.author.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredBooks(filtered);
  };

  return (
    <>
      <div className="mb-6">
        <SearchBar onSearch={handleSearch} />
      </div>

      {books.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No books available. Add some books to get started!
          </p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No books found matching your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredBooks.map((book, idx) => (
            <BookCard key={idx} book={book} />
          ))}
        </div>
      )}

      <div>
        <Link href="/add">
          <button className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-btn-color text-white shadow-lg hover:bg-text-hover transition-all duration-300">
            <FiPlus size={24} />
          </button>
        </Link>
      </div>
    </>
  );
}
