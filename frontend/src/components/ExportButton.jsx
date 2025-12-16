import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './ExportButton.css';

export default function ExportButton({ filters = {} }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const handleExport = async (format) => {
        setLoading(true);
        setShowMenu(false);

        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams(filters).toString();
            const url = `/api/export/tickets/${format}?${params}`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            // Create download link
            const blob = new Blob([response.data]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `tickets_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            alert(`Arquivo ${format.toUpperCase()} baixado com sucesso!`);
        } catch (error) {
            console.error('Error exporting:', error);
            alert('Erro ao exportar arquivo: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="export-button-container">
            <button
                className="export-button"
                onClick={() => setShowMenu(!showMenu)}
                disabled={loading}
            >
                {loading ? (
                    <>
                        <span className="spinner"></span>
                        Exportando...
                    </>
                ) : (
                    <>
                        📥 Exportar
                    </>
                )}
            </button>

            {showMenu && !loading && (
                <div className="export-menu">
                    <button onClick={() => handleExport('excel')} className="export-option">
                        <span className="icon">📊</span>
                        <div className="option-text">
                            <strong>Excel</strong>
                            <small>Formato .xlsx</small>
                        </div>
                    </button>
                    <button onClick={() => handleExport('pdf')} className="export-option">
                        <span className="icon">📄</span>
                        <div className="option-text">
                            <strong>PDF</strong>
                            <small>Formato .pdf</small>
                        </div>
                    </button>
                </div>
            )}

            {showMenu && <div className="export-overlay" onClick={() => setShowMenu(false)}></div>}
        </div>
    );
}
