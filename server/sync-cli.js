/**
 * CLI tool for syncing skills data
 * Usage: node server/sync-cli.js [--quick path1 path2 ...]
 */

import 'dotenv/config';
import { fullSync, quickSync } from './github-sync.js';

const args = process.argv.slice(2);
const token = process.env.GITHUB_TOKEN || null;

if (token) {
    console.log('🔑 Using GitHub token for API requests');
} else {
    console.log('⚠️ No GITHUB_TOKEN set. Rate limits may apply.');
    console.log('   Set GITHUB_TOKEN environment variable for higher limits.');
}

async function main() {
    try {
        if (args[0] === '--quick' && args.length > 1) {
            // Quick sync specific paths
            const paths = args.slice(1);
            console.log(`🔄 Quick sync for ${paths.length} paths`);
            await quickSync(paths, token);
        } else {
            // Full sync
            console.log('🔄 Starting full sync...');
            console.log('   This may take several minutes depending on rate limits.');
            await fullSync(token);
        }

        console.log('✅ Sync completed successfully!');
    } catch (error) {
        console.error('❌ Sync failed:', error.message);
        process.exit(1);
    }
}

main();
