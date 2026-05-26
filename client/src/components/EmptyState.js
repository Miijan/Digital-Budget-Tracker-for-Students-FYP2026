import React from 'react';

function EmptyState({ icon = '📋', title = 'No data yet', message = '' }) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">{icon}</div>
            <div className="empty-state-title">{title}</div>
            {message && <div className="empty-state-message">{message}</div>}
        </div>
    );
}

export default EmptyState;
