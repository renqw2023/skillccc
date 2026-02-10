import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function HighlightedSkills() {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHighlighted();
    }, []);

    const fetchHighlighted = async () => {
        try {
            const res = await fetch('/api/skills/highlighted');
            const data = await res.json();
            if (data.success) {
                setSkills(data.skills);
            }
        } catch (err) {
            console.error('Failed to fetch highlighted skills:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDownloads = (count) => {
        if (count >= 1000) {
            return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }
        return count;
    };

    if (loading) return null;
    if (skills.length === 0) return null;

    return (
        <section className="highlighted-section">
            <div className="highlighted-header">
                <h2 className="highlighted-title">Highlighted skills</h2>
                <p className="highlighted-subtitle">
                    Curated signal — highlighted for quick trust.
                </p>
            </div>

            <div className="highlighted-grid">
                {skills.map(skill => (
                    <Link
                        key={skill.id}
                        to={`/skill/${skill.owner}/${skill.slug}`}
                        className="highlighted-card"
                    >
                        <span className="highlighted-badge">Highlighted</span>

                        <h3 className="highlighted-skill-name">
                            {skill.displayName || skill.slug}
                        </h3>

                        <p className="highlighted-skill-desc">
                            {skill.description || 'No description available'}
                        </p>

                        <div className="highlighted-stats">
                            <span className="stat-item">
                                ↓ {formatDownloads(skill.downloadCount)}
                            </span>
                            <span className="stat-item">
                                by {skill.owner}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

export default HighlightedSkills;
