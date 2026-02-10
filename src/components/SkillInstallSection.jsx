import { useState } from 'react';

const PACKAGE_MANAGERS = [
    { id: 'npm', label: 'npm', command: 'npx' },
    { id: 'pnpm', label: 'pnpm', command: 'pnpm dlx' },
    { id: 'bun', label: 'bun', command: 'bunx' }
];

function SkillInstallSection({ skill }) {
    const [activeManager, setActiveManager] = useState('npm');
    const [copied, setCopied] = useState(false);
    const [showRawContent, setShowRawContent] = useState(false);

    const currentManager = PACKAGE_MANAGERS.find(pm => pm.id === activeManager);
    const installCommand = `${currentManager.command} @renwin/ccc@latest install ${skill.owner}/${skill.slug}`;

    // GitHub URLs
    const githubUrl = `https://github.com/openclaw/skills/tree/main/skills/${skill.owner}/${skill.slug}`;
    const rawSkillUrl = `https://raw.githubusercontent.com/openclaw/skills/main/skills/${skill.owner}/${skill.slug}/SKILL.md`;
    const downloadZipUrl = `/api/skills/${skill.owner}/${skill.slug}/download`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(installCommand);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleDownload = () => {
        // Open download in new tab (will trigger file download via API)
        window.open(downloadZipUrl, '_blank');
    };

    return (
        <div className="skill-install-section">
            {/* Install Command */}
            <div className="install-header">
                <span className="install-label">Install this skill:</span>
                <div className="pm-switcher">
                    {PACKAGE_MANAGERS.map(pm => (
                        <button
                            key={pm.id}
                            className={`pm-btn ${activeManager === pm.id ? 'active' : ''}`}
                            onClick={() => setActiveManager(pm.id)}
                        >
                            {pm.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Command Box */}
            <div className="command-box" onClick={handleCopy}>
                <span className="command-bracket"></span>
                <code className="command-text">{installCommand}</code>
                <button className="copy-btn" title="Copy to clipboard">
                    {copied ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    )}
                </button>
            </div>

            {/* Action Buttons */}
            <div className="skill-actions">
                <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-btn action-btn-github"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    <span>View on GitHub</span>
                </a>
                <button
                    onClick={handleDownload}
                    className="action-btn action-btn-download"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>Download ZIP</span>
                </button>
            </div>

            {/* Raw SKILL.md Toggle */}
            {skill.skillMd && (
                <div className="raw-content-section">
                    <button
                        className="raw-toggle-btn"
                        onClick={() => setShowRawContent(!showRawContent)}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            style={{ transform: showRawContent ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                        >
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                        <span>View SKILL.md source</span>
                    </button>

                    {showRawContent && (
                        <div className="raw-content-box">
                            <pre><code>{skill.skillMd}</code></pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SkillInstallSection;
