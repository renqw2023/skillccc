/**
 * Security Scanner Module
 * Static analysis of skill content for potential risks
 */

// Security rules with severity and point deductions
const SECURITY_RULES = [
    // Code execution risks
    { pattern: /\beval\s*\(/gi, severity: 'high', points: -30, label: 'eval() usage', category: 'code_execution' },
    { pattern: /\bexec\s*\(/gi, severity: 'high', points: -30, label: 'exec() usage', category: 'code_execution' },
    { pattern: /child_process/gi, severity: 'high', points: -30, label: 'child_process module', category: 'code_execution' },
    { pattern: /\bFunction\s*\(/gi, severity: 'high', points: -25, label: 'Function() constructor', category: 'code_execution' },

    // Destructive commands
    { pattern: /rm\s+-rf\s/gi, severity: 'high', points: -25, label: 'rm -rf command', category: 'destructive' },
    { pattern: /rmdir\s+\/s/gi, severity: 'high', points: -25, label: 'rmdir /s command', category: 'destructive' },
    { pattern: /del\s+\/f/gi, severity: 'high', points: -25, label: 'del /f command', category: 'destructive' },
    { pattern: /format\s+[a-z]:/gi, severity: 'critical', points: -40, label: 'Format drive command', category: 'destructive' },

    // Remote code execution
    { pattern: /curl\s.*\|\s*(bash|sh|zsh)/gi, severity: 'critical', points: -30, label: 'curl pipe to shell', category: 'remote_exec' },
    { pattern: /wget\s.*\|\s*(bash|sh|zsh)/gi, severity: 'critical', points: -30, label: 'wget pipe to shell', category: 'remote_exec' },
    { pattern: /Invoke-Expression/gi, severity: 'high', points: -25, label: 'PowerShell IEX', category: 'remote_exec' },

    // Privilege escalation
    { pattern: /\bsudo\b/gi, severity: 'medium', points: -15, label: 'sudo usage', category: 'privilege' },
    { pattern: /chmod\s+777/gi, severity: 'medium', points: -15, label: 'chmod 777', category: 'privilege' },
    { pattern: /--no-sandbox/gi, severity: 'medium', points: -10, label: 'no-sandbox flag', category: 'privilege' },

    // Sensitive data patterns
    { pattern: /['"][A-Za-z0-9+/=]{20,}['"]/g, severity: 'low', points: -5, label: 'Possible hardcoded token', category: 'sensitive' },
    { pattern: /password\s*[:=]\s*['"][^'"]+['"]/gi, severity: 'medium', points: -10, label: 'Hardcoded password', category: 'sensitive' },

    // Network risks
    { pattern: /0\.0\.0\.0/g, severity: 'low', points: -5, label: 'Binds to all interfaces', category: 'network' },
    { pattern: /disable.*ssl|ssl.*verify.*false/gi, severity: 'medium', points: -10, label: 'SSL verification disabled', category: 'network' },
];

/**
 * Scan skill content for security risks
 * @param {object} skill - Skill object with skillMd, readme, body
 * @returns {object} Security report
 */
export function scanSkill(skill) {
    let score = 100;
    const findings = [];

    // Combine all text content for scanning
    const content = [
        skill.skillMd || '',
        skill.readme || '',
        skill.body || ''
    ].join('\n');

    // Check each security rule
    for (const rule of SECURITY_RULES) {
        const matches = content.match(rule.pattern);
        if (matches && matches.length > 0) {
            score += rule.points;
            findings.push({
                label: rule.label,
                severity: rule.severity,
                category: rule.category,
                count: matches.length,
                points: rule.points
            });
        }
    }

    // Bonus checks
    if (!skill.readme && !skill.body) {
        score -= 10;
        findings.push({
            label: 'No documentation (README/SKILL.md body)',
            severity: 'low',
            category: 'quality',
            count: 1,
            points: -10
        });
    }

    if (!skill.license) {
        score -= 5;
        findings.push({
            label: 'No license specified',
            severity: 'info',
            category: 'quality',
            count: 1,
            points: -5
        });
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Determine grade
    let grade, color;
    if (score >= 90) { grade = 'A'; color = 'green'; }
    else if (score >= 70) { grade = 'B'; color = 'yellow'; }
    else if (score >= 50) { grade = 'C'; color = 'orange'; }
    else { grade = 'F'; color = 'red'; }

    return {
        score,
        grade,
        color,
        findings,
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
