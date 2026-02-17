import { useState, useEffect } from 'react';

function FileBrowser({ owner, slug }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState('');
    const [loadingContent, setLoadingContent] = useState(false);

    useEffect(() => {
        const fetchFiles = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/skills/${owner}/${slug}/files`);
                const data = await response.json();
                if (data.success) {
                    setFiles(data.files || []);
                } else {
                    setError(data.error || 'Failed to load files');
                }
            } catch (err) {
                setError('Failed to fetch files');
                console.error('Files fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchFiles();
    }, [owner, slug]);

    const handleFileClick = async (file) => {
        if (file.type === 'dir') return;

        if (selectedFile?.name === file.name) {
            setSelectedFile(null);
            setFileContent('');
            return;
        }

        setSelectedFile(file);
        setLoadingContent(true);
        try {
            const response = await fetch(`/api/skills/${owner}/${slug}/files/${file.name}`);
            const data = await response.json();
            if (data.success) {
                setFileContent(data.content);
            } else {
                setFileContent('// Failed to load file content');
            }
        } catch (err) {
            setFileContent('// Error loading file');
        } finally {
            setLoadingContent(false);
        }
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getFileIcon = (file) => {
        if (file.type === 'dir') return '📁';
        const ext = file.name.split('.').pop()?.toLowerCase();
        const icons = {
            'md': '📝', 'json': '📋', 'js': '🟨', 'jsx': '⚛️',
            'ts': '🔷', 'tsx': '⚛️', 'py': '🐍', 'yaml': '⚙️',
            'yml': '⚙️', 'txt': '📄', 'css': '🎨', 'html': '🌐',
            'sh': '🖥️', 'toml': '⚙️', 'lock': '🔒'
        };
        return icons[ext] || '📄';
    };

    if (loading) {
        return (
            <div className="file-browser">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading files...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="file-browser">
                <div className="empty-state">
                    <div className="empty-icon">⚠️</div>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="file-browser">
            <div className="file-list">
                {files.map((file) => (
                    <div key={file.name} className="file-item-wrapper">
                        <div
                            className={`file-item ${file.type === 'dir' ? 'is-dir' : ''} ${selectedFile?.name === file.name ? 'active' : ''}`}
                            onClick={() => handleFileClick(file)}
                        >
                            <span className="file-icon">{getFileIcon(file)}</span>
                            <span className="file-name">{file.name}</span>
                            {file.type === 'file' && (
                                <span className="file-size">{formatSize(file.size)}</span>
                            )}
                        </div>

                        {selectedFile?.name === file.name && (
                            <div className="file-content-panel">
                                {loadingContent ? (
                                    <div className="file-content-loading">Loading...</div>
                                ) : (
                                    <pre className="file-content-code"><code>{fileContent}</code></pre>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {files.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">📂</div>
                    <p>No files found</p>
                </div>
            )}
        </div>
    );
}

export default FileBrowser;
