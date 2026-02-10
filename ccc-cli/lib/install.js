import fetch from 'node-fetch';

// Production API
const API_BASE = 'https://www.ccc.onl/api';

// Development API (uncomment for local testing)
// const API_BASE = 'http://localhost:3001/api';

/**
 * Install a skill from ClawHub registry
 * @param {string} skillName - Format: owner/slug
 * @param {string} targetDir - Installation directory
 */
export async function installSkill(skillName, targetDir = '.skills') {
    // Parse skill name
    const [owner, slug] = skillName.split('/');
    if (!owner || !slug) {
        throw new Error('Invalid skill name. Use format: owner/skill-name');
    }

    const spinner = ora(`Installing ${chalk.cyan(skillName)}...`).start();

    try {
        // Step 1: Verify skill exists
        spinner.text = 'Verifying skill...';
        const skillData = await fetchSkillData(owner, slug);

        if (!skillData) {
            spinner.fail(`Skill ${chalk.cyan(skillName)} not found`);
            throw new Error('Skill not found in registry');
        }

        // Step 2: Download skill ZIP
        spinner.text = 'Downloading skill files...';
        const zipBuffer = await downloadSkillZip(owner, slug);

        // Step 3: Extract to target directory
        spinner.text = 'Extracting files...';
        const skillPath = path.join(process.cwd(), targetDir, slug);
        await extractSkill(zipBuffer, skillPath);

        // Step 4: Success
        spinner.succeed(chalk.green(`✓ Successfully installed ${chalk.cyan(skillName)}`));

        console.log();
        console.log(chalk.gray(`  Location: ${skillPath}`));
        console.log(chalk.gray(`  Version:  ${skillData.version || 'N/A'}`));
        console.log();
        console.log(chalk.yellow('  Next steps:'));
        console.log(chalk.gray(`    cd ${path.join(targetDir, slug)}`));
        console.log(chalk.gray(`    cat SKILL.md`));

    } catch (error) {
        spinner.fail(chalk.red(`Failed to install ${skillName}`));
        throw error;
    }
}

/**
 * Fetch skill metadata from API
 */
async function fetchSkillData(owner, slug) {
    const response = await fetch(`${API_BASE}/skills/${owner}/${slug}`);

    if (!response.ok) {
        if (response.status === 404) {
            return null;
        }
        throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.skill;
}

/**
 * Download skill ZIP from API
 */
async function downloadSkillZip(owner, slug) {
    const response = await fetch(`${API_BASE}/skills/${owner}/${slug}/download`);

    if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
}

/**
 * Extract ZIP to target directory
 */
async function extractSkill(zipBuffer, targetPath) {
    // Create target directory
    await fs.mkdir(targetPath, { recursive: true });

    // Extract ZIP
    const zip = new AdmZip(zipBuffer);
    zip.extractAllTo(targetPath, true);
}
