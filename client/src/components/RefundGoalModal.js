import { useState } from 'react';
import { formatRM } from '../styles/theme';

function RefundGoalModal({ isOpen, goal, onConfirm, onCancel }) {
    const [amount, setAmount] = useState('');

    if (!isOpen || !goal) return null;

    const saved = parseFloat(goal.saved_amount) || 0;
    const target = parseFloat(goal.target_amount) || 0;
    const percentage = target > 0 ? Math.min((saved / target) * 100, 100) : 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        const val = parseFloat(amount);
        if (!val || val <= 0 || val > saved) return;
        onConfirm(val);
        setAmount('');
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#1E293B' }}>
                    Refund from Goal
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
                            style={{ width: `${percentage}%`, backgroundColor: '#2563EB' }}
                        />
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B', display: 'block', marginBottom: '6px' }}>
                        How much to withdraw? (RM)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={saved}
                        className="input"
                        placeholder={`Max: RM ${formatRM(saved)}`}
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        autoFocus
                        required
                        style={{ marginBottom: '6px' }}
                    />
                    <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 20px 0' }}>
                        This money will be returned to your budget.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-ghost" onClick={() => { setAmount(''); onCancel(); }}>Cancel</button>
                        <button type="submit" className="btn btn-warning">Withdraw</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RefundGoalModal;
