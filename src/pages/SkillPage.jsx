import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marked } from 'marked';
import SkillInstallSection from '../components/SkillInstallSection';

function SkillPage() {
    const { owner, slug } = useParams();
    const [skill, setSkill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
    }, [owner, slug]);

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown';
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Render markdown to HTML
    const renderMarkdown = (content) => {
        if (!content) return '';

        // Configure marked
        marked.setOptions({
            breaks: true,
            gfm: true
        });

        return marked.parse(content);
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
                            <h1 className="skill-detail-title">
                                {skill.displayName || skill.slug}
                            </h1>

                            <div className="skill-detail-meta">
                                <div className="meta-item">
                                    <span>👤</span>
                                    <a
                                        href={`https://github.com/${skill.owner}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="meta-link"
                                    >
                                        {skill.owner}
                                    </a>
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
                            </div>

                            {skill.description && (
                                <p className="skill-detail-description">
                                    {skill.description}
                                </p>
                            )}
                        </header>

                        {/* Version History */}
                        {skill.history && skill.history.length > 0 && (
                            <section className="skill-section">
                                <h2 className="skill-section-title">Version History</h2>
                                <div className="version-history">
                                    {skill.history.map((h, i) => (
                                        <div key={i} className="version-item">
                                            <span className="version-tag">v{h.version}</span>
                                            <span className="version-date">{formatDate(h.publishedAt)}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Skill Documentation */}
                        {skill.body && (
                            <section className="markdown-content">
                                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(skill.body) }} />
                            </section>
                        )}

                        {/* README fallback */}
                        {!skill.body && skill.readme && (
                            <section className="markdown-content">
                                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(skill.readme) }} />
                            </section>
                        )}
                    </div>

                    {/* Right: Install Section */}
                    <aside className="skill-detail-sidebar">
                        <SkillInstallSection skill={skill} />
                    </aside>
                </div>
            </div>
        </div>
    );
}

export default SkillPage;
