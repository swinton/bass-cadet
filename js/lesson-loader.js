/**
 * Fetches and parses a lesson JSON file from the given URL.
 * @param {string} url - Path to the lesson JSON file.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the fetch.
 * @returns {Promise<object>} Parsed lesson data.
 */
export async function loadLesson(url, signal) {
  const response = await fetch(url, signal ? { signal } : undefined);
  if (!response.ok) throw new Error(`Failed to load lesson: ${url}`);
  return response.json();
}
