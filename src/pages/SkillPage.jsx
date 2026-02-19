import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marked } from 'marked';
import { useAuth } from '../contexts/AuthContext';
import SkillInstallSection from '../components/SkillInstallSection';
import FileBrowser from '../components/FileBrowser';
import CommentSection from '../components/CommentSection';

const API_BASE = '';

function SkillPage() {
    const { owner, slug } = useParams();
    const { user, login } = useAuth();
    const [skill, setSkill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Star state
    const [starred, setStarred] = useState(false);
    const [starCount, setStarCount] = useState(0);
    const [starLoading, setStarLoading] = useState(false);

    // Security state
    const [security, setSecurity] = useState(null);

    useEffect(() => {
        const fetchSkill = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/skills/${owner}/${slug}`);
                const data = await response.json();

                if (data.success) {
                    setSkill(data.skill);
                } else {
                    setError(data.error || 'Skill not found');
                }
            } catch (err) {
                setError('Failed to load skill');
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSkill();

        // Fetch star status
        fetch(`${API_BASE}/api/skills/${owner}/${slug}/star`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStarred(data.starred);
                    setStarCount(data.count);
                }
            })
            .catch(() => { });

        // Fetch security scan
        fetch(`${API_BASE}/api/skills/${owner}/${slug}/security`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setSecurity(data);
                }
            })
            .catch(() => { });
    }, [owner, slug]);

    const handleStar = async () => {
        if (!user) {
            login();
            return;
        }
        if (starLoading) return;

        setStarLoading(true);
        try {
            const method = starred ? 'DELETE' : 'POST';
            const res = await fetch(`${API_BASE}/api/skills/${owner}/${slug}/star`, {
                method,
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                setStarred(data.starred);
                setStarCount(data.count);
            }
        } catch (err) {
            console.error('Star error:', err);
        } finally {
            setStarLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown';
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatRelativeDate = (timestamp) => {
        if (!timestamp) return '';
        const now = Date.now();
        const diff = now - timestamp;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        if (days < 365) return `${Math.floor(days / 30)} months ago`;
        return formatDate(timestamp);
    };

    // Render markdown to HTML
    const renderMarkdown = (content) => {
        if (!content) return '';
        marked.setOptions({ breaks: true, gfm: true });
        return marked.parse(content);
    };

    const handleVersionDownload = (version) => {
        window.open(`/api/skills/${owner}/${slug}/download?version=${version}`, '_blank');
    };

    if (loading) {
        return (
            <div className="skill-detail">
                <div className="container">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading skill...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !skill) {
        return (
            <div className="skill-detail">
                <div className="container">
                    <Link to="/" className="back-link">
                        ← Back to Skills
                    </Link>
                    <div className="empty-state">
                        <div className="empty-icon">🔍</div>
                        <h3 className="empty-title">Skill Not Found</h3>
                        <p className="empty-description">
                            {error || `Could not find skill "${owner}/${slug}"`}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'files', label: 'Files' },
        ...(skill.history && skill.history.length > 0
            ? [{ id: 'versions', label: `Versions (${skill.history.length})` }]
            : []),
        { id: 'comments', label: '💬 Comments' }
    ];

    return (
        <div className="skill-detail fade-in">
            <div className="container">
                <Link to="/" className="back-link">
                    ← Back to Skills
                </Link>

                {/* Two Column Layout */}
                <div className="skill-detail-layout">
                    {/* Left: Skill Info */}
                    <div className="skill-detail-main">
                        <header className="skill-detail-header">
                            <div className="skill-title-row">
                                <h1 className="skill-detail-title">
                                    {skill.displayName || skill.slug}
                                </h1>
                                <button
                                    className={`star-btn ${starred ? 'starred' : ''}`}
                                    onClick={handleStar}
                                    disabled={starLoading}
                                    title={starred ? 'Unstar' : 'Star'}
                                >
                                    <span className="star-icon">{starred ? '★' : '☆'}</span>
                                    <span className="star-count">{starCount}</span>
                                </button>
                            </div>

                            <div className="skill-detail-meta">
                                <div className="meta-item">
                                    <span>👤</span>
                                    <Link
                                        to={`/author/${skill.owner}`}
                                        className="meta-link"
                                    >
                                        {skill.owner}
                                    </Link>
                                </div>

                                {skill.version && (
                                    <div className="meta-item">
                                        <span>📦</span>
                                        <span className="version-badge">v{skill.version}</span>
                                    </div>
                                )}

                                {skill.publishedAt && (
                                    <div className="meta-item">
                                        <span>📅</span>
                                        <span>{formatDate(skill.publishedAt)}</span>
                                    </div>
                                )}

                                {skill.license && (
                                    <div className="meta-item">
                                        <span>📜</span>
                                        <span className="license-badge">{skill.license}</span>
                                    </div>
                                )}
                            </div>

                            {skill.description && (
                                <p className="skill-detail-description">
                                    {skill.description}
                                </p>
                            )}
                        </header>

                        {/* Tab Navigation */}
                        <div className="skill-tabs">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`skill-tab ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="skill-tab-content">
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <>
                                    {skill.body && (
                                        <section className="markdown-content">
                                            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(skill.body) }} />
                                        </section>
                                    )}
                                    {!skill.body && skill.readme && (
                                        <section className="markdown-content">
                                            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(skill.readme) }} />
                                        </section>
                                    )}
                                    {!skill.body && !skill.readme && (
                                        <div className="empty-state">
                                            <div className="empty-icon">📝</div>
                                            <p>No documentation available</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Files Tab */}
                            {activeTab === 'files' && (
                                <FileBrowser owner={owner} slug={slug} />
                            )}

                            {/* Versions Tab */}
                            {activeTab === 'versions' && skill.history && (
                                <div className="versions-list">
                                    {skill.history.map((h, i) => (
                                        <div key={i} className="version-card">
                                            <div className="version-card-left">
                                                <span className="version-tag">v{h.version}</span>
                                                <span className="version-date">{formatRelativeDate(h.publishedAt)}</span>
                                            </div>
                                            <div className="version-card-right">
                                                {h.commit && (
                                                    <a
                                                        href={h.commit}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="version-commit-link"
                                                        title="View commit"
                                                    >
                                                        🔗 Commit
                                                    </a>
                                                )}
                                                <button
                                                    className="version-download-btn"
                                                    onClick={() => handleVersionDownload(h.version)}
                                                    title={`Download v${h.version}`}
                                                >
                                                    📦 ZIP
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Comments Tab */}
                            {activeTab === 'comments' && (
                                <CommentSection owner={owner} slug={slug} />
                            )}
                        </div>
                    </div>

                    {/* Right: Install Section + Security */}
                    <aside className="skill-detail-sidebar">
                        <SkillInstallSection skill={skill} />

                        {/* Security Badge */}
                        {security && (
                            <div className={`security-card security-${security.color}`}>
                                <div className="security-header">
                                    <span className="security-icon">🛡️</span>
                                    <span className="security-title">Security Scan</span>
                                </div>
                                <div className="security-score">
                                    <span className={`security-grade grade-${security.color}`}>
                                        {security.grade}
                                    </span>
                                    <span className="security-points">{security.score}/100</span>
                                </div>
                                {security.findings.length > 0 && (
                                    <div className="security-findings">
                                        {security.findings.map((f, i) => (
                                            <div key={i} className={`security-finding severity-${f.severity}`}>
                                                <span className="finding-label">{f.label}</span>
                                                <span className="finding-points">{f.points}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {security.findings.length === 0 && (
                                    <div className="security-clean">
                                        ✅ No risks detected
                                    </div>
                                )}
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
}

export default SkillPage;
