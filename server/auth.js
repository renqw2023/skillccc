/**
 * GitHub OAuth Authentication Module
 * Handles login, callback, session management
 */

import { findOrCreateUser, getUserById } from './db/index.js';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

/**
 * Auth middleware - attaches user to req if session exists
 */
export function attachUser(req, res, next) {
    if (req.session && req.session.userId) {
        req.user = getUserById(req.session.userId);
    }
    next();
}

/**
 * Require login middleware - returns 401 if not authenticated
 */
export function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ success: false, error: 'Login required' });
    }
    next();
}

/**
 * Register auth routes on Express app
 */
export function registerAuthRoutes(app) {

    /**
     * GET /api/auth/github
     * Redirect to GitHub OAuth authorization page
     */
    app.get('/api/auth/github', (req, res) => {
        if (!GITHUB_CLIENT_ID) {
            return res.status(500).json({ success: false, error: 'GitHub OAuth not configured' });
        }
        const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/github/callback`;
        const scope = 'read:user';
        const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
        res.redirect(url);
    });

    /**
     * GET /api/auth/github/callback
     * Exchange code for token, create/update user, set session
     */
    app.get('/api/auth/github/callback', async (req, res) => {
        const { code } = req.query;
        if (!code) {
            return res.status(400).send('Missing code parameter');
        }

        try {
            // Exchange code for access token
            const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    client_id: GITHUB_CLIENT_ID,
                    client_secret: GITHUB_CLIENT_SECRET,
                    code
                })
            });

            const tokenData = await tokenResponse.json();
            if (tokenData.error) {
                throw new Error(tokenData.error_description || tokenData.error);
            }

            const accessToken = tokenData.access_token;

            // Fetch user info from GitHub
            const userResponse = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'User-Agent': 'SkillCCC'
                }
            });

            if (!userResponse.ok) {
                throw new Error('Failed to fetch GitHub user info');
            }

            const githubUser = await userResponse.json();

            // Create or update user in database
            const user = findOrCreateUser({
                github_id: githubUser.id,
                username: githubUser.login,
                avatar_url: githubUser.avatar_url,
                access_token: accessToken
            });

            // Set session
            req.session.userId = user.id;

            console.log(`✅ User logged in: ${githubUser.login}`);

            // Redirect to frontend
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            res.redirect(`${frontendUrl}?login=success`);

        } catch (error) {
            console.error('OAuth error:', error);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            res.redirect(`${frontendUrl}?login=error&message=${encodeURIComponent(error.message)}`);
        }
    });

    /**
     * GET /api/auth/me
     * Return current logged-in user info
     */
    app.get('/api/auth/me', (req, res) => {
        if (!req.user) {
            return res.json({ success: true, user: null });
        }
        res.json({
            success: true,
            user: {
                id: req.user.id,
                username: req.user.username,
                avatar_url: req.user.avatar_url,
                github_id: req.user.github_id
            }
        });
    });

    /**
     * POST /api/auth/logout
     * Destroy session
     */
    app.post('/api/auth/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ success: false, error: 'Logout failed' });
            }
            res.json({ success: true });
        });
    });
}
