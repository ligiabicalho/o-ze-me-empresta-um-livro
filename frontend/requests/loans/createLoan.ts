export const createLoan = async (bookId: string): Promise<Loan | undefined> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/loans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookId }),
    });
    if (!response.ok) {
      throw new Error("Failed to create loan", { cause: response.statusText });
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating loan:", error);
  } 
}
