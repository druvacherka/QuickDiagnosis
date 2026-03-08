import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import NotificationCard from './NotificationCard';
import { BellOff, X } from 'lucide-react';

const NotificationPanel = ({ onClose }) => {
    const { notifications, markAsRead, clearAll } = useNotifications();

    return (
        <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.75rem',
            width: '360px',
            maxHeight: '480px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border-color)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '1rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc'
            }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Notifications</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {notifications.length > 0 && (
                        <button
                            onClick={clearAll}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-light)',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            Clear all
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', display: 'flex' }}
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
                {notifications.length > 0 ? (
                    notifications.map(n => (
                        <NotificationCard
                            key={n.id}
                            notification={n}
                            onMarkAsRead={markAsRead}
                        />
                    ))
                ) : (
                    <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-light)' }}>
                        <BellOff size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>No new notifications</p>
                    </div>
                )}
            </div>

            {notifications.length > 0 && (
                <div style={{ padding: '0.75rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', background: '#f8fafc' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                        Stay up to date with your health
                    </span>
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;
