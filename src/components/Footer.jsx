function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-divider"></div>

                <div className="footer-content">
                    <div className="footer-brand">
                        <span className="footer-logo">
                            <span className="brand-c-small">C</span>
                        </span>
                        <span className="footer-brand-text">ccc.onl</span>
                    </div>

                    <div className="footer-links">
                        <a
                            href="https://github.com/renqw2023/skills"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="footer-link"
                        >
                            GitHub
                        </a>
                        <span className="footer-separator">•</span>
                        <a
                            href="https://github.com/renqw2023/skills#readme"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="footer-link"
                        >
                            Documentation
                        </a>
                        <span className="footer-separator">•</span>
                        <a
                            href="mailto:contact@ccc.onl"
                            className="footer-link"
                        >
                            Contact
                        </a>
                    </div>

                    <p className="footer-text">
                        © {currentYear} ccc.onl — Skills Registry for AI Agents
                    </p>

                    <p className="footer-credits">
                        Data synced from{' '}
                        <a
                            href="https://github.com/renqw2023/skills"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="footer-link"
                        >
                            renqw2023/skills
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
