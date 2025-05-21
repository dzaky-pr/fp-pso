"use client";

import { useEffect, useState } from "react";
import { IBook } from "@/types";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import {
  deleteBookInDB,
  getBookFromDB,
  putBookInDB,
} from "@/actions/actions";

function BookPage({ params }: { params: { id: number } }) {
  const [book, setBook] = useState<IBook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (book) {
      const newBook: IBook = {
        ...book,
        [name]:
          name === "price" ? parseFloat(value) : value,
      };
      setBook(newBook);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (book) {
        await putBookInDB(book);
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.log(error);
      setError("Failed to edit book");
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (book) {
        await deleteBookInDB(params.id);
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.log(error);
      setError("Failed to delete book");
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
    <div className="min-h-screen">
      <Header />
      {error && (
        <div className="my-5 w-full max-w-lg mx-auto bg-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}
      {book ? (
        <div>
          <form
            onSubmit={handleEditSubmit}
            className="my-5 w-full max-w-lg mx-auto"
          >
            <h2 className="text-2xl font-bold mb-6">
              Edit Book
            </h2>

            {/* title */}
            <div className="mb-4">
              <label
                htmlFor="title"
                className="block font-semibold"
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
                className="w-full p-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-text-color"
                required
              />
            </div>

            {/* author */}
            <div className="mb-4">
              <label
                htmlFor="author"
                className="block font-semibold"
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
                className="w-full p-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-text-color"
                required
              />
            </div>

            {/* price */}
            <div className="mb-4">
              <label
                htmlFor="price"
                className="block font-semibold"
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
                placeholder="Enter Book Price"
                className="w-full p-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-text-color"
                required
              />
            </div>

            {/* description */}
            <div className="mb-4">
              <label
                htmlFor="description"
                className="block font-semibold"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={book.description}
                onChange={handleChange}
                placeholder="Enter Book Description"
                className="w-full p-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-text-color"
                rows={4}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-btn-color text-white rounded hover:bg-text-hover transition duration-200"
            >
              Edit Book
            </button>
          </form>
          <form
            onSubmit={handleDeleteSubmit}
            className="my-5 w-full max-w-lg mx-auto"
          >
            <button
              type="submit"
              className="w-full py-3 bg-red-700 text-white rounded hover:bg-red-600 transition duration-200"
            >
              Delete Book
            </button>
          </form>
        </div>
      ) : (
        <div> loading ...</div>
      )}
    </div>
  );
}

export default BookPage;
