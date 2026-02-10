import { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import SkillCard from '../components/SkillCard';
import InstallCard from '../components/InstallCard';

function HomePage() {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ totalSkills: 0, totalOwners: 0 });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 24,
        total: 0,
        totalPages: 0
    });
    const [search, setSearch] = useState('');

    // Fetch skills
    const fetchSkills = async (page = 1, searchQuery = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '24',
                ...(searchQuery && { search: searchQuery })
            });

            const response = await fetch(`/api/skills?${params}`);
            const data = await response.json();

            if (data.success) {
                setSkills(data.skills || []);
                setPagination(data.pagination || {});
            } else {
                setError(data.error || 'Failed to fetch skills');
            }
        } catch (err) {
            setError('Failed to connect to server');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch stats
    const fetchStats = async () => {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (err) {
            console.error('Stats fetch error:', err);
        }
    };

    useEffect(() => {
        fetchSkills(1, '');
        fetchStats();
    }, []);

    const handleSearch = (query) => {
        setSearch(query);
        fetchSkills(1, query);
    };

    const handlePageChange = (newPage) => {
        fetchSkills(newPage, search);
        window.scrollTo({ top: 400, behavior: 'smooth' });
    };

    return (
        <>
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-inner">
                    {/* Left: Copy */}
                    <div className="hero-copy fade-up">
                        <h1 className="hero-title">
                            Skills Registry<br />for AI Agents
                        </h1>
                        <p className="hero-subtitle">
                            Discover and share skills for your AI agents.
                            Fast search, real-time updates from GitHub.
                        </p>

                        <div className="hero-stats">
                            <div className="stat-item">
                                <div className="stat-value">{stats.totalSkills.toLocaleString()}</div>
                                <div className="stat-label">Skills</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{stats.totalOwners.toLocaleString()}</div>
                                <div className="stat-label">Contributors</div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Install Card */}
                    <div className="hero-card fade-up" data-delay="2">
                        <InstallCard onSearch={handleSearch} />
                    </div>
                </div>
            </section>

            {/* Skills Grid */}
            <section className="skills-section section">
                <div className="skills-header">
                    <div>
                        <h2 className="section-title">
                            {search ? `Results for "${search}"` : 'Latest Skills'}
                        </h2>
                        {pagination.total > 0 && (
                            <p className="section-subtitle">
                                {pagination.total} skill{pagination.total !== 1 ? 's' : ''} available
                            </p>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading skills...</p>
                    </div>
                ) : error ? (
                    <div className="empty-state">
                        <div className="empty-icon">⚠️</div>
                        <h3 className="empty-title">Error</h3>
                        <p className="empty-description">{error}</p>
                        <p className="empty-description" style={{ marginTop: '1rem' }}>
                            Make sure the server is running: <code>npm run dev:server</code>
                        </p>
                    </div>
                ) : skills.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h3 className="empty-title">No skills found</h3>
                        <p className="empty-description">
                            {search
                                ? `No skills match "${search}". Try a different search term.`
                                : 'No skills available. Run "npm run sync" to fetch data from GitHub.'
                            }
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="skills-grid grid">
                            {skills.map((skill) => (
                                <SkillCard key={skill.id} skill={skill} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="pagination-btn btn"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={!pagination.hasPrev}
                                >
                                    ← Previous
                                </button>
                                <span className="pagination-info">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <button
                                    className="pagination-btn btn"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={!pagination.hasNext}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </section>
        </>
    );
}

export default HomePage;
