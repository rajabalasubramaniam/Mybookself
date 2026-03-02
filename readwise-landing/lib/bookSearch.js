import axios from "axios";

export async function searchBooksByISBN(isbn) {
    const errors = [];
    
    // Try Google Books first (primary)
    try {
        const googleResult = await searchGoogleBooks(isbn);
        if (googleResult) return { ...googleResult, source: 'Google Books' };
    } catch (error) {
        errors.push("Google Books: " + (error.response?.data?.error?.message || error.message));
        console.log("Google Books failed:", error.message);
    }

    // Try Open Library second (backup)
    try {
        const openLibResult = await searchOpenLibrary(isbn);
        if (openLibResult) return { ...openLibResult, source: 'Open Library' };
    } catch (error) {
        errors.push("Open Library: " + error.message);
        console.log("Open Library failed:", error.message);
    }

    // Try Gutendex last (public domain)
    try {
        const gutendexResult = await searchGutendex(isbn);
        if (gutendexResult) return { ...gutendexResult, source: 'Gutendex' };
    } catch (error) {
        errors.push("Gutendex: " + error.message);
        console.log("Gutendex failed:", error.message);
    }
    throw new Error(`Could not find book. Tried: ${errors.join(" → ")}`);
}

async function searchGoogleBooks(isbn) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;
    const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`
    );

    if (response.data.items?.[0]) {
        const book = response.data.items[0].volumeInfo;
        return {
            title: book.title,
            author: book.authors?.join(', '),
            isbn: isbn,
            cover_url: book.imageLinks?.thumbnail?.replace('http:', 'https:'),
            total_pages: book.pageCount,
            description: book.description,
        };
    }
    return null;
}

async function searchOpenLibrary(isbn) {
    const response = await axios.get(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    );

    const bookData = response.data[`ISBN:${isbn}`];
    if (bookData) {
        return {
            title: bookData.title,
            author: bookData.authors?.map(a => a.name).join(', '),
            isbn: isbn,
            cover_url: bookData.cover?.large || bookData.cover?.medium,
            total_pages: bookData.number_of_pages,
            description: bookData.notes || bookData.description || `A book by ${bookData.authors?.[0]?.name}`,
        };
    }
    return null;
}

async function searchGutendex(isbn) {
    const response = await axios.get(
        `https://gutendex.com/books?search=${isbn}`
    );

    if (response.data.results?.[0]) {
        const book = response.data.results[0];
        return {
            title: book.title,
            author: book.authors?.map(a => a.name).join(', '),
            isbn: isbn,
            cover_url: book.formats['image/jpeg'],
            total_pages: book.pages,
            description: `A public domain book by ${book.authors?.[0]?.name || 'unknown author'}`,
        };
    }
    return null;
}