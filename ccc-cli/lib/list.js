import chalk from 'chalk';
import fetch from 'node-fetch';

// Production API
const API_BASE = 'https://www.ccc.onl/api';

// Development API (uncomment for local testing)
// const API_BASE = 'http://localhost:3001/api';

/**
 * List all available skills
 * @param {string} searchQuery - Optional search query
 */
export async function listSkills(searchQuery) {
    try {
        // Fetch skills from API
        const url = searchQuery
            ? `${API_BASE}/skills?search=${encodeURIComponent(searchQuery)}`
            : `${API_BASE}/skills`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        const skills = data.skills || [];

        if (skills.length === 0) {
            console.log(chalk.yellow('No skills found'));
            return;
        }

        // Display header
        console.log();
        console.log(chalk.bold(`Found ${skills.length} skill(s):`));
        console.log();

        // Display skills
        skills.forEach(skill => {
            const name = chalk.cyan(`${skill.owner}/${skill.slug}`);
            const version = skill.version ? chalk.gray(`v${skill.version}`) : '';
            const desc = chalk.gray(skill.description || 'No description');

            console.log(`  ${name} ${version}`);
            console.log(`    ${desc}`);
            console.log();
        });

        // Display install hint
        console.log(chalk.gray('To install: ccc install owner/skill-name'));
        console.log();

    } catch (error) {
        throw new Error(`Failed to list skills: ${error.message}`);
    }
}
