/**
 * GitHub Data Sync Module
 * Fetches and parses skills data from openclaw/skills repository
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dirname, 'skills-cache.json');

const GITHUB_API = 'https://api.github.com';
const REPO_OWNER = 'openclaw';
const REPO_NAME = 'skills';
const SKILLS_PATH = 'skills';

// Rate limiting helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Make authenticated GitHub API request
 */
async function githubFetch(url, token = null) {
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ClawHub-Clone'
    };

    if (token) {
        headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
        if (response.status === 403) {
            const remaining = response.headers.get('X-RateLimit-Remaining');
            const reset = response.headers.get('X-RateLimit-Reset');
            throw new Error(`Rate limited. Remaining: ${remaining}, Reset: ${new Date(reset * 1000).toISOString()}`);
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch raw file content from GitHub
 */
async function fetchRawFile(filePath, token = null) {
    const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${filePath}`;
    const headers = { 'User-Agent': 'ClawHub-Clone' };

    if (token) {
        headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
        return null;
    }

    return response.text();
}

/**
 * Parse SKILL.md YAML frontmatter
 */
function parseSkillMd(content) {
    if (!content) return null;

    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
        return { body: content };
    }

    const frontmatter = frontmatterMatch[1];
    const body = content.slice(frontmatterMatch[0].length).trim();

    // Simple YAML parser for our needs
    const metadata = {};
    const lines = frontmatter.split('\n');
    let currentKey = null;

    for (const line of lines) {
        const keyMatch = line.match(/^(\w+):\s*(.*)$/);
        if (keyMatch) {
            currentKey = keyMatch[1];
            const value = keyMatch[2].trim();
            if (value && !value.startsWith('{')) {
                metadata[currentKey] = value.replace(/^["']|["']$/g, '');
            }
        }
    }

    return { ...metadata, body };
}

/**
 * Fetch all skills from repository
 */
export async function fetchAllSkills(token = null, progressCallback = null) {
    const skills = [];
    let processed = 0;

    console.log('📦 Fetching user directories...');

    // Get all user directories
    const usersUrl = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${SKILLS_PATH}`;
    const userDirs = await githubFetch(usersUrl, token);

    const totalUsers = userDirs.filter(d => d.type === 'dir').length;
    console.log(`📁 Found ${totalUsers} user directories`);

    for (const userDir of userDirs) {
        if (userDir.type !== 'dir') continue;

        const username = userDir.name;

        try {
            // Get skills for this user
            const userSkillsUrl = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${SKILLS_PATH}/${username}`;
            const skillDirs = await githubFetch(userSkillsUrl, token);

            for (const skillDir of skillDirs) {
                if (skillDir.type !== 'dir') continue;

                const skillSlug = skillDir.name;
                const skillPath = `${SKILLS_PATH}/${username}/${skillSlug}`;

                try {
                    // Fetch _meta.json
                    const metaJson = await fetchRawFile(`${skillPath}/_meta.json`, token);
                    const meta = metaJson ? JSON.parse(metaJson) : null;

                    // Fetch SKILL.md
                    const skillMd = await fetchRawFile(`${skillPath}/SKILL.md`, token);
                    const skillData = parseSkillMd(skillMd);

                    // Fetch README.md (optional)
                    const readme = await fetchRawFile(`${skillPath}/README.md`, token);

                    if (meta) {
                        skills.push({
                            id: `${username}/${skillSlug}`,
                            owner: username,
                            slug: skillSlug,
                            displayName: meta.displayName || skillData?.name || skillSlug,
                            description: skillData?.description || '',
                            version: meta.latest?.version || skillData?.version || '0.0.0',
                            publishedAt: meta.latest?.publishedAt || null,
                            commit: meta.latest?.commit || null,
                            history: meta.history || [],
                            readme: readme || null,
                            skillMd: skillMd || null,
                            body: skillData?.body || null
                        });
                    }

                    // Rate limiting: small delay between requests
                    await sleep(50);

                } catch (error) {
                    console.warn(`⚠️ Error fetching skill ${username}/${skillSlug}:`, error.message);
                }
            }

            processed++;
            if (progressCallback) {
                progressCallback(processed, totalUsers, username);
            }

            // Rate limiting: delay between users
            await sleep(100);

        } catch (error) {
            console.warn(`⚠️ Error fetching user ${username}:`, error.message);
        }
    }

    console.log(`✅ Fetched ${skills.length} skills`);
    return skills;
}

/**
 * Save skills to cache file
 */
export async function saveCache(skills) {
    const cache = {
        updatedAt: new Date().toISOString(),
        count: skills.length,
        skills
    };

    await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log(`💾 Saved ${skills.length} skills to cache`);
    return cache;
}

/**
 * Load skills from cache file
 */
export async function loadCache() {
    try {
        const content = await fs.readFile(CACHE_FILE, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.log('📭 No cache file found, returning empty cache');
        return { updatedAt: null, count: 0, skills: [] };
    }
}

/**
 * Full sync: fetch all skills and save to cache
 */
export async function fullSync(token = null) {
    console.log('🔄 Starting full sync...');
    const startTime = Date.now();

    const skills = await fetchAllSkills(token, (current, total, username) => {
        const percent = Math.round((current / total) * 100);
        process.stdout.write(`\r⏳ Progress: ${percent}% (${current}/${total}) - ${username}                    `);
    });

    console.log(''); // New line after progress

    const cache = await saveCache(skills);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`⏱️ Sync completed in ${duration}s`);

    return cache;
}

/**
 * Quick sync: fetch only recent updates
 * If no paths provided, fetches recent commits to detect updates
 */
export async function quickSync(paths = [], token = null) {
    console.log('⚡ Quick sync starting...');

    const cache = await loadCache();
    const skillsMap = new Map(cache.skills.map(s => [s.id, s]));
    let updatedCount = 0;

    // If no paths specified, get recent commits from GitHub API
    if (paths.length === 0) {
        console.log('🔍 Detecting recent updates from GitHub commits...');
        try {
            // Get recent commits (last 100)
            const commitsUrl = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=100`;
            const commits = await githubFetch(commitsUrl, token);

            // Extract changed files from commits
            const changedPaths = new Set();
            for (const commit of commits) {
                const commitDetail = await githubFetch(commit.url, token);
                if (commitDetail.files) {
                    for (const file of commitDetail.files) {
                        const filePath = file.filename;
                        // Only process files in skills directory
                        if (filePath.startsWith('skills/') &&
                            (filePath.endsWith('_meta.json') || filePath.endsWith('SKILL.md'))) {
                            const parts = filePath.split('/');
                            if (parts.length >= 3) {
                                changedPaths.add(`${parts[1]}/${parts[2]}`);
                            }
                        }
                    }
                }
                await sleep(100); // Rate limiting
            }

            paths = Array.from(changedPaths);
            console.log(`📦 Found ${paths.length} skills with recent updates`);

        } catch (error) {
            console.warn('⚠️  Could not fetch recent commits, skipping quick sync:', error.message);
            console.log('💡 Tip: Set GITHUB_TOKEN for better rate limits');
            return cache; // Return existing cache without updates
        }
    }

    // Update specific paths
    for (const skillPath of paths) {
        const parts = skillPath.includes('/') ? skillPath.split('/') : ['', skillPath.split('/')[0], skillPath.split('/')[1]];
        const username = parts[parts.length - 2] || parts[0];
        const skillSlug = parts[parts.length - 1] || parts[1];
        const fullPath = `${SKILLS_PATH}/${username}/${skillSlug}`;

        try {
            const metaJson = await fetchRawFile(`${fullPath}/_meta.json`, token);
            const meta = metaJson ? JSON.parse(metaJson) : null;

            const skillMd = await fetchRawFile(`${fullPath}/SKILL.md`, token);
            const skillData = parseSkillMd(skillMd);

            const readme = await fetchRawFile(`${fullPath}/README.md`, token);

            if (meta) {
                const id = `${username}/${skillSlug}`;
                skillsMap.set(id, {
                    id,
                    owner: username,
                    slug: skillSlug,
                    displayName: meta.displayName || skillData?.name || skillSlug,
                    description: skillData?.description || '',
                    version: meta.latest?.version || skillData?.version || '0.0.0',
                    publishedAt: meta.latest?.publishedAt || null,
                    commit: meta.latest?.commit || null,
                    history: meta.history || [],
                    readme: readme || null,
                    skillMd: skillMd || null,
                    body: skillData?.body || null
                });
                updatedCount++;
                console.log(`✅ Updated ${id}`);
            }

            await sleep(50); // Rate limiting
        } catch (error) {
            console.warn(`⚠️  Error updating ${username}/${skillSlug}:`, error.message);
        }
    }

    const skills = Array.from(skillsMap.values());
    const updatedCache = await saveCache(skills);

    console.log(`✅ Quick sync completed: ${updatedCount} skills updated`);
    return updatedCache;
}

export default {
    fetchAllSkills,
    loadCache,
    saveCache,
    fullSync,
    quickSync
};
