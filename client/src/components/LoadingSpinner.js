import React from 'react';

function LoadingSpinner({ message = 'Loading...' }) {
    return (
        <div className="spinner-container">
            <div className="spinner"></div>
            <p style={{ color: '#64748B', fontSize: '15px', margin: 0 }}>{message}</p>
        </div>
    );
}

export default LoadingSpinner;
