"use client";

import { deleteBookInDB, getBookFromDB, putBookInDB } from "@/actions/actions";
import Header from "@/components/Header";
import type { IBook } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function BookPage({ params }: { params: { id: number } }) {
  const [book, setBook] = useState<IBook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (book) {
      const newBook: IBook = {
        ...book,
        [name]: name === "price" ? Number.parseFloat(value) : value,
      };
      setBook(newBook);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin mengedit buku ini?",
    );
    if (!confirmed) return;
    setLoading(true);
    try {
      if (book) {
        await putBookInDB(book);
        router.push("/");
        router.refresh();
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      setError("Failed to edit book");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus buku ini?",
    );
    if (!confirmed) return;
    setLoadingDelete(true);
    try {
      if (book) {
        await deleteBookInDB(params.id);
        router.push("/");
        router.refresh();
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      setError("Failed to delete book");
    } finally {
      setLoadingDelete(false);
    }
  };

  useEffect(() => {
    const fetchBook = async () => {
      const fetchedBook = await getBookFromDB(params.id);
      if (fetchedBook.data.message == "not found") {
        router.push("/");
      }
      setBook(fetchedBook.data);
    };

    fetchBook();
  }, [params.id, router]);

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-zinc-900 text-text-color dark:text-white transition-colors duration-300">
      <Header />
      {error && (
        <div className="my-5 w-full max-w-lg mx-auto bg-red-400 text-white p-4 rounded-lg shadow-md">
          {error}
        </div>
      )}
      {book ? (
        <div>
          <form
            onSubmit={handleEditSubmit}
            className="my-10 w-full max-w-lg mx-auto p-6 rounded-2xl bg-white/40 dark:bg-white/10 border border-white/30 dark:border-white/20 backdrop-blur-md shadow-xl transition-all"
          >
            <h2 className="text-3xl font-bold mb-6 text-center">Edit Book</h2>

            {/* Title */}
            <div className="mb-4">
              <label
                htmlFor="title"
                className="block font-semibold text-gray-800 dark:text-gray-200"
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={book.title}
                onChange={handleChange}
                className="w-full p-3 mt-2 bg-white/80 dark:bg-zinc-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300 transition"
                required
              />
            </div>

            {/* Author */}
            <div className="mb-4">
              <label
                htmlFor="author"
                className="block font-semibold text-gray-800 dark:text-gray-200"
              >
                Author
              </label>
              <input
                type="text"
                id="author"
                name="author"
                value={book.author}
                onChange={handleChange}
                className="w-full p-3 mt-2 bg-white/80 dark:bg-zinc-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300 transition"
                required
              />
            </div>

            {/* Price */}
            <div className="mb-4">
              <label
                htmlFor="price"
                className="block font-semibold text-gray-800 dark:text-gray-200"
              >
                Price
              </label>
              <input
                type="number"
                id="price"
                name="price"
                step="0.01"
                value={book.price}
                onChange={handleChange}
                className="w-full p-3 mt-2 bg-white/80 dark:bg-zinc-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300 transition"
                required
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label
                htmlFor="description"
                className="block font-semibold text-gray-800 dark:text-gray-200"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={book.description}
                onChange={handleChange}
                className="w-full p-3 mt-2 bg-white/80 dark:bg-zinc-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300 transition"
                rows={4}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-btn-color text-white rounded-xl hover:bg-text-hover transition duration-300 shadow-md"
              disabled={loading}
            >
              {loading ? "Loading..." : "Update Book"}
            </button>
          </form>

          <form
            onSubmit={handleDeleteSubmit}
            className="my-5 w-full max-w-lg mx-auto"
          >
            <button
              type="submit"
              className="w-full py-3 bg-red-700 text-white rounded-xl hover:bg-red-600 transition duration-300 shadow-md"
              disabled={loadingDelete}
            >
              {loadingDelete ? "Deleting..." : "Delete Book"}
            </button>
          </form>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-20">Loading...</div>
      )}
    </div>
  );
}

export default BookPage;
