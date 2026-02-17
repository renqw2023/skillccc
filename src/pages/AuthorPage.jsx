import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SkillCard from '../components/SkillCard';

function AuthorPage() {
    const { username } = useParams();
    const [author, setAuthor] = useState(null);
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAuthor = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/authors/${username}`);
                const data = await response.json();
                if (data.success) {
                    setAuthor(data.author);
                    setSkills(data.skills || []);
                } else {
                    setError(data.error || 'Author not found');
                }
            } catch (err) {
                setError('Failed to load author profile');
                console.error('Author fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAuthor();
    }, [username]);

    if (loading) {
        return (
            <div className="author-page">
                <div className="container">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !author) {
        return (
            <div className="author-page">
                <div className="container">
                    <Link to="/" className="back-link">← Back to Skills</Link>
                    <div className="empty-state">
                        <div className="empty-icon">👤</div>
                        <h3 className="empty-title">Author Not Found</h3>
                        <p className="empty-description">
                            {error || `No skills found for "${username}"`}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="author-page fade-in">
            <div className="container">
                <Link to="/" className="back-link">← Back to Skills</Link>

                {/* Author Profile Header */}
                <div className="author-profile">
                    <img
                        src={author.avatarUrl}
                        alt={author.username}
                        className="author-profile-avatar"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="author-profile-info">
                        <h1 className="author-profile-name">{author.username}</h1>
                        <a
                            href={author.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="author-github-link"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            View on GitHub
                        </a>

                        <div className="author-profile-stats">
                            <div className="author-stat">
                                <span className="author-stat-value">{author.skillCount}</span>
                                <span className="author-stat-label">Skills</span>
                            </div>
                            <div className="author-stat">
                                <span className="author-stat-value">{author.totalDownloads}</span>
                                <span className="author-stat-label">Downloads</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Skills Grid */}
                <section className="author-skills-section">
                    <h2 className="section-title">Published Skills</h2>
                    <div className="skills-grid grid">
                        {skills.map((skill) => (
                            <SkillCard key={skill.id} skill={skill} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default AuthorPage;
