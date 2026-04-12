/**
 * Fetches and parses a lesson JSON file from the given URL.
 * @param {string} url - Path to the lesson JSON file.
 * @returns {Promise<object>} Parsed lesson data.
 */
export async function loadLesson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load lesson: ${url}`);
  return response.json();
}
