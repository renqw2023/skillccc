import { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import SkillCard from '../components/SkillCard';
import InstallCard from '../components/InstallCard';
import HighlightedSkills from '../components/HighlightedSkills';

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
    const [sortBy, setSortBy] = useState('newest');
    const [sortOrder, setSortOrder] = useState('desc');
    const [viewMode, setViewMode] = useState('cards');
    const [highlightedOnly, setHighlightedOnly] = useState(false);

    // Fetch skills
    const fetchSkills = async (page = 1, searchQuery = '', sort = sortBy, order = sortOrder, highlighted = highlightedOnly) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '24',
                sort,
                order,
                ...(searchQuery && { search: searchQuery }),
                ...(highlighted && { highlighted: 'true' })
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
        fetchSkills(1, '', sortBy, sortOrder, highlightedOnly);
        fetchStats();
    }, []);

    const handleSearch = (query) => {
        setSearch(query);
        fetchSkills(1, query, sortBy, sortOrder, highlightedOnly);
    };

    const handlePageChange = (newPage) => {
        fetchSkills(newPage, search, sortBy, sortOrder, highlightedOnly);
        window.scrollTo({ top: 400, behavior: 'smooth' });
    };

    const handleSortChange = (newSort) => {
        setSortBy(newSort);
        fetchSkills(1, search, newSort, sortOrder, highlightedOnly);
    };

    const handleOrderToggle = () => {
        const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
        setSortOrder(newOrder);
        fetchSkills(1, search, sortBy, newOrder, highlightedOnly);
    };

    const handleHighlightedToggle = () => {
        const newVal = !highlightedOnly;
        setHighlightedOnly(newVal);
        fetchSkills(1, search, sortBy, sortOrder, newVal);
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

            {/* Highlighted Skills */}
            <HighlightedSkills />

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

                {/* Toolbar: Sort + Filter + View */}
                <div className="skills-toolbar">
                    <div className="toolbar-left">
                        {/* Sort Dropdown */}
                        <div className="sort-group">
                            <select
                                className="sort-select"
                                value={sortBy}
                                onChange={(e) => handleSortChange(e.target.value)}
                            >
                                <option value="newest">Newest</option>
                                <option value="updated">Recently updated</option>
                                <option value="downloads">Downloads</option>
                                <option value="name">Name</option>
                            </select>
                            <button
                                className="sort-order-btn"
                                onClick={handleOrderToggle}
                                title={sortOrder === 'desc' ? 'Descending' : 'Ascending'}
                            >
                                {sortOrder === 'desc' ? '↓' : '↑'}
                            </button>
                        </div>

                        {/* Highlighted Filter */}
                        <button
                            className={`filter-btn ${highlightedOnly ? 'active' : ''}`}
                            onClick={handleHighlightedToggle}
                        >
                            ⭐ Highlighted
                        </button>
                    </div>

                    <div className="toolbar-right">
                        {/* View Mode Toggle */}
                        <div className="view-toggle">
                            <button
                                className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                                onClick={() => setViewMode('cards')}
                                title="Cards view"
                            >
                                ▦
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                title="List view"
                            >
                                ☰
                            </button>
                        </div>
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
                                : highlightedOnly
                                    ? 'No highlighted skills yet. Download some skills first!'
                                    : 'No skills available. Run "npm run sync" to fetch data from GitHub.'
                            }
                        </p>
                    </div>
                ) : (
                    <>
                        <div className={viewMode === 'cards' ? 'skills-grid grid' : 'skills-list'}>
                            {skills.map((skill) => (
                                <SkillCard key={skill.id} skill={skill} viewMode={viewMode} />
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
