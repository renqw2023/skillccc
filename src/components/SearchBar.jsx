import { useState, useCallback } from 'react';

function SearchBar({ onSearch, placeholder = "Search skills..." }) {
    const [value, setValue] = useState('');

    // Debounce search
    const debounce = useCallback((func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }, []);

    const debouncedSearch = useCallback(
        debounce((query) => {
            onSearch(query);
        }, 300),
        [onSearch]
    );

    const handleChange = (e) => {
        const newValue = e.target.value;
        setValue(newValue);
        debouncedSearch(newValue);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setValue('');
            onSearch('');
        }
    };

    return (
        <div className="search-container">
            <div className="search-wrapper">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    className="search-input"
                    placeholder={placeholder}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                />
                <span className="search-shortcut">ESC to clear</span>
            </div>
        </div>
    );
}

export default SearchBar;
