"use client";

import { putBookInDB } from "@/actions/actions";
import Header from "@/components/Header";
import { IBook } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

function AddPage() {
  const [book, setBook] = useState<IBook>({
    id: Math.floor(1000 + Math.random() * 9000),
    title: "",
    author: "",
    price: 0,
    description: "",
  });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await putBookInDB(book);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.log(error);
      setError("Failed to edit book");
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      {error && (
        <div className="my-5 w-full max-w-lg mx-auto bg-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="my-5 w-full max-w-lg mx-auto"
      >
        <h2 className="text-2xl font-bold mb-6">
          Add Book
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
          Add Book
        </button>
      </form>
    </div>
  );
}

export default AddPage;
