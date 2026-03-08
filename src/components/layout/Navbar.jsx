import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, User, LogOut, ChevronDown, Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import NotificationPanel from './NotificationPanel';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));

    const { unreadCount, requestPermission } = useNotifications();
    const [showNotifications, setShowNotifications] = React.useState(false);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav style={{
            backgroundColor: 'white',
            borderBottom: '1px solid var(--border-color)',
            padding: '0.75rem 0',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                    <div style={{ background: 'var(--primary-gradient)', padding: '6px', borderRadius: '8px', color: 'white', display: 'flex' }}>
                        <Activity size={20} />
                    </div>
                    QuickDiagnosis
                </Link>

                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    {user ? (
                        <>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Link
                                    to="/dashboard"
                                    className="btn"
                                    style={{
                                        background: isActive('/dashboard') ? '#eff6ff' : 'transparent',
                                        color: isActive('/dashboard') ? 'var(--primary-color)' : 'var(--text-secondary)',
                                        fontWeight: 500
                                    }}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/symptoms"
                                    className="btn"
                                    style={{
                                        background: isActive('/symptoms') ? '#eff6ff' : 'transparent',
                                        color: isActive('/symptoms') ? 'var(--primary-color)' : 'var(--text-secondary)',
                                        fontWeight: 500
                                    }}
                                >
                                    Symptom Checker
                                </Link>
                                <Link
                                    to="/hospitals"
                                    className="btn"
                                    style={{
                                        background: isActive('/hospitals') ? '#eff6ff' : 'transparent',
                                        color: isActive('/hospitals') ? 'var(--primary-color)' : 'var(--text-secondary)',
                                        fontWeight: 500
                                    }}
                                >
                                    Hospitals
                                </Link>
                            </div>

                            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }}></div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <button
                                        className="btn"
                                        style={{ padding: '8px', color: 'var(--text-secondary)', position: 'relative' }}
                                        onClick={() => {
                                            setShowNotifications(!showNotifications);
                                            requestPermission(); // Ask for permission when user interacts with notifications
                                        }}
                                    >
                                        <Bell size={20} />
                                        {unreadCount > 0 && (
                                            <span style={{
                                                position: 'absolute',
                                                top: '4px',
                                                right: '4px',
                                                width: '10px',
                                                height: '10px',
                                                background: '#ef4444',
                                                borderRadius: '50%',
                                                border: '2px solid white'
                                            }}></span>
                                        )}
                                    </button>

                                    {showNotifications && (
                                        <NotificationPanel onClose={() => setShowNotifications(false)} />
                                    )}
                                </div>

                                <div className="dropdown" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Link to="/profile" title="View Profile" style={{ textDecoration: 'none' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '50%', background: '#e0f2fe',
                                            color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 600, transition: 'all 0.2s ease', cursor: 'pointer',
                                            border: isActive('/profile') ? '2px solid var(--primary-color)' : 'none'
                                        }}>
                                            {user.name.charAt(0)}
                                        </div>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="btn"
                                        style={{ padding: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}
                                        title="Logout"
                                    >
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Sign In</Link>
                            <Link to="/register" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }}>Get Started</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
