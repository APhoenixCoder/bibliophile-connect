import fetch from "node-fetch";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Sample books that typically don't have descriptions in the initial dataset
const BOOKS_NEEDING_DESCRIPTIONS = [
  { id: 1, title: "The Midnight Library", author: "Matt Haig" },
  { id: 2, title: "Project Hail Mary", author: "Andy Weir" },
  { id: 3, title: "Fourth Wing", author: "Rebecca Yarros" },
  { id: 4, title: "Iron Widow", author: "Gideon Defoe" },
  { id: 5, title: "Legendborn", author: "Tracy Dlem" },
];

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
  console.log("[v0] Generating book descriptions...");

  for (const book of BOOKS_NEEDING_DESCRIPTIONS) {
    const description = await generateDescription(book.title, book.author);
    if (description) {
      // Escape single quotes for SQL
      const escapedDesc = description.replace(/'/g, "''");
      console.log(
        `UPDATE books SET description = '${escapedDesc}' WHERE LOWER(title) = '${book.title.toLowerCase()}' AND LOWER(author) = '${book.author.toLowerCase()}';`
      );
    }
    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("[v0] Done generating descriptions!");
}

main();
