import "server-only";
import type { IBook } from "@/types";

export const getBooks = async () => {
  try {
    const response = await fetch(`${process.env.AWS_API_URL}/books`, {
      cache: "no-store",
    }).then(async (res) => {
      const status = res.status;
      const data = await res.json();
      return { data, status };
    });
    return response;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    throw new Error("Failed to fetch Books.");
  }
};

export const getBook = async (id: number) => {
  try {
    const response = await fetch(`${process.env.AWS_API_URL}/books/${id}`).then(
      async (res) => {
        const status = res.status;
        const data = await res.json();
        return { data, status };
      },
    );
    return response;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    throw new Error("Failed to fetch Book.");
  }
};

export const putBook = async (data: IBook) => {
  try {
    const response = await fetch(`${process.env.AWS_API_URL}/books`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create the Book ${response.status}`);
    }

    return await response.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    throw new Error("Failed to create the Book.");
  }
};

export const deleteBook = async (id: number) => {
  try {
    const response = await fetch(`${process.env.AWS_API_URL}/books/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete the Book ${response.status}`);
    }

    return await response.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    throw new Error("Failed to delete the Book.");
  }
};
