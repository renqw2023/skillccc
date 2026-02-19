import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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

function UserMenu() {
    const { user, login, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) {
        return (
            <button className="github-login-btn" onClick={login}>
                <svg height="18" width="18" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                </svg>
                Login
            </button>
        );
    }

    return (
        <div className="user-menu" ref={menuRef}>
            <button className="user-avatar-btn" onClick={() => setOpen(!open)}>
                <img src={user.avatar_url} alt={user.username} className="user-avatar-img" />
            </button>
            {open && (
                <div className="user-dropdown">
                    <div className="user-dropdown-header">
                        <img src={user.avatar_url} alt={user.username} className="dropdown-avatar" />
                        <span className="dropdown-username">{user.username}</span>
                    </div>
                    <div className="user-dropdown-divider" />
                    <Link to={`/author/${user.username}`} className="user-dropdown-item" onClick={() => setOpen(false)}>
                        👤 My Profile
                    </Link>
                    <button className="user-dropdown-item" onClick={() => { logout(); setOpen(false); }}>
                        🚪 Logout
                    </button>
                </div>
            )}
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
                    <UserMenu />
                </nav>
            </div>
        </header>
    );
}

export default Header;
