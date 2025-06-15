"use client";

import { putBookInDB } from "@/actions/actions";
import { getAuthToken } from "@/actions/auth";
import AuthRequiredWrapper from "@/components/AuthRequiredWrapper";
import Header from "@/components/Header";
import Toggle from "@/components/Toggle";
import type { IBook } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

function AddPage() {
  const [book, setBook] = useState<IBook>({
    id: Math.floor(1000 + Math.random() * 9000),
    title: "",
    author: "",
    price: 0,
    description: "",
    isPrivate: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (book) {
      const newBook: IBook = {
        ...book,
        [name]:
          name === "price"
            ? value === ""
              ? 0
              : Number.parseFloat(value) || 0
            : value,
      };
      setBook(newBook);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = getAuthToken();
      await putBookInDB(book, token);
      router.push("/");
      router.refresh();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      setError("Failed to add book");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 dark:from-zinc-900 dark:to-zinc-800 transition-colors duration-300">
      <Header />
      {error && (
        <div className="my-5 w-full max-w-lg mx-auto bg-red-400 text-white p-4 rounded-lg shadow-md">
          {error}
        </div>
      )}

      <AuthRequiredWrapper>
        <form
          onSubmit={handleSubmit}
          className="my-10 w-full max-w-lg mx-auto p-6 rounded-2xl bg-white/40 dark:bg-white/10 border border-white/30 dark:border-white/20 backdrop-blur-md shadow-xl transition-all"
        >
          <h2 className="text-3xl font-bold mb-6 text-center">Add Book</h2>

          {/* title */}
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
              placeholder="Enter Book Title"
              className="w-full p-3 mt-2 bg-white/80 dark:bg-zinc-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300 transition"
              required
            />
          </div>

          {/* author */}
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
              placeholder="Enter Author's Name"
              className="w-full p-3 mt-2 bg-white/80 dark:bg-zinc-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300 transition"
              required
            />
          </div>

          {/* price */}
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
              value={book.price === 0 ? "" : book.price}
              onChange={handleChange}
              placeholder="Enter Book Price"
              className="w-full p-3 mt-2 bg-white/80 dark:bg-zinc-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300 transition"
              required
            />
          </div>

          {/* description */}
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
              placeholder="Enter Book Description"
              rows={4}
              className="w-full p-3 mt-2 bg-white/80 dark:bg-zinc-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300 transition"
              required
            />
          </div>

          <div className="mb-6 flex items-center justify-between">
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              Keep this book private?
            </span>
            <Toggle
              enabled={book.isPrivate ?? false}
              setEnabled={(value) =>
                setBook((prev) => ({ ...prev, isPrivate: value }))
              }
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-btn-color text-white rounded-xl hover:bg-text-hover transition duration-300 shadow-md"
            disabled={loading}
          >
            {loading ? "Loading..." : "Add Book"}
          </button>
        </form>
      </AuthRequiredWrapper>
    </div>
  );
}

export default AddPage;
