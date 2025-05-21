import Link from "next/link";

function Header() {
  return (
    <header className="flex justify-between items-center py-6 px-10 shadow-md">
      <h1 className="text-3xl font-bold">Book Library</h1>
      <nav>
        <ul className="flex space-x-6">
          <li className="flex items-center">
            <Link
              className="hover:text-text-hover"
              href={"/"}
            >
              Home
            </Link>
          </li>
          <li>
            <button className="py-2 px-4 bg-btn-color text-white rounded hover:bg-text-hover transition duration-200">
              <Link href={"/add"}>Add Book</Link>
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
