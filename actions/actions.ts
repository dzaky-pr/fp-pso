"use server";

import type { IBook } from "@/types";
import {
  deleteBook,
  getBook,
  getBooks as getBooksFromData,
  getMyBooks as getMyBooksFromData,
  putBook,
} from "./data";

export const getBookFromDB = async (id: number, token: string | null) => {
  const res = await getBook(id, token);
  return res;
};

export const putBookInDB = async (data: IBook, token: string | null) => {
  const res = await putBook(data, token);
  return res;
};

export const deleteBookInDB = async (id: number, token: string | null) => {
  const res = await deleteBook(id, token);
  return res;
};

export const getMyBooks = async (token: string | null) => {
  const res = await getMyBooksFromData(token);
  return res;
};

export const getBooks = async (token: string | null) => {
  const res = await getBooksFromData(token);
  return res;
};
