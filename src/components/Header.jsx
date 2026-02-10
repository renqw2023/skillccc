import { Link } from 'react-router-dom';

function Header() {
    return (
        <header className="header">
            <div className="container header-content">
                <Link to="/" className="logo">
                    <span className="logo-icon brand-mark">
                        <span className="brand-c">C</span>
                    </span>
                    <span className="brand-name">
                        <span className="brand-ccc">ccc</span>
                        <span className="brand-dot">.onl</span>
                    </span>
                </Link>

                <nav className="nav-links">
                    <a
                        href="https://github.com/renqw2023/skills"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nav-link"
                    >
                        GitHub
                    </a>
                    <a
                        href="https://github.com/renqw2023/skills#readme"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nav-link"
                    >
                        Docs
                    </a>
                </nav>
            </div>
        </header>
    );
}

export default Header;
