import { neon } from "@neondatabase/serverless";
import fetch from "node-fetch";

const sql = neon(process.env.NEON_DATABASE_URL);

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function generateDescription(title, author) {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "user",
            content: `Generate a brief, engaging 2-3 sentence book description/blurb for the book titled "${title}" by ${author}. Make it compelling and similar to what you'd find on a book jacket. Return only the description, nothing else.`,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content.trim();
    }
    return null;
  } catch (error) {
    console.log("[v0] Error generating description:", error.message);
    return null;
  }
}

async function main() {
  try {
    console.log("[v0] Fetching books without descriptions...");

    const result = await sql`SELECT id, title, author FROM books WHERE description IS NULL OR description = '' ORDER BY title LIMIT 200`;

    const books = result;
    console.log(`[v0] Found ${books.length} books without descriptions`);

    let updated = 0;
    const updates = [];

    for (const book of books) {
      console.log(`[v0] Generating description for: ${book.title} by ${book.author}`);
      const description = await generateDescription(book.title, book.author);

      if (description) {
        updates.push({ id: book.id, description });
        updated++;
        console.log(`[v0] Generated: ${book.title}`);
      }

      // Rate limiting - wait a bit between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`[v0] Generated ${updated} descriptions, now updating database...`);

    // Update all descriptions in batch
    for (const update of updates) {
      await sql`UPDATE books SET description = ${update.description} WHERE id = ${update.id}`;
    }

    console.log(`[v0] Successfully updated ${updated} books with descriptions!`);
  } catch (error) {
    console.error("[v0] Error:", error);
  }
}

main();
