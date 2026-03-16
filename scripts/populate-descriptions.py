import os
import psycopg2
import requests
import time

# Get database connection details from environment
database_url = os.environ.get("NEON_DATABASE_URL")
groq_api_key = os.environ.get("GROQ_API_KEY")

def generate_description(title, author):
    """Generate a book description using Groq API"""
    try:
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "mixtral-8x7b-32768",
            "max_tokens": 150,
            "messages": [
                {
                    "role": "user",
                    "content": f'Write a brief, engaging book description (1-2 sentences) for "{title}" by {author}. Make it compelling and suitable for a book recommendation. Return only the description without any introduction.'
                }
            ]
        }
        
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if result.get("choices") and len(result["choices"]) > 0:
                description = result["choices"][0]["message"]["content"].strip()
                return description
    except Exception as e:
        print(f"[v0] Error generating description for '{title}': {str(e)}")
    
    return None

def update_book_descriptions():
    """Fetch books without descriptions and generate them"""
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        print("[v0] Fetching books without descriptions...")
        
        # Get books without descriptions
        cur.execute("SELECT id, title, author FROM books WHERE description IS NULL OR description = '' LIMIT 100")
        books = cur.fetchall()
        
        print(f"[v0] Found {len(books)} books without descriptions")
        
        updated = 0
        for book_id, title, author in books:
            print(f"[v0] Generating description for: {title} by {author}")
            
            description = generate_description(title, author)
            
            if description:
                cur.execute("UPDATE books SET description = %s WHERE id = %s", (description, book_id))
                conn.commit()
                updated += 1
                print(f"[v0] Updated: {title}")
            
            # Rate limiting
            time.sleep(0.5)
        
        print(f"[v0] Successfully updated {updated} books with descriptions")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"[v0] Error during population: {str(e)}")

if __name__ == "__main__":
    update_book_descriptions()
