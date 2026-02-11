import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function ThemeSwitcher() {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'system';
    });

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const applyTheme = (t) => {
        const root = document.documentElement;
        if (t === 'light') {
            root.setAttribute('data-theme', 'light');
        } else if (t === 'dark') {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.removeAttribute('data-theme');
        }
        localStorage.setItem('theme', t);
    };

    const handleChange = (newTheme) => {
        setTheme(newTheme);
    };

    return (
        <div className="theme-switcher">
            <button
                className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
                onClick={() => handleChange('system')}
                title="System"
                aria-label="System theme"
            >
                💻
            </button>
            <button
                className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => handleChange('light')}
                title="Light"
                aria-label="Light theme"
            >
                ☀️
            </button>
            <button
                className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => handleChange('dark')}
                title="Dark"
                aria-label="Dark theme"
            >
                🌙
            </button>
        </div>
    );
}

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
                    <ThemeSwitcher />
                </nav>
            </div>
        </header>
    );
}

export default Header;
