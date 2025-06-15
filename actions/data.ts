"use server";

import type { IBook } from "@/types";

export const getBooks = async (token: string | null) => {
  try {
    if (!process.env.AWS_API_URL) {
      console.warn("AWS_API_URL not set, returning empty data for build");
      return { data: [], status: 200 };
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${process.env.AWS_API_URL}/books`, {
      cache: "no-store",
      headers: headers,
    });

    const data = await response.json();
    return { data, status: response.status };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.warn("Failed to fetch Books, returning empty data:", errorMessage);
    return { data: [], status: 500 };
  }
};

export const getMyBooks = async (token: string | null) => {
  try {
    if (!process.env.AWS_API_URL) {
      console.warn("AWS_API_URL not set, returning empty data.");
      return { data: [], status: 200 };
    }

    if (!token) {
      return { data: { error: "Authentication required" }, status: 401 };
    }

    const response = await fetch(`${process.env.AWS_API_URL}/my-books`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return { data, status: response.status };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.warn(
      "Failed to fetch My Books, returning empty data:",
      errorMessage,
    );
    return { data: [], status: 500 };
  }
};

export const getBook = async (id: number, token: string | null) => {
  try {
    if (!process.env.AWS_API_URL) {
      return { data: { message: "not found" }, status: 404 };
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${process.env.AWS_API_URL}/books/${id}`, {
      headers: headers,
    });

    const data = await response.json();
    return { data, status: response.status };
  } catch (error) {
    console.warn("Failed to fetch Book:", error);
    return { data: { message: "not found" }, status: 404 };
  }
};

export const putBook = async (data: IBook, token: string | null) => {
  try {
    if (!process.env.AWS_API_URL) {
      throw new Error("AWS_API_URL not configured");
    }

    if (!token) {
      throw new Error(
        "Authentication required: Please log in to add/edit books.",
      );
    }

    const response = await fetch(`${process.env.AWS_API_URL}/books`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error ||
          `Failed to create/update the Book: ${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error("Failed to create/update the Book: " + errorMessage);
  }
};

export const deleteBook = async (id: number, token: string | null) => {
  try {
    if (!process.env.AWS_API_URL) {
      throw new Error("AWS_API_URL not configured");
    }

    if (!token) {
      throw new Error(
        "Authentication required: Please log in to delete books.",
      );
    }

    const response = await fetch(`${process.env.AWS_API_URL}/books/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Failed to delete the Book: ${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error("Failed to delete the Book: " + errorMessage);
  }
};
