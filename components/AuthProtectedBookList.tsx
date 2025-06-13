"use client";

import { isAuthenticated } from "@/actions/auth";
import BookList from "@/components/BookList";
import type { IBook } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function AuthProtectedBookList({ initialBooks }: { initialBooks: IBook[] }) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log("[AuthProtectedBookList] useEffect triggered on client.");
      const authStatus = isAuthenticated();
      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log("[AuthProtectedBookList] Is authenticated:", authStatus);

      if (!authStatus) {
        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log(
          "[AuthProtectedBookList] Redirecting to /login immediately.",
        );
        router.push("/login");
      } else {
        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log(
          "[AuthProtectedBookList] User authenticated, displaying content.",
        );
      }
    }
  }, [router, isClient]); // Depend pada router dan isClient

  if (!isClient || !isAuthenticated()) {
    return null;
  }

  return <BookList books={initialBooks} />;
}

export default AuthProtectedBookList;
