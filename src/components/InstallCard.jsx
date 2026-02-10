import { useState } from 'react';
import SearchBar from './SearchBar';

const PACKAGE_MANAGERS = [
    { id: 'npm', label: 'npm', command: 'npx' },
    { id: 'pnpm', label: 'pnpm', command: 'pnpm dlx' },
    { id: 'bun', label: 'bun', command: 'bunx' }
];

function InstallCard({ onSearch }) {
    const [activeManager, setActiveManager] = useState('npm');
    const [skillName, setSkillName] = useState('sonoscli');
    const [copied, setCopied] = useState(false);

    const currentManager = PACKAGE_MANAGERS.find(pm => pm.id === activeManager);
    const installCommand = `${currentManager.command} @renwin/ccc@latest install ${skillName}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(installCommand);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="install-card">
            {/* Header */}
            <p className="install-card-title">
                Search skills. Versioned, rollback-ready.
            </p>

            {/* Search Bar */}
            <div className="install-search">
                <SearchBar
                    onSearch={onSearch}
                    placeholder="Search skills..."
                />
            </div>

            {/* Install Section */}
            <div className="install-section">
                <div className="install-row">
                    <span className="install-label">
                        Install any skill folder in one shot:
                    </span>
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
            </div>
        </div>
    );
}

export default InstallCard;
