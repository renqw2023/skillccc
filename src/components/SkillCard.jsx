import { Link } from 'react-router-dom';

function SkillCard({ skill, viewMode = 'cards' }) {
    const {
        owner,
        slug,
        displayName,
        description,
        version,
        publishedAt,
        downloadCount,
        versionCount
    } = skill;

    // Format date
    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        if (days < 365) return `${Math.floor(days / 30)} months ago`;
        return date.toLocaleDateString();
    };

    // Format large numbers
    const formatCount = (count) => {
        if (!count && count !== 0) return '0';
        if (count >= 1000) {
            return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }
        return count.toString();
    };

    // Get initials for avatar
    const getInitials = (name) => {
        return name.slice(0, 2).toUpperCase();
    };

    const isList = viewMode === 'list';

    return (
        <Link to={`/skill/${owner}/${slug}`} className={`skill-card ${isList ? 'list-mode' : ''}`}>
            <div className="skill-card-content">
                <div className="skill-header">
                    <h3 className="skill-name">{displayName || slug}</h3>
                    {version && (
                        <span className="skill-version">v{version}</span>
                    )}
                </div>

                <p className="skill-description">
                    {description || 'No description available'}
                </p>

                <div className="skill-footer">
                    <div className="skill-author">
                        <span className="author-avatar">{getInitials(owner)}</span>
                        <span>{owner}</span>
                    </div>

                    <div className="skill-metrics">
                        <span className="metric-item" title="Downloads">
                            ↓ {formatCount(downloadCount)}
                        </span>
                        {(versionCount || (skill.history && skill.history.length > 0)) && (
                            <span className="metric-item" title="Versions">
                                ↑ {versionCount || skill.history?.length || 0}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default SkillCard;
