import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import UpdateGoalModal from '../components/UpdateGoalModal';
import RefundGoalModal from '../components/RefundGoalModal';
import GoalCelebration from '../components/GoalCelebration';
import { colors, formatRM } from '../styles/theme';
import { API_BASE } from '../config';

function Goals() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [goals, setGoals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // UI states
    const [showPastGoals, setShowPastGoals] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [error, setError] = useState('');

    // Modal states
    const [updateGoal, setUpdateGoal] = useState(null);
    const [refundGoal, setRefundGoal] = useState(null);
    const [deleteGoalId, setDeleteGoalId] = useState(null);
    const [celebrationGoal, setCelebrationGoal] = useState(null);

    // Form states
    const [goalName, setGoalName] = useState('');
    const [description, setDescription] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [deadline, setDeadline] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) { navigate('/'); return; }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchGoals(parsedUser.user_id);
    }, [navigate]);

    const fetchGoals = async (userId) => {
        try {
            const res = await axios.get(`${API_BASE}/goals/${userId}`);
            setGoals(res.data);
        } catch (err) {
            setError('Failed to load goals');
        } finally {
            setIsLoading(false);
        }
    };

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 4000);
    };

    // --- HANDLERS ---
    const handleAddGoal = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/add-goal`, {
                user_id: user.user_id,
                goal_name: goalName,
                description: description,
                target_amount: parseFloat(targetAmount),
                deadline: deadline
            });
            setGoalName(''); setDescription(''); setTargetAmount(''); setDeadline('');
            setShowAddForm(false);
            showSuccess('Goal added successfully!');
            fetchGoals(user.user_id);
        } catch (err) {
            setError('Failed to add goal');
        }
    };

    const handleUpdateGoal = async (amount) => {
        if (!updateGoal) return;
        try {
            await axios.put(`${API_BASE}/update-goal/${updateGoal.goal_id}`, {
                add_amount: amount
            });
            await axios.post(`${API_BASE}/add-expense`, {
                user_id: user.user_id,
                category_id: 6,
                amount: amount,
                date: new Date().toISOString().split('T')[0],
                description: updateGoal.goal_name
            });

            // Check if goal just reached 100%
            const oldSaved = parseFloat(updateGoal.saved_amount) || 0;
            const target = parseFloat(updateGoal.target_amount) || 0;
            const wasComplete = oldSaved >= target;
            const newSaved = oldSaved + amount;

            setUpdateGoal(null);
            showSuccess(`RM ${formatRM(amount)} added to your goal! It has been logged as an expense.`);
            fetchGoals(user.user_id);

            // Show celebration if goal just completed
            if (!wasComplete && newSaved >= target) {
                setCelebrationGoal(updateGoal.goal_name);
            }
        } catch (err) {
            setError('Failed to update goal');
        }
    };

    const handleRefundGoal = async (refundAmount) => {
        if (!refundGoal) return;
        try {
            // 1. Deduct from goal's saved_amount
            await axios.put(`${API_BASE}/update-goal/${refundGoal.goal_id}`, {
                add_amount: -refundAmount
            });
            // 2. Add negative expense to return money to budget
            await axios.post(`${API_BASE}/add-expense`, {
                user_id: user.user_id,
                category_id: 6,
                amount: -refundAmount,
                date: new Date().toISOString().split('T')[0],
                description: `Refund: ${refundGoal.goal_name}`
            });
            setRefundGoal(null);
            showSuccess(`RM ${formatRM(refundAmount)} refunded from "${refundGoal.goal_name}". The money has been returned to your budget.`);
            fetchGoals(user.user_id);
        } catch (err) {
            setError('Failed to process refund');
        }
    };

    const handleDelete = async () => {
        if (!deleteGoalId) return;
        try {
            await axios.delete(`${API_BASE}/delete-goal/${deleteGoalId}`);
            setDeleteGoalId(null);
            showSuccess('Goal deleted');
            fetchGoals(user.user_id);
        } catch (err) {
            setError('Failed to delete goal');
        }
    };

    // --- FILTER GOALS ---
    const activeGoals = goals.filter(g => parseFloat(g.saved_amount) < parseFloat(g.target_amount));
    const pastGoals = goals.filter(g => parseFloat(g.saved_amount) >= parseFloat(g.target_amount));
    const goalsToDisplay = showPastGoals ? pastGoals : activeGoals;

    const getDaysLeft = (deadline, isCompleted) => {
        if (!deadline) return null;
        const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
        if (isCompleted) {
            if (diff > 0) return { text: `Completed ${diff} days early`, color: colors.success };
            if (diff === 0) return { text: 'Completed on time', color: colors.success };
            return { text: 'Completed', color: colors.success };
        }
        if (diff < 0) return { text: 'Overdue', color: colors.danger };
        if (diff === 0) return { text: 'Due today', color: colors.warning };
        return { text: `${diff} days left`, color: diff <= 7 ? colors.warning : colors.textSecondary };
    };

    if (!user || isLoading) return <LoadingSpinner />;

    return (
        <PageLayout>
            {/* Alerts */}
            {successMsg && (
                <div className="alert alert-success">
                    <span>{successMsg}</span>
                    <button className="alert-dismiss" onClick={() => setSuccessMsg('')}>&times;</button>
                </div>
            )}
            {error && (
                <div className="alert alert-error">
                    <span>{error}</span>
                    <button className="alert-dismiss" onClick={() => setError('')}>&times;</button>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', color: colors.textPrimary }}>
                    {showPastGoals ? 'Completed Goals' : 'Active Goals'}
                </h2>
                <div className="segmented-control">
                    <button className={`segmented-btn ${!showPastGoals ? 'active' : ''}`} onClick={() => setShowPastGoals(false)}>
                        Active ({activeGoals.length})
                    </button>
                    <button className={`segmented-btn ${showPastGoals ? 'active' : ''}`} onClick={() => setShowPastGoals(true)}>
                        Completed ({pastGoals.length})
                    </button>
                </div>
            </div>

            {/* Goals Table */}
            {goalsToDisplay.length === 0 ? (
                <EmptyState
                    icon={showPastGoals ? '🏆' : '🎯'}
                    title={showPastGoals ? 'No completed goals yet' : 'No active goals'}
                    message={showPastGoals ? 'Keep saving towards your goals!' : 'Create a new goal to start saving.'}
                />
            ) : (
                <div className="table-container" style={{ marginBottom: '24px' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Goal Name</th>
                                <th>Description</th>
                                <th>Target</th>
                                <th style={{ width: '22%' }}>Progress</th>
                                <th style={{ textAlign: 'center' }}>Deadline</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {goalsToDisplay.map((goal) => {
                                const saved = parseFloat(goal.saved_amount) || 0;
                                const target = parseFloat(goal.target_amount) || 0;
                                const percentage = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
                                const isCompleted = percentage >= 100;
                                const daysLeft = getDaysLeft(goal.deadline, isCompleted);

                                return (
                                    <tr key={goal.goal_id}>
                                        <td style={{ fontWeight: '600' }}>{goal.goal_name}</td>
                                        <td style={{ color: colors.textSecondary }}>{goal.description}</td>
                                        <td>RM {formatRM(target)}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div className="progress-bar-bg" style={{ flex: 1 }}>
                                                    <div
                                                        className="progress-bar-fill"
                                                        style={{
                                                            width: `${percentage}%`,
                                                            backgroundColor: isCompleted ? colors.success : colors.primary,
                                                        }}
                                                    />
                                                </div>
                                                <span style={{ fontSize: '13px', fontWeight: '600', color: isCompleted ? colors.success : colors.textSecondary, minWidth: '42px' }}>
                                                    {percentage.toFixed(0)}%
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: colors.muted, marginTop: '2px' }}>
                                                RM {formatRM(saved)} saved
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {daysLeft ? (
                                                <span style={{ fontSize: '13px', color: daysLeft.color, fontWeight: '500' }}>
                                                    {daysLeft.text}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                {!isCompleted && (
                                                    <button className="btn btn-primary btn-sm" onClick={() => setUpdateGoal(goal)}>Update</button>
                                                )}
                                                {!isCompleted && saved > 0 && (
                                                    <button className="btn btn-warning btn-sm" onClick={() => setRefundGoal(goal)}>Refund</button>
                                                )}
                                                <button className="btn btn-danger btn-sm" onClick={() => setDeleteGoalId(goal.goal_id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Goal Section */}
            {!showPastGoals && (
                <>
                    <button
                        className={`btn ${showAddForm ? 'btn-secondary' : 'btn-success'}`}
                        onClick={() => setShowAddForm(!showAddForm)}
                    >
                        {showAddForm ? 'Cancel' : '+ Add Goal'}
                    </button>

                    {showAddForm && (
                        <form onSubmit={handleAddGoal} className="card" style={{ marginTop: '16px', padding: '24px' }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: colors.textPrimary }}>New Goal</h3>
                            <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Goal Name</label>
                                    <input className="input" type="text" placeholder="e.g. Logitech Mouse" value={goalName} onChange={e => setGoalName(e.target.value)} required />
                                </div>
                                <div style={{ flex: 2 }}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Description</label>
                                    <input className="input" type="text" placeholder="What is this goal for?" value={description} onChange={e => setDescription(e.target.value)} required />
                                </div>
                            </div>
                            <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Target Amount (RM)</label>
                                    <input className="input" type="number" step="0.01" min="0.01" placeholder="0.00" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Deadline</label>
                                    <input className="input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <button type="submit" className="btn btn-success">Save Goal</button>
                                </div>
                            </div>
                        </form>
                    )}
                </>
            )}

            {/* Modals */}
            <UpdateGoalModal
                isOpen={!!updateGoal}
                goal={updateGoal}
                onConfirm={handleUpdateGoal}
                onCancel={() => setUpdateGoal(null)}
            />
            <RefundGoalModal
                isOpen={!!refundGoal}
                goal={refundGoal}
                onConfirm={handleRefundGoal}
                onCancel={() => setRefundGoal(null)}
            />
            <ConfirmDialog
                isOpen={!!deleteGoalId}
                title="Delete Goal"
                message="Are you sure you want to delete this goal? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteGoalId(null)}
            />
            <GoalCelebration
                isOpen={!!celebrationGoal}
                goalName={celebrationGoal}
                onClose={() => setCelebrationGoal(null)}
            />
        </PageLayout>
    );
}

export default Goals;
