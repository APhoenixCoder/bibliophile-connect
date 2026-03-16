import { neon } from "@neondatabase/serverless";
import Groq from "groq-sdk";

const sql = neon(process.env.NEON_DATABASE_URL);
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function generateDescription(title, author) {
  try {
    const message = await groq.messages.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `Write a brief, engaging book description (1-2 sentences) for "${title}" by ${author}. Make it compelling and suitable for a book recommendation. Return only the description without any introduction.`,
        },
      ],
    });

    const description =
      message.content[0].type === "text" ? message.content[0].text.trim() : null;
    return description;
  } catch (error) {
    console.log("[v0] Error generating description for", title, ":", error.message);
    return null;
  }
}

async function populateDescriptions() {
  try {
    console.log("[v0] Starting description population...");

    // Get all books without descriptions
    const booksWithoutDescriptions = await sql.query(
      "SELECT id, title, author FROM books WHERE description IS NULL OR description = '' LIMIT 100"
    );

    console.log(
      `[v0] Found ${booksWithoutDescriptions.length} books without descriptions`
    );

    let updated = 0;
    for (const book of booksWithoutDescriptions) {
      console.log(`[v0] Generating description for: ${book.title} by ${book.author}`);

      const description = await generateDescription(book.title, book.author);

      if (description) {
        await sql.query("UPDATE books SET description = $1 WHERE id = $2", [
          description,
          book.id,
        ]);
        updated++;
        console.log(`[v0] Updated: ${book.title}`);
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`[v0] Successfully updated ${updated} books with descriptions`);
  } catch (error) {
    console.error("[v0] Error during population:", error);
  }
}

populateDescriptions();
