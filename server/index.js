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
 */
function filterSkills(skills, query = '', page = 1, limit = 24) {
    let filtered = skills;

    // Search filter
    if (query) {
        const q = query.toLowerCase();
        filtered = skills.filter(s =>
            s.displayName?.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q) ||
            s.owner?.toLowerCase().includes(q) ||
            s.slug?.toLowerCase().includes(q)
        );
    }

    // Sort by publishedAt (newest first)
    filtered.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));

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
        const { search = '', page = 1, limit = 24 } = req.query;
        const cache = await getSkillsCache();

        const result = filterSkills(
            cache.skills || [],
            search,
            parseInt(page),
            parseInt(limit)
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

    // Daily full sync at 3:00 AM
    cron.schedule('0 3 * * *', async () => {
        console.log('🔄 [Auto Sync] Daily full sync started (3:00 AM)');
        try {
            const cache = await fullSync(token);
            skillsCache = cache;
            lastCacheLoad = Date.now();
            console.log(`✅ [Auto Sync] Full sync completed: ${cache.count} skills`);
        } catch (error) {
            console.error('❌ [Auto Sync] Full sync failed:', error.message);
        }
    });

    // Incremental sync every 2 hours
    cron.schedule('0 */2 * * *', async () => {
        console.log('⚡ [Auto Sync] Incremental sync started (every 2 hours)');
        try {
            const cache = await quickSync(token);
            skillsCache = cache;
            lastCacheLoad = Date.now();
            console.log('✅ [Auto Sync] Quick sync completed');
        } catch (error) {
            console.error('❌ [Auto Sync] Quick sync failed:', error.message);
        }
    });

    console.log('\n⏰ Auto sync scheduled:');
    console.log('   📅 Full sync: Daily at 3:00 AM');
    console.log('   ⚡ Quick sync: Every 2 hours');
    console.log('');
});

export default app;
