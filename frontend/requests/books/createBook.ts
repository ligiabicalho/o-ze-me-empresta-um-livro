"use server"

import { env } from "@/common/config/env";
import { Book } from "@/declarations";
import { revalidateTag } from "next/cache";

interface AddBookParams {
  title: string;
  authorId: string;
  publisher: string;
}

export const fetchBookInfo = async (ISBN: string): Promise<any> => {
    try {
      // `https://openlibrary.org/search.json?q=${ISBN}`
      // `https://openlibrary.org/api/books?bibkeys=ISBN:${ISBN}&jscmd=details&format=json`
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${ISBN}`, {
        method: 'GET',
      });
      if(response.ok){
        const data = await response.json();
        console.log('data book', data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching book info:', error);
      throw new Error("Failed to fetch book info", { cause: error });
    }
  };

export const createBook = async (bookData: AddBookParams): Promise<Book | undefined> => {
  try {
    const response = await fetch(`${env.API_URL}/api/books`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookData),
    });
    if (!response.ok) {
      throw new Error("Failed to create book", { cause: response.statusText });
    }
    
    revalidateTag('books');

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating book:", error);
    throw new Error("Failed to create book", { cause: error });
  } 
}
