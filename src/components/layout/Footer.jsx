import React from 'react';

const Footer = () => {
    return (
        <footer style={{
            backgroundColor: 'var(--surface-color)',
            padding: '2rem 0',
            marginTop: 'auto',
            borderTop: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            textAlign: 'center'
        }}>
            <div className="container">
                <p>© {new Date().getFullYear()} QuickDiagnosis. All rights reserved.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    Disclaimer: This is for demonstration purposes only. Always consult a real doctor.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
