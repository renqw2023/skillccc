/**
 * Security Scanner Module — ClawHub-style
 * Multi-dimensional analysis: pattern scan + consistency check
 */

// ============ Pattern-based Security Rules ============
const SECURITY_RULES = [
    // Code execution risks
    { pattern: /\beval\s*\(/gi, severity: 'high', label: 'eval() usage', category: 'code_execution', weight: 30 },
    { pattern: /\bexec\s*\(/gi, severity: 'high', label: 'exec() usage', category: 'code_execution', weight: 30 },
    { pattern: /child_process/gi, severity: 'high', label: 'child_process module', category: 'code_execution', weight: 30 },
    { pattern: /\bFunction\s*\(/gi, severity: 'high', label: 'Function() constructor', category: 'code_execution', weight: 25 },
    { pattern: /\bspawn\s*\(/gi, severity: 'medium', label: 'spawn() usage', category: 'code_execution', weight: 15 },

    // Destructive commands
    { pattern: /rm\s+-rf\s/gi, severity: 'high', label: 'rm -rf command', category: 'destructive', weight: 25 },
    { pattern: /rmdir\s+\/s/gi, severity: 'high', label: 'rmdir /s command', category: 'destructive', weight: 25 },
    { pattern: /del\s+\/f/gi, severity: 'high', label: 'del /f command', category: 'destructive', weight: 25 },
    { pattern: /format\s+[a-z]:/gi, severity: 'critical', label: 'Format drive command', category: 'destructive', weight: 40 },

    // Remote code execution
    { pattern: /curl\s.*\|\s*(bash|sh|zsh)/gi, severity: 'critical', label: 'curl pipe to shell', category: 'remote_exec', weight: 35 },
    { pattern: /wget\s.*\|\s*(bash|sh|zsh)/gi, severity: 'critical', label: 'wget pipe to shell', category: 'remote_exec', weight: 35 },
    { pattern: /Invoke-Expression/gi, severity: 'high', label: 'PowerShell IEX', category: 'remote_exec', weight: 25 },
    { pattern: /Invoke-WebRequest.*\|.*iex/gi, severity: 'critical', label: 'Remote script execution', category: 'remote_exec', weight: 35 },

    // Privilege escalation
    { pattern: /\bsudo\b/gi, severity: 'medium', label: 'sudo usage', category: 'privilege', weight: 15 },
    { pattern: /chmod\s+777/gi, severity: 'medium', label: 'chmod 777', category: 'privilege', weight: 15 },
    { pattern: /--no-sandbox/gi, severity: 'medium', label: 'no-sandbox flag', category: 'privilege', weight: 10 },
    { pattern: /setuid|setgid/gi, severity: 'high', label: 'setuid/setgid', category: 'privilege', weight: 20 },

    // Sensitive data patterns
    { pattern: /['"][A-Za-z0-9+/=]{32,}['"]/g, severity: 'medium', label: 'Possible hardcoded secret', category: 'credentials', weight: 10 },
    { pattern: /password\s*[:=]\s*['"][^'"]+['"]/gi, severity: 'medium', label: 'Hardcoded password', category: 'credentials', weight: 15 },
    { pattern: /(api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/gi, severity: 'medium', label: 'Hardcoded API key', category: 'credentials', weight: 15 },

    // Network risks
    { pattern: /0\.0\.0\.0/g, severity: 'low', label: 'Binds to all interfaces', category: 'network', weight: 5 },
    { pattern: /disable.*ssl|ssl.*verify.*false|verify\s*=\s*false/gi, severity: 'medium', label: 'SSL verification disabled', category: 'network', weight: 10 },

    // File system access
    { pattern: /\/etc\/passwd|\/etc\/shadow/gi, severity: 'high', label: 'System file access', category: 'filesystem', weight: 25 },
    { pattern: /\$HOME|\~\//g, severity: 'low', label: 'Home directory access', category: 'filesystem', weight: 5 },
];

// ============ Category display names ============
const CATEGORY_LABELS = {
    code_execution: '⚙️ Code Execution',
    destructive: '💥 Destructive Commands',
    remote_exec: '🌐 Remote Execution',
    privilege: '🔑 Privilege Escalation',
    credentials: '🔐 Credentials',
    network: '🌍 Network',
    filesystem: '📁 File System',
    quality: '📝 Quality',
    consistency: '🔍 Consistency',
};

/**
 * Extract environment variables referenced in content
 */
function extractEnvVars(content) {
    const patterns = [
        /process\.env\.([A-Z_][A-Z0-9_]*)/g,
        /\$\{?([A-Z_][A-Z0-9_]*)\}?/g,
        /os\.environ\[['"]([A-Z_][A-Z0-9_]*)['"]\]/g,
        /ENV\[['"]([A-Z_][A-Z0-9_]*)['"]\]/g,
    ];
    const vars = new Set();
    for (const pat of patterns) {
        let m;
        while ((m = pat.exec(content)) !== null) {
            const v = m[1];
            // Filter out common non-env patterns
            if (v && v.length > 2 && !['HOME', 'PATH', 'PWD', 'USER', 'SHELL', 'TERM', 'LANG'].includes(v)) {
                vars.add(v);
            }
        }
    }
    return Array.from(vars);
}

/**
 * Extract binary dependencies (bins) from content
 */
function extractBins(content) {
    const patterns = [
        /(?:which|command\s+-v)\s+(\w+)/g,
        /`(\w+)`\s+(?:must|should|needs to)\s+be\s+installed/gi,
        /requires?\s+`(\w+)`/gi,
    ];
    const bins = new Set();
    for (const pat of patterns) {
        let m;
        while ((m = pat.exec(content)) !== null) {
            bins.add(m[1].toLowerCase());
        }
    }
    return Array.from(bins);
}

/**
 * Perform consistency check between skill content and metadata
 */
function checkConsistency(skill, content) {
    const issues = [];

    // Check env vars in code vs metadata
    const envInCode = extractEnvVars(content);
    const envInMeta = skill.envVars || [];

    for (const v of envInCode) {
        if (!envInMeta.includes(v)) {
            issues.push({
                label: `Env var ${v} used in code but not declared in metadata`,
                severity: 'medium',
                category: 'consistency',
                weight: 8,
            });
        }
    }

    // Check binary deps
    const binsInCode = extractBins(content);
    const binsInMeta = skill.bins || [];
    for (const b of binsInCode) {
        if (!binsInMeta.includes(b)) {
            issues.push({
                label: `Binary "${b}" required but not listed in metadata`,
                severity: 'low',
                category: 'consistency',
                weight: 5,
            });
        }
    }

    // No documentation
    if (!skill.readme && !skill.body) {
        issues.push({
            label: 'No documentation (README/SKILL.md body)',
            severity: 'low',
            category: 'quality',
            weight: 10,
        });
    }

    // No license
    if (!skill.license) {
        issues.push({
            label: 'No license specified',
            severity: 'info',
            category: 'quality',
            weight: 5,
        });
    }

    return issues;
}

/**
 * Generate a human-readable summary of the scan findings
 */
function generateSummary(skill, findings) {
    const hasCritical = findings.some(f => f.severity === 'critical');
    const hasHigh = findings.some(f => f.severity === 'high');
    const hasMedium = findings.some(f => f.severity === 'medium');
    const consistencyIssues = findings.filter(f => f.category === 'consistency');
    const riskFindings = findings.filter(f => !['quality', 'consistency'].includes(f.category));

    const skillName = skill.displayName || skill.slug;
    let summary = '';

    if (riskFindings.length === 0 && consistencyIssues.length === 0) {
        summary = `The skill "${skillName}" appears safe. No risky patterns or metadata inconsistencies were detected in the analysis.`;
    } else if (hasCritical) {
        const labels = riskFindings.filter(f => f.severity === 'critical').map(f => f.label).join(', ');
        summary = `Critical security risks detected in "${skillName}": ${labels}. Manual review is strongly recommended before use.`;
    } else if (hasHigh) {
        const labels = riskFindings.filter(f => f.severity === 'high').map(f => f.label).join(', ');
        summary = `The skill "${skillName}" contains patterns that may pose security risks (${labels}).`;
        if (consistencyIssues.length > 0) {
            summary += ` Additionally, metadata inconsistencies were found that should be corrected.`;
        }
    } else if (consistencyIssues.length > 0) {
        summary = `The skill "${skillName}" appears functionally safe, but registry metadata has inconsistencies — `;
        summary += consistencyIssues.map(f => f.label.toLowerCase()).join('; ') + '.';
    } else {
        summary = `The skill "${skillName}" has minor notes (${findings.map(f => f.label).join(', ')}) but no significant risks.`;
    }

    return summary;
}

/**
 * Scan skill content for security risks — ClawHub-style
 * Returns status label, confidence, summary, and categorized details
 */
export function scanSkill(skill) {
    const findings = [];

    // Combine all text content for scanning
    const content = [
        skill.skillMd || '',
        skill.readme || '',
        skill.body || ''
    ].join('\n');

    // 1. Pattern-based scanning
    for (const rule of SECURITY_RULES) {
        const matches = content.match(rule.pattern);
        if (matches && matches.length > 0) {
            findings.push({
                label: rule.label,
                severity: rule.severity,
                category: rule.category,
                count: matches.length,
                weight: rule.weight
            });
        }
    }

    // 2. Consistency checks
    const consistencyIssues = checkConsistency(skill, content);
    findings.push(...consistencyIssues);

    // Calculate total risk weight
    const totalWeight = findings.reduce((sum, f) => sum + f.weight, 0);

    // Determine status (ClawHub-style labels)
    let status, statusColor, confidence;
    if (totalWeight === 0) {
        status = 'Benign';
        statusColor = 'green';
        confidence = 'HIGH';
    } else if (totalWeight <= 15) {
        status = 'Benign';
        statusColor = 'green';
        confidence = 'MEDIUM';
    } else if (totalWeight <= 40) {
        status = 'Suspicious';
        statusColor = 'yellow';
        confidence = 'HIGH';
    } else if (totalWeight <= 70) {
        status = 'Suspicious';
        statusColor = 'orange';
        confidence = 'HIGH';
    } else {
        status = 'Dangerous';
        statusColor = 'red';
        confidence = 'HIGH';
    }

    // Group findings by category for the details view
    const detailsByCategory = {};
    for (const f of findings) {
        if (!detailsByCategory[f.category]) {
            detailsByCategory[f.category] = {
                categoryLabel: CATEGORY_LABELS[f.category] || f.category,
                items: []
            };
        }
        detailsByCategory[f.category].items.push(f);
    }

    // Generate natural language summary
    const summary = generateSummary(skill, findings);

    return {
        status,
        statusColor,
        confidence: confidence + ' CONFIDENCE',
        summary,
        findings,
        details: detailsByCategory,
        totalWeight,
        scannedAt: new Date().toISOString()
    };
}

/**
 * Batch scan all skills and return a map of skillId -> security report
 */
export function batchScan(skills) {
    const results = {};
    for (const skill of skills) {
        results[skill.id] = scanSkill(skill);
    }
    return results;
}
