/**
 * Download Statistics Module
 * Manages skill download counts and statistics
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOADS_FILE = path.join(__dirname, 'downloads.json');

/**
 * Load download statistics from JSON file
 */
export async function loadDownloads() {
    try {
        const data = await fs.readFile(DOWNLOADS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Return empty object if file doesn't exist
        return {};
    }
}

/**
 * Save download statistics to JSON file
 */
export async function saveDownloads(downloads) {
    await fs.writeFile(DOWNLOADS_FILE, JSON.stringify(downloads, null, 2));
}

/**
 * Increment download count for a skill
 * @param {string} skillId - Format: "owner/slug"
 * @returns {number} New download count
 */
export async function incrementDownload(skillId) {
    const downloads = await loadDownloads();

    if (!downloads[skillId]) {
        downloads[skillId] = {
            count: 0,
            lastDownload: null,
            history: []
        };
    }

    downloads[skillId].count++;
    downloads[skillId].lastDownload = new Date().toISOString();

    await saveDownloads(downloads);
    return downloads[skillId].count;
}

/**
 * Get download statistics for a specific skill
 * @param {string} skillId - Format: "owner/slug"
 * @returns {object} Download stats
 */
export async function getDownloadStats(skillId) {
    const downloads = await loadDownloads();
    return downloads[skillId] || { count: 0, lastDownload: null };
}
