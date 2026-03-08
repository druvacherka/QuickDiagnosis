import React from 'react';
import { Check, Clock, AlertCircle, Info } from 'lucide-react';

const NotificationCard = ({ notification, onMarkAsRead }) => {
    const { id, type, title, message, precautions, timestamp, read } = notification;

    const getTimeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div style={{
            padding: '1rem',
            borderBottom: '1px solid var(--border-color)',
            background: read ? 'transparent' : '#f0f9ff',
            transition: 'background 0.2s ease',
            position: 'relative'
        }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{
                    marginTop: '2px',
                    color: type === 'disease' ? 'var(--primary-color)' : '#10b981'
                }}>
                    {type === 'disease' ? <AlertCircle size={18} /> : <Info size={18} />}
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {title}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {getTimeAgo(timestamp)}
                        </span>
                    </div>

                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        {message}
                    </p>

                    {precautions && precautions.length > 0 && (
                        <div style={{
                            background: 'white',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            marginTop: '0.5rem'
                        }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Precautions:</span>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {precautions.map((p, i) => (
                                    <li key={i} style={{ marginBottom: '2px' }}>{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {!read && (
                        <button
                            onClick={() => onMarkAsRead(id)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--primary-color)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '4px 0',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '0.5rem'
                            }}
                        >
                            <Check size={14} /> Mark as read
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationCard;
