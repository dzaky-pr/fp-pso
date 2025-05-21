"use server";

import { IBook } from "@/types";
import { deleteBook, getBook, putBook } from "./data";

export const getBookFromDB = async (id: number) => {
  const res = await getBook(id);
  return res;
};

export const putBookInDB = async (data: IBook) => {
  const res = await putBook(data);
  return res;
};

export const deleteBookInDB = async (id: number) => {
  const res = await deleteBook(id);
  return res;
};
