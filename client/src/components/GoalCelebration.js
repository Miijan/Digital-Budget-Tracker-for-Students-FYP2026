function GoalCelebration({ isOpen, goalName, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '12px', lineHeight: 1 }}>
                    🎉🏆🎉
                </div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#1E293B' }}>
                    Goal Achieved!
                </h2>
                <p style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#16A34A', fontWeight: '600' }}>
                    Congratulations! 🥳
                </p>
                <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748B', lineHeight: '1.5' }}>
                    You've reached your savings goal for <strong style={{ color: '#1E293B' }}>"{goalName}"</strong>!
                    <br />Great job staying disciplined with your savings!
                </p>
                <button className="btn btn-success" onClick={onClose} style={{ padding: '12px 32px', fontSize: '15px' }}>
                    Awesome! ✨
                </button>
            </div>
        </div>
    );
}

export default GoalCelebration;
