import axios from "axios";

export async function searchBooksByISBN(isbn) {
    const errors = [];
    
    // Try Open Library first (primary)
    try {
        const openLibResult = await searchOpenLibrary(isbn);
        if (openLibResult) return { ...openLibResult, source: 'Open Library' };
    } catch (error) {
        errors.push("Open Library: " + error.message);
        console.log("Open Library failed:", error.message);
    }

    // Try Gutendex as backup (public domain)
    try {
        const gutendexResult = await searchGutendex(isbn);
        if (gutendexResult) return { ...gutendexResult, source: 'Gutendex (Public Domain)' };
    } catch (error) {
        errors.push("Gutendex: " + error.message);
        console.log("Gutendex failed:", error.message);
    }

    // Only show error if ALL APIs failed
    throw new Error(`Could not find book. Tried: ${errors.join(" → ")}`);
}

async function searchOpenLibrary(isbn) {
    const response = await axios.get(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
        { timeout: 5000 } // 5 second timeout
    );

    const bookData = response.data[`ISBN:${isbn}`];
    if (bookData) {
        return {
            title: bookData.title,
            author: bookData.authors?.map(a => a.name).join(', '),
            isbn: isbn,
            cover_url: bookData.cover?.large || bookData.cover?.medium,
            total_pages: bookData.number_of_pages,
            description: bookData.notes || bookData.description || `A book by ${bookData.authors?.[0]?.name || 'unknown author'}`,
        };
    }
    return null;
}

async function searchGutendex(isbn) {
    const response = await axios.get(
        `https://gutendex.com/books?search=${isbn}`,
        { timeout: 5000 }
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

// Optional: Search by title/author for manual entry
export async function searchBooksByTitle(query) {
    try {
        const response = await axios.get(
            `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`,
            { timeout: 5000 }
        );

        if (response.data.docs) {
            return response.data.docs.map(book => ({
                title: book.title,
                author: book.author_name?.join(', '),
                isbn: book.isbn?.[0],
                cover_url: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
                total_pages: book.number_of_pages_median,
                first_publish_year: book.first_publish_year,
                source: 'Open Library'
            }));
        }
        return [];
    } catch (error) {
        console.error('Title search failed:', error);
        return [];
    }
}