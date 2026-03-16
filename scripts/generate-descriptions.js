#!/usr/bin/env node

async function generateAllDescriptions() {
  try {
    let totalUpdated = 0
    let iteration = 0
    const maxIterations = 20

    while (iteration < maxIterations) {
      iteration++
      console.log(`[v0] Iteration ${iteration}: Generating descriptions...`)

      const response = await fetch("http://localhost:3000/api/books/generate-descriptions", {
        method: "POST",
      })

      const data = await response.json()
      console.log(`[v0] Response:`, data)

      const updated = data.updated || 0
      totalUpdated += updated

      if (updated === 0) {
        console.log(`[v0] All books now have descriptions!`)
        break
      }

      // Wait a bit before next iteration to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    console.log(`[v0] Total books updated: ${totalUpdated}`)
  } catch (error) {
    console.error("[v0] Error:", error)
  }
}

generateAllDescriptions()
