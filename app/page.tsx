import { getBooks } from "@/actions/data";
import BookCard from "@/components/BookCard";
import Header from "@/components/Header";
import { IBook } from "@/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const books: IBook[] = (await getBooks()).data;

  return (
    <div className="min-h-screen">
      <Header />

      <main className="py-12 px-8">
        <h2 className="text-4xl font-semibold mb-8">
          Explore Our Collections
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {books.map((book, idx) => (
            <BookCard key={idx} book={book} />
          ))}
        </div>
      </main>
    </div>
  );
}
