import "server-only";
import type { IBook } from "@/types";

export const getBooks = async () => {
  try {
    // Check if we're in build time and API URL is not available
    if (!process.env.AWS_API_URL) {
      console.warn("AWS_API_URL not set, returning empty data for build");
      return { data: [], status: 200 };
    }

    const response = await fetch(`${process.env.AWS_API_URL}/books`, {
      cache: "no-store",
    }).then(async (res) => {
      const status = res.status;
      const data = await res.json();
      return { data, status };
    });
    return response;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.warn("Failed to fetch Books, returning empty data:", errorMessage);
    // Return empty data instead of throwing during build
    return { data: [], status: 500 };
  }
};

export const getBook = async (id: number) => {
  try {
    // Check if we're in build time and API URL is not available
    if (!process.env.AWS_API_URL) {
      console.warn("AWS_API_URL not set, returning empty data for build");
      return { data: { message: "not found" }, status: 404 };
    }

    const response = await fetch(`${process.env.AWS_API_URL}/books/${id}`).then(
      async (res) => {
        const status = res.status;
        const data = await res.json();
        return { data, status };
      },
    );
    return response;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.warn("Failed to fetch Book, returning not found:", errorMessage);
    // Return not found instead of throwing during build
    return { data: { message: "not found" }, status: 404 };
  }
};

export const putBook = async (data: IBook) => {
  try {
    if (!process.env.AWS_API_URL) {
      throw new Error("AWS_API_URL not configured");
    }

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
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to create the Book:", errorMessage);
    throw new Error("Failed to create the Book.");
  }
};

export const deleteBook = async (id: number) => {
  try {
    if (!process.env.AWS_API_URL) {
      throw new Error("AWS_API_URL not configured");
    }

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
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to delete the Book:", errorMessage);
    throw new Error("Failed to delete the Book.");
  }
};
