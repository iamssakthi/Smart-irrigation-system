/**
 * shared.js — Common utilities loaded globally via base.html.
 * Must be included BEFORE any page-specific script.
 */

/**
 * Fetch a JSON endpoint with standard error handling.
 * Throws an Error with the server's error message on non-2xx responses.
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status}).`);
    }
    return data;
}
