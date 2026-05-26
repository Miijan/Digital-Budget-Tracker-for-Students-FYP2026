import React, { useState } from 'react';
import { formatRM } from '../styles/theme';

function UpdateGoalModal({ isOpen, goal, onConfirm, onCancel }) {
    const [amount, setAmount] = useState('');

    if (!isOpen || !goal) return null;

    const saved = parseFloat(goal.saved_amount) || 0;
    const target = parseFloat(goal.target_amount) || 0;
    const percentage = target > 0 ? Math.min((saved / target) * 100, 100) : 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;
        onConfirm(parseFloat(amount));
        setAmount('');
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#1E293B' }}>
                    Update Goal
                </h3>
                <p style={{ margin: '0 0 20px 0', color: '#64748B', fontSize: '14px' }}>
                    {goal.goal_name}
                </p>

                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B', marginBottom: '6px' }}>
                        <span>RM {formatRM(saved)} saved</span>
                        <span>RM {formatRM(target)} target</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${percentage}%`, backgroundColor: percentage >= 100 ? '#16A34A' : '#2563EB' }}
                        />
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                        {percentage.toFixed(0)}% complete
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B', display: 'block', marginBottom: '6px' }}>
                        How much are you adding today? (RM)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="input"
                        placeholder="e.g. 50.00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        autoFocus
                        required
                        style={{ marginBottom: '20px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-ghost" onClick={() => { setAmount(''); onCancel(); }}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Add Savings</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UpdateGoalModal;
