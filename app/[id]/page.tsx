"use client";

import { deleteBookInDB, getBookFromDB, putBookInDB } from "@/actions/actions";
import { getAuthToken, getUserIdFromToken } from "@/actions/auth";
import AuthRequiredWrapper from "@/components/AuthRequiredWrapper";
import Header from "@/components/Header";
import Toggle from "@/components/Toggle";
import type { IBook } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function BookPage({ params }: { params: { id: number } }) {
  const [book, setBook] = useState<IBook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
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
    if (!isOwner) {
      // Pengaman tambahan
      setError("You do not have permission to edit this book.");
      return;
    }
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin mengedit buku ini?",
    );
    if (!confirmed) return;
    setLoading(true);
    try {
      if (book) {
        const token = getAuthToken();
        await putBookInDB(book, token);
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to edit book");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      // Pengaman tambahan
      setError("You do not have permission to delete this book.");
      return;
    }
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus buku ini?",
    );
    if (!confirmed) return;
    setLoadingDelete(true);
    try {
      if (book) {
        const token = getAuthToken();
        await deleteBookInDB(params.id, token);
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete book");
    } finally {
      setLoadingDelete(false);
    }
  };

  useEffect(() => {
    const fetchBookAndCheckOwnership = async () => {
      const token = getAuthToken(); // Ambil token
      const fetchedBookResult = await getBookFromDB(params.id, token); // Kirim token

      if (
        fetchedBookResult.status !== 200 ||
        !fetchedBookResult.data ||
        fetchedBookResult.data.message === "not found"
      ) {
        router.push("/");
        return;
      }

      const fetchedBook: IBook = fetchedBookResult.data;
      const currentUserId = getUserIdFromToken();

      if (fetchedBook.isPrivate && fetchedBook.ownerId !== currentUserId) {
        router.push("/");
        return;
      }

      if (fetchedBook.ownerId === currentUserId) {
        setIsOwner(true);
      }

      setBook(fetchedBook);
    };

    fetchBookAndCheckOwnership();
  }, [params.id, router]);
  // Tampilan read-only untuk non-pemilik (menggunakan form yang di-disable)
  const readOnlyForm = (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="my-10 w-full max-w-lg mx-auto p-6 rounded-2xl bg-white/40 dark:bg-white/10 border border-white/30 dark:border-white/20 backdrop-blur-md shadow-xl transition-all"
    >
      <h2 className="text-3xl font-bold mb-6 text-center">{book?.title}</h2>
      <div className="mb-4">
        <label className="block font-semibold text-gray-800 dark:text-gray-200">
          Author
        </label>
        <p className="w-full p-3 mt-2 ...">{book?.author}</p>
      </div>
      <div className="mb-4">
        <label className="block font-semibold text-gray-800 dark:text-gray-200">
          Price
        </label>
        <p className="w-full p-3 mt-2 ...">
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
          }).format(book?.price || 0)}
        </p>
      </div>
      <div className="mb-6">
        <label className="block font-semibold text-gray-800 dark:text-gray-200">
          Description
        </label>
        <p className="w-full p-3 mt-2 ...">{book?.description}</p>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 dark:from-zinc-900 dark:to-zinc-800 transition-colors duration-300">
      <Header />
      {error && (
        <div className="my-5 w-full max-w-lg mx-auto bg-red-400 text-white p-4 rounded-lg shadow-md">
          {error}
        </div>
      )}
      <AuthRequiredWrapper>
        {!book ? (
          <div className="text-center text-gray-500 py-20">Loading...</div>
        ) : isOwner ? (
          // Jika user adalah pemilik, tampilkan form edit seperti kode asli Anda
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

              {/* Toggle Private */}
              <div className="mb-6 flex items-center justify-between">
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  Keep this book private?
                </span>
                <Toggle
                  enabled={book.isPrivate ?? false}
                  setEnabled={(value) =>
                    setBook((prev) =>
                      prev ? { ...prev, isPrivate: value } : null,
                    )
                  }
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
          // Jika bukan pemilik, tampilkan detail read-only
          readOnlyForm
        )}
      </AuthRequiredWrapper>
    </div>
  );
}

export default BookPage;
