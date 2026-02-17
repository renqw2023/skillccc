/**
 * Express API Server
 * Provides REST API for skills data
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import { loadCache, fullSync, quickSync } from './github-sync.js';
import { incrementDownload, loadDownloads, getDownloadStats } from './downloads.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// GitHub Repository constants
const REPO_OWNER = 'openclaw';
const REPO_NAME = 'skills';

// In-memory cache
let skillsCache = null;
let lastCacheLoad = null;

/**
 * Load or refresh cache
 */
async function getSkillsCache(forceRefresh = false) {
    const now = Date.now();
    const cacheAge = lastCacheLoad ? now - lastCacheLoad : Infinity;

    // Refresh cache if older than 5 minutes or forced
    if (!skillsCache || forceRefresh || cacheAge > 5 * 60 * 1000) {
        skillsCache = await loadCache();
        lastCacheLoad = now;
    }

    return skillsCache;
}

/**
 * Search and filter skills
 * @param {Array} skills - All skills
 * @param {Object} options - Filter options
 */
function filterSkills(skills, { query = '', page = 1, limit = 24, sort = 'newest', order = 'desc', highlighted = false, downloads = {} } = {}) {
    let filtered = [...skills];

    // Merge download counts
    filtered = filtered.map(s => ({
        ...s,
        downloadCount: downloads[s.id]?.count || 0,
        versionCount: (s.history || []).length
    }));

    // Highlighted filter: only skills with downloads
    if (highlighted) {
        filtered = filtered.filter(s => s.downloadCount > 0);
    }

    // Search filter
    if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(s =>
            s.displayName?.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q) ||
            s.owner?.toLowerCase().includes(q) ||
            s.slug?.toLowerCase().includes(q)
        );
    }

    // Sort
    const dir = order === 'asc' ? 1 : -1;
    switch (sort) {
        case 'downloads':
            filtered.sort((a, b) => dir * ((b.downloadCount || 0) - (a.downloadCount || 0)));
            break;
        case 'name':
            filtered.sort((a, b) => dir * (a.displayName || a.slug || '').localeCompare(b.displayName || b.slug || ''));
            break;
        case 'updated':
            filtered.sort((a, b) => dir * ((b.publishedAt || 0) - (a.publishedAt || 0)));
            break;
        case 'newest':
        default:
            filtered.sort((a, b) => dir * ((b.publishedAt || 0) - (a.publishedAt || 0)));
            break;
    }

    // Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);

    return {
        skills: paginated,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    };
}

// ============= API Routes =============

/**
 * GET /api/skills
 * Get all skills with optional search and pagination
 * Query params: search, page, limit
 */
app.get('/api/skills', async (req, res) => {
    try {
        const { search = '', page = 1, limit = 24, sort = 'newest', order = 'desc', highlighted = 'false' } = req.query;
        const cache = await getSkillsCache();
        const downloads = await loadDownloads();

        const result = filterSkills(
            cache.skills || [],
            {
                query: search,
                page: parseInt(page),
                limit: parseInt(limit),
                sort,
                order,
                highlighted: highlighted === 'true',
                downloads
            }
        );

        res.json({
            success: true,
            updatedAt: cache.updatedAt,
            ...result
        });
    } catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/skills/:owner/:slug
 * Get single skill by owner and slug
 */
app.get('/api/skills/:owner/:slug', async (req, res) => {
    try {
        const { owner, slug } = req.params;
        const cache = await getSkillsCache();

        const skill = (cache.skills || []).find(
            s => s.owner === owner && s.slug === slug
        );

        if (!skill) {
            return res.status(404).json({
                success: false,
                error: 'Skill not found'
            });
        }

        res.json({ success: true, skill });
    } catch (error) {
        console.error('Error fetching skill:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/skills/:owner/:slug/download
 * Download skill source as ZIP from GitHub
 */
app.get('/api/skills/:owner/:slug/download', async (req, res) => {
    try {
        const { owner, slug } = req.params;
        const cache = await getSkillsCache();

        const skill = (cache.skills || []).find(
            s => s.owner === owner && s.slug === slug
        );

        if (!skill) {
            return res.status(404).json({
                success: false,
                error: 'Skill not found'
            });
        }

        // Import archiver for creating ZIP
        const archiver = (await import('archiver')).default;

        // Fetch skill directory tree from GitHub API
        const skillPath = `skills/${owner}/${slug}`;
        const treeUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${skillPath}`;

        const treeResponse = await fetch(treeUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'ClawHub-Clone'
            }
        });

        if (!treeResponse.ok) {
            throw new Error(`Failed to fetch skill files: ${treeResponse.statusText}`);
        }

        const files = await treeResponse.json();

        // Set response headers for ZIP download
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${owner}-${slug}.zip"`);

        // Create ZIP archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        // Pipe archive to response
        archive.pipe(res);

        // Download and add each file to the archive
        for (const file of files) {
            if (file.type === 'file') {
                try {
                    // Fetch file content
                    const fileResponse = await fetch(file.download_url);
                    if (fileResponse.ok) {
                        const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
                        archive.append(fileBuffer, { name: file.name });
                    }
                } catch (err) {
                    console.warn(`Failed to download file ${file.name}:`, err.message);
                }
            }
        }

        // Finalize archive
        await archive.finalize();

        // Increment download count
        const skillId = `${owner}/${slug}`;
        await incrementDownload(skillId);

        console.log(`✅ Downloaded skill: ${owner}/${slug}`);

    } catch (error) {
        console.error('Error downloading skill:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

/**
 * GET /api/stats
 * Get cache statistics
 */
app.get('/api/stats', async (req, res) => {
    try {
        const cache = await getSkillsCache();

        // Count unique owners
        const owners = new Set((cache.skills || []).map(s => s.owner));

        res.json({
            success: true,
            stats: {
                totalSkills: cache.count || 0,
                totalOwners: owners.size,
                updatedAt: cache.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/skills/highlighted
 * Get top 10 most downloaded skills
 */
app.get('/api/skills/highlighted', async (req, res) => {
    try {
        const cache = await getSkillsCache();
        const downloads = await loadDownloads();

        // Merge download data with skills
        const skillsWithDownloads = (cache.skills || []).map(skill => ({
            ...skill,
            downloadCount: downloads[skill.id]?.count || 0
        }));

        // Sort by download count and get top 10
        const highlighted = skillsWithDownloads
            .sort((a, b) => b.downloadCount - a.downloadCount)
            .slice(0, 10);

        res.json({ success: true, skills: highlighted });
    } catch (error) {
        console.error('Error fetching highlighted skills:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/skills/:owner/:slug/stats
 * Get download statistics for a specific skill
 */
app.get('/api/skills/:owner/:slug/stats', async (req, res) => {
    try {
        const { owner, slug } = req.params;
        const skillId = `${owner}/${slug}`;
        const stats = await getDownloadStats(skillId);

        res.json({ success: true, ...stats });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/skills/:owner/:slug/files
 * List files in skill directory from GitHub
 */
app.get('/api/skills/:owner/:slug/files', async (req, res) => {
    try {
        const { owner, slug } = req.params;
        const skillPath = `skills/${owner}/${slug}`;
        const treeUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${skillPath}`;

        const token = process.env.GITHUB_TOKEN || null;
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'ClawHub-Clone'
        };
        if (token) headers['Authorization'] = `token ${token}`;

        const response = await fetch(treeUrl, { headers });
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const items = await response.json();
        const files = items.map(item => ({
            name: item.name,
            type: item.type, // 'file' or 'dir'
            size: item.size || 0,
            download_url: item.download_url,
            path: item.path
        }));

        // Sort: directories first, then files, both alphabetically
        files.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

        res.json({ success: true, files });
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/skills/:owner/:slug/files/:filename
 * Get single file content from GitHub
 */
app.get('/api/skills/:owner/:slug/files/:filename', async (req, res) => {
    try {
        const { owner, slug, filename } = req.params;
        const filePath = `skills/${owner}/${slug}/${filename}`;
        const rawUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${filePath}`;

        const token = process.env.GITHUB_TOKEN || null;
        const headers = { 'User-Agent': 'ClawHub-Clone' };
        if (token) headers['Authorization'] = `token ${token}`;

        const response = await fetch(rawUrl, { headers });
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status}`);
        }

        const content = await response.text();
        res.json({ success: true, name: filename, content });
    } catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/authors/:username
 * Get author profile with all their skills
 */
app.get('/api/authors/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const cache = await getSkillsCache();
        const downloads = await loadDownloads();

        const authorSkills = (cache.skills || [])
            .filter(s => s.owner === username)
            .map(s => ({
                ...s,
                downloadCount: downloads[s.id]?.count || 0,
                versionCount: (s.history || []).length
            }))
            .sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));

        if (authorSkills.length === 0) {
            return res.status(404).json({ success: false, error: 'Author not found' });
        }

        const totalDownloads = authorSkills.reduce((sum, s) => sum + s.downloadCount, 0);

        res.json({
            success: true,
            author: {
                username,
                avatarUrl: `https://github.com/${username}.png`,
                githubUrl: `https://github.com/${username}`,
                skillCount: authorSkills.length,
                totalDownloads
            },
            skills: authorSkills
        });
    } catch (error) {
        console.error('Error fetching author:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/sync
 * Trigger full sync (development use)
 */
app.post('/api/sync', async (req, res) => {
    try {
        const token = process.env.GITHUB_TOKEN || null;

        res.json({
            success: true,
            message: 'Sync started in background'
        });

        // Run sync in background
        fullSync(token).then(cache => {
            skillsCache = cache;
            lastCacheLoad = Date.now();
            console.log('✅ Background sync completed');
        }).catch(error => {
            console.error('❌ Background sync failed:', error);
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/webhook
 * GitHub Webhook receiver
 */
app.post('/api/webhook', async (req, res) => {
    try {
        const event = req.headers['x-github-event'];
        const payload = req.body;

        console.log(`📬 Received webhook: ${event}`);

        if (event === 'push') {
            // Extract modified skill paths
            const commits = payload.commits || [];
            const modifiedPaths = new Set();

            for (const commit of commits) {
                const files = [
                    ...(commit.added || []),
                    ...(commit.modified || [])
                ];

                for (const file of files) {
                    if (file.startsWith('skills/')) {
                        // Extract skill directory path
                        const parts = file.split('/');
                        if (parts.length >= 3) {
                            modifiedPaths.add(`skills/${parts[1]}/${parts[2]}`);
                        }
                    }
                }
            }

            if (modifiedPaths.size > 0) {
                const token = process.env.GITHUB_TOKEN || null;
                const paths = Array.from(modifiedPaths);

                console.log(`🔄 Updating ${paths.length} skills...`);

                // Quick sync for modified paths
                quickSync(paths, token).then(cache => {
                    skillsCache = cache;
                    lastCacheLoad = Date.now();
                    console.log('✅ Quick sync completed');
                }).catch(error => {
                    console.error('❌ Quick sync failed:', error);
                });
            }
        }

        res.json({ success: true, received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 API Server running at http://localhost:${PORT}`);
    console.log(`📚 API endpoints:`);
    console.log(`   GET  /api/skills          - List all skills`);
    console.log(`   GET  /api/skills/:o/:s    - Get skill details`);
    console.log(`   GET  /api/stats           - Get statistics`);
    console.log(`   POST /api/sync            - Trigger full sync`);
    console.log(`   POST /api/webhook         - GitHub webhook`);

    // Load cache on startup
    getSkillsCache().then(cache => {
        if (cache.count > 0) {
            console.log(`📦 Loaded ${cache.count} skills from cache`);
        } else {
            console.log('📭 No cached data. Run "npm run sync" to fetch data.');
        }
    });

    // Setup automatic sync with node-cron
    const token = process.env.GITHUB_TOKEN || null;

    // Incremental sync every 2 hours
    cron.schedule('0 */2 * * *', async () => {
        console.log('⚡ [Auto Sync] Incremental sync started (every 2 hours)');
        try {
            const cache = await quickSync([], token);
            skillsCache = cache;
            lastCacheLoad = Date.now();
            console.log('✅ [Auto Sync] Quick sync completed');
        } catch (error) {
            console.error('❌ [Auto Sync] Quick sync failed:', error.message);
        }
    });

    console.log('\n⏰ Auto sync scheduled:');
    console.log('   ⚡ Quick sync: Every 2 hours');
    console.log('');
});

export default app;
