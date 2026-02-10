#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { installSkill } from '../lib/install.js';
import { listSkills } from '../lib/list.js';

const program = new Command();

program
    .name('ccc')
    .description('ClawHub Clone CLI - Install AI agent skills')
    .version('1.0.0');

// Install command
program
    .command('install <skill>')
    .description('Install a skill from ClawHub registry')
    .option('-d, --dir <directory>', 'Installation directory', '.skills')
    .action(async (skill, options) => {
        try {
            await installSkill(skill, options.dir);
        } catch (error) {
            console.error(chalk.red('✗ Error:'), error.message);
            process.exit(1);
        }
    });

// List command
program
    .command('list')
    .description('List all available skills')
    .option('-s, --search <query>', 'Search skills')
    .action(async (options) => {
        try {
            await listSkills(options.search);
        } catch (error) {
            console.error(chalk.red('✗ Error:'), error.message);
            process.exit(1);
        }
    });

program.parse(process.argv);
