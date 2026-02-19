import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE = 'http://localhost:3001';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check login status on mount
        fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.user) {
                    setUser(data.user);
                }
            })
            .catch(err => console.error('Auth check failed:', err))
            .finally(() => setLoading(false));

        // Handle OAuth redirect
        const params = new URLSearchParams(window.location.search);
        if (params.get('login') === 'success') {
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const login = () => {
        window.location.href = `${API_BASE}/api/auth/github`;
    };

    const logout = async () => {
        try {
            await fetch(`${API_BASE}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            setUser(null);
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
