import React from 'react';

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Delete', danger = true }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1E293B' }}>{title}</h3>
                <p style={{ margin: '0 0 24px 0', color: '#64748B', fontSize: '14px', lineHeight: '1.5' }}>{message}</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
                    <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog;
