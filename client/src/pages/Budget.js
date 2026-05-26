import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { colors, formatRM } from '../styles/theme';
import { API_BASE } from '../config';

function Budget() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Data states
    const [budget, setBudget] = useState(null);
    const [spentThisMonth, setSpentThisMonth] = useState(0);
    const [incomeSources, setIncomeSources] = useState([]);

    // Form states
    const [showIncomeForm, setShowIncomeForm] = useState(false);
    const [incomeName, setIncomeName] = useState('');
    const [incomeAmount, setIncomeAmount] = useState('');
    const [incomeType, setIncomeType] = useState('Recurring');

    const [showLimitForm, setShowLimitForm] = useState(false);
    const [limit1, setLimit1] = useState('');
    const [limit2, setLimit2] = useState('');

    // Feedback states
    const [successMsg, setSuccessMsg] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) { navigate('/'); return; }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        const savedIncomes = JSON.parse(localStorage.getItem(`incomes_${parsedUser.user_id}`)) || [];
        setIncomeSources(savedIncomes);

        fetchBudgetData(parsedUser.user_id);
    }, [navigate]);

    const fetchBudgetData = async (userId) => {
        try {
            const budgetRes = await axios.get(`${API_BASE}/budget/${userId}`);
            if (budgetRes.data.budget_id) {
                setBudget(budgetRes.data);
                setLimit1(budgetRes.data.alert_limit1);
                setLimit2(budgetRes.data.alert_limit2);
            }

            const expenseRes = await axios.get(`${API_BASE}/expenses/${userId}`);
            const now = new Date();
            const monthlyExpenses = expenseRes.data.filter(exp => {
                const expDate = new Date(exp.date);
                return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
            });
            const totalSpent = monthlyExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
            setSpentThisMonth(totalSpent);
        } catch (err) {
            setError('Failed to load budget data');
        } finally {
            setIsLoading(false);
        }
    };

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    // --- CALCULATIONS (BUG FIXED: no more .toLocaleString() in arithmetic) ---
    const totalIncome = incomeSources.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const safeSpentThisMonth = isNaN(spentThisMonth) ? 0 : spentThisMonth;
    const amountLeft = totalIncome - safeSpentThisMonth;

    // --- HANDLERS (BUG FIXED: store amount as number, not locale string) ---
    const handleAddIncome = async (e) => {
        e.preventDefault();
        const newIncome = {
            id: Date.now(),
            name: incomeName,
            amount: parseFloat(incomeAmount),
            type: incomeType
        };

        const updatedIncomes = [...incomeSources, newIncome];
        setIncomeSources(updatedIncomes);
        localStorage.setItem(`incomes_${user.user_id}`, JSON.stringify(updatedIncomes));

        const newTotal = updatedIncomes.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        updateBackendBudget(newTotal, limit1, limit2);

        setIncomeName(''); setIncomeAmount(''); setShowIncomeForm(false);
        showSuccess('Income source added');
    };

    const handleDeleteIncome = (id) => {
        const updatedIncomes = incomeSources.filter(inc => inc.id !== id);
        setIncomeSources(updatedIncomes);
        localStorage.setItem(`incomes_${user.user_id}`, JSON.stringify(updatedIncomes));

        const newTotal = updatedIncomes.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        updateBackendBudget(newTotal, limit1, limit2);
        showSuccess('Income source removed');
    };

    const handleSetLimits = async (e) => {
        e.preventDefault();
        updateBackendBudget(totalIncome, limit1, limit2);
        setShowLimitForm(false);
        showSuccess('Budget limits updated');
    };

    const updateBackendBudget = async (total, l1, l2) => {
        try {
            await axios.post(`${API_BASE}/set-budget`, {
                user_id: user.user_id,
                total_amount: total,
                alert_limit1: l1 || 0,
                alert_limit2: l2 || 0
            });
            fetchBudgetData(user.user_id);
        } catch (err) {
            setError('Failed to update budget on server');
        }
    };

    if (!user || isLoading) return <LoadingSpinner />;

    const spentPercentage = totalIncome > 0 ? Math.min((safeSpentThisMonth / totalIncome) * 100, 100) : 0;

    return (
        <PageLayout maxWidth="800px">
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

            {/* Metric Cards */}
            <div className="metric-cards" style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                <div className="card" style={{ flex: 1, padding: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Total Budget</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary }}>RM {formatRM(totalIncome)}</div>
                </div>
                <div className="card" style={{ flex: 1, padding: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Spent This Month</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary }}>RM {formatRM(safeSpentThisMonth)}</div>
                </div>
                <div className="card" style={{ flex: 1, padding: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Remaining</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: amountLeft < 0 ? colors.danger : colors.success }}>
                        RM {formatRM(amountLeft)}
                    </div>
                </div>
            </div>

            {/* Budget Usage Bar */}
            {totalIncome > 0 && (
                <div className="card" style={{ padding: '20px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: colors.textSecondary, marginBottom: '8px' }}>
                        <span>Budget Usage</span>
                        <span>{spentPercentage.toFixed(0)}% used</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <div className="progress-bar-bg" style={{ height: '12px' }}>
                            <div
                                className="progress-bar-fill"
                                style={{
                                    width: `${spentPercentage}%`,
                                    height: '12px',
                                    backgroundColor: spentPercentage >= 100 ? colors.danger :
                                        (budget && budget.alert_limit2 > 0 && safeSpentThisMonth >= budget.alert_limit2) ? colors.danger :
                                        (budget && budget.alert_limit1 > 0 && safeSpentThisMonth >= budget.alert_limit1) ? colors.warning :
                                        colors.success,
                                }}
                            />
                        </div>
                        {/* Limit markers */}
                        {budget && budget.alert_limit1 > 0 && totalIncome > 0 && (
                            <div style={{ position: 'absolute', left: `${Math.min((budget.alert_limit1 / totalIncome) * 100, 100)}%`, top: '-4px', bottom: '-4px', width: '2px', backgroundColor: colors.warning, borderRadius: '1px' }} title={`Warning: RM ${budget.alert_limit1}`} />
                        )}
                        {budget && budget.alert_limit2 > 0 && totalIncome > 0 && (
                            <div style={{ position: 'absolute', left: `${Math.min((budget.alert_limit2 / totalIncome) * 100, 100)}%`, top: '-4px', bottom: '-4px', width: '2px', backgroundColor: colors.danger, borderRadius: '1px' }} title={`Danger: RM ${budget.alert_limit2}`} />
                        )}
                    </div>
                    {budget && (budget.alert_limit1 > 0 || budget.alert_limit2 > 0) && (
                        <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px' }}>
                            {budget.alert_limit1 > 0 && (
                                <span style={{ color: colors.warning }}>Warning: RM {formatRM(budget.alert_limit1)}</span>
                            )}
                            {budget.alert_limit2 > 0 && (
                                <span style={{ color: colors.danger }}>Danger: RM {formatRM(budget.alert_limit2)}</span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Income Sources */}
            <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', color: colors.textPrimary, margin: '0 0 16px 0' }}>Income Sources</h3>

                {incomeSources.length === 0 && !showIncomeForm && (
                    <p style={{ color: colors.muted, fontSize: '14px', margin: '0 0 12px 0' }}>No income sources added yet.</p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {incomeSources.map(inc => (
                        <div key={inc.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
                            <div>
                                <span style={{ fontWeight: '600', color: colors.textPrimary }}>RM {formatRM(inc.amount)}</span>
                                <span style={{ color: colors.textSecondary, marginLeft: '8px' }}>from {inc.name}</span>
                                <span className={`badge ${inc.type === 'Recurring' ? 'badge-info' : 'badge-muted'}`} style={{ marginLeft: '10px' }}>
                                    {inc.type}
                                </span>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteIncome(inc.id)} style={{ color: colors.danger, fontSize: '16px' }}>
                                &times;
                            </button>
                        </div>
                    ))}
                </div>

                {!showIncomeForm ? (
                    <button className="btn btn-outline btn-sm" onClick={() => setShowIncomeForm(true)}>
                        + Add Income Source
                    </button>
                ) : (
                    <form onSubmit={handleAddIncome} className="card" style={{ padding: '20px', marginTop: '8px' }}>
                        <div className="form-row mobile-stack" style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Source</label>
                                <input className="input" type="text" placeholder="e.g. Side job" value={incomeName} onChange={e => setIncomeName(e.target.value)} required />
                            </div>
                            <div style={{ flex: 0.7 }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Amount (RM)</label>
                                <input className="input" type="number" step="0.01" min="0.01" placeholder="0.00" value={incomeAmount} onChange={e => setIncomeAmount(e.target.value)} required />
                            </div>
                            <div style={{ flex: 0.8 }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Type</label>
                                <select className="input" value={incomeType} onChange={e => setIncomeType(e.target.value)}>
                                    <option value="Recurring">Recurring (Semester)</option>
                                    <option value="One-time">One-time</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="submit" className="btn btn-success">Save</button>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowIncomeForm(false)}>Cancel</button>
                            </div>
                        </div>
                    </form>
                )}
            </div>

            {/* Budget Limits */}
            <div>
                <h3 style={{ fontSize: '18px', color: colors.textPrimary, margin: '0 0 16px 0' }}>Budget Limits</h3>

                {!showLimitForm ? (
                    <div>
                        {budget && budget.alert_limit1 > 0 ? (
                            <div className="card" style={{ padding: '20px', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                    <div>
                                        <span style={{ fontSize: '13px', color: colors.textSecondary }}>Warning Limit</span>
                                        <div style={{ fontSize: '18px', fontWeight: '600', color: colors.warning }}>RM {formatRM(budget.alert_limit1)}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '13px', color: colors.textSecondary }}>Danger Limit</span>
                                        <div style={{ fontSize: '18px', fontWeight: '600', color: colors.danger }}>RM {formatRM(budget.alert_limit2)}</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: colors.muted, fontSize: '14px', margin: '0 0 12px 0' }}>No limits set yet.</p>
                        )}
                        <button className="btn btn-outline btn-sm" onClick={() => setShowLimitForm(true)}>
                            {budget && budget.alert_limit1 > 0 ? 'Edit Limits' : '+ Set Limits'}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSetLimits} className="card" style={{ padding: '20px', maxWidth: '360px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Warning Limit (RM)</label>
                                <input className="input" type="number" step="0.01" min="0" placeholder="e.g. 800" value={limit1} onChange={e => setLimit1(e.target.value)} required />
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Danger Limit (RM)</label>
                                <input className="input" type="number" step="0.01" min="0" placeholder="e.g. 1000" value={limit2} onChange={e => setLimit2(e.target.value)} required />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="submit" className="btn btn-success" style={{ flex: 1 }}>Save Limits</button>
                                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowLimitForm(false)}>Cancel</button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </PageLayout>
    );
}

export default Budget;
