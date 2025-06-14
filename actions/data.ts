// dzaky-pr/fp-pso/fp-pso-9738172cec4b52a89eaa97d40be888bf59610291/actions/data.ts

import "server-only";
import type { IBook } from "@/types";
import { getAuthToken } from "./auth"; // --- TAMBAHKAN INI ---

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

    // --- PROTEKSI API - Dapatkan Token ---
    const token = getAuthToken();
    if (!token) {
      // Jika tidak ada token, throw error yang akan ditangkap di frontend
      throw new Error(
        "Authentication required: Please log in to add/edit books.",
      );
    }
    // --- AKHIR PROTEKSI API ---

    const response = await fetch(`${process.env.AWS_API_URL}/books`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // --- TAMBAHKAN HEADER INI ---
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json(); // Ambil pesan error dari respons API
      throw new Error(
        errorData.error ||
          `Failed to create/update the Book: ${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to create/update the Book:", errorMessage);
    // Lempar ulang error dengan pesan yang lebih informatif
    throw new Error("Failed to create/update the Book: " + errorMessage);
  }
};

export const deleteBook = async (id: number) => {
  try {
    if (!process.env.AWS_API_URL) {
      throw new Error("AWS_API_URL not configured");
    }

    // --- PROTEKSI API - Dapatkan Token ---
    const token = getAuthToken();
    if (!token) {
      throw new Error(
        "Authentication required: Please log in to delete books.",
      );
    }
    // --- AKHIR PROTEKSI API ---

    const response = await fetch(`${process.env.AWS_API_URL}/books/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // --- TAMBAHKAN HEADER INI ---
      },
    });

    if (!response.ok) {
      const errorData = await response.json(); // Ambil pesan error dari respons API
      throw new Error(
        errorData.error || `Failed to delete the Book: ${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to delete the Book:", errorMessage);
    throw new Error("Failed to delete the Book: " + errorMessage);
  }
};
