import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import PageLayout from '../components/PageLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { colors, categoryColors, categoryEmojis, formatRM } from '../styles/theme';
import { API_BASE } from '../config';

ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [totalSpent, setTotalSpent] = useState(0);
    const [budgetLimit, setBudgetLimit] = useState(0);
    const [alert1, setAlert1] = useState(0);
    const [alert2, setAlert2] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Quick add states
    const [quickAmount, setQuickAmount] = useState('');
    const [quickCategory, setQuickCategory] = useState('1');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) { navigate('/'); return; }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchData(parsedUser.user_id);
    }, [navigate]);

    const fetchData = async (userId) => {
        try {
            const res = await axios.get(`${API_BASE}/expenses/${userId}`);
            setExpenses(res.data);

            const now = new Date();
            const monthlyExpenses = res.data.filter(exp => {
                const expDate = new Date(exp.date);
                return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
            });
            const total = monthlyExpenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
            setTotalSpent(total);

            const budgetRes = await axios.get(`${API_BASE}/budget/${userId}`);
            if (budgetRes.data && budgetRes.data.total_amount) {
                setBudgetLimit(budgetRes.data.total_amount);
                setAlert1(budgetRes.data.alert_limit1);
                setAlert2(budgetRes.data.alert_limit2);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickAdd = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/add-expense`, {
                user_id: user.user_id,
                category_id: quickCategory,
                amount: parseFloat(quickAmount),
                date: new Date().toISOString().split('T')[0],
                description: 'Quick Add'
            });
            setQuickAmount('');
            setSuccessMsg('Expense added!');
            setTimeout(() => setSuccessMsg(''), 3000);
            fetchData(user.user_id);
        } catch (err) {
            alert('Failed to add quick expense');
        }
    };

    // Category totals for chart — current month only
    const getCategoryTotals = () => {
        const now = new Date();
        const totals = [0, 0, 0, 0, 0];
        expenses.forEach(exp => {
            const expDate = new Date(exp.date);
            if (expDate.getMonth() !== now.getMonth() || expDate.getFullYear() !== now.getFullYear()) return;
            if (exp.category_name === 'Food') totals[0] += parseFloat(exp.amount);
            else if (exp.category_name === 'Transportation') totals[1] += parseFloat(exp.amount);
            else if (exp.category_name === 'Entertainment') totals[2] += parseFloat(exp.amount);
            else if (exp.category_name === 'Others') totals[3] += parseFloat(exp.amount);
            else if (exp.category_name === 'Savings/Goals') totals[4] += parseFloat(exp.amount);
        });
        return totals;
    };

    const chartData = {
        labels: ['Food', 'Transportation', 'Entertainment', 'Others', 'Savings/Goals'],
        datasets: [{
            data: getCategoryTotals(),
            backgroundColor: [colors.food, colors.transport, colors.entertainment, colors.others, colors.goals],
            hoverOffset: 4,
            borderWidth: 2,
            borderColor: colors.surface,
        }]
    };

    // Budget status
    const getBudgetStatus = () => {
        if (alert2 > 0 && totalSpent >= alert2) return { label: 'Over Budget', className: 'badge-danger' };
        if (alert1 > 0 && totalSpent >= alert1) return { label: 'Warning', className: 'badge-warning' };
        return { label: 'On Track', className: 'badge-success' };
    };
    const budgetStatus = getBudgetStatus();

    // Text color for total
    const getTotalColor = () => {
        if (alert2 > 0 && totalSpent >= alert2) return colors.danger;
        if (alert1 > 0 && totalSpent >= alert1) return colors.warning;
        return colors.textPrimary;
    };

    // Recent 5 expenses — current month only
    const now = new Date();
    const monthlyExpenses = expenses.filter(exp => {
        const d = new Date(exp.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const recentExpenses = monthlyExpenses.slice(0, 5);

    if (!user || isLoading) return <LoadingSpinner />;

    return (
        <PageLayout maxWidth="1100px">
            {/* Success alert */}
            {successMsg && (
                <div className="alert alert-success">
                    <span>{successMsg}</span>
                    <button className="alert-dismiss" onClick={() => setSuccessMsg('')}>&times;</button>
                </div>
            )}

            <div className="dashboard-layout" style={{ display: 'flex', gap: '32px' }}>
                {/* Left: Chart */}
                <div style={{ flex: '0 0 340px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="card" style={{ padding: '24px', width: '100%' }}>
                        <div style={{ position: 'relative', width: '100%', maxWidth: '280px', margin: '0 auto' }}>
                            <Doughnut
                                data={chartData}
                                options={{
                                    cutout: '65%',
                                    plugins: { legend: { display: false } },
                                    maintainAspectRatio: true,
                                }}
                            />
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%',
                                transform: 'translate(-50%, -50%)', textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '22px', fontWeight: '700', color: getTotalColor(), transition: 'color 0.3s' }}>
                                    RM {formatRM(totalSpent)}
                                </div>
                                <div style={{ fontSize: '12px', color: colors.muted }}>
                                    of RM {formatRM(budgetLimit)}
                                </div>
                            </div>
                        </div>

                        {/* Status badge */}
                        <div style={{ textAlign: 'center', marginTop: '16px' }}>
                            <span className={`badge ${budgetStatus.className}`}>
                                {budgetStatus.label}
                            </span>
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px', justifyContent: 'center' }}>
                            {Object.entries(categoryColors).map(([name, color]) => (
                                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{
                                        backgroundColor: color, width: '28px', height: '28px',
                                        borderRadius: '50%', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: '13px'
                                    }}>
                                        {categoryEmojis[name]}
                                    </div>
                                    <span style={{ fontSize: '13px', color: colors.textSecondary }}>{name === 'Savings/Goals' ? 'Goals' : name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Quick Add + Table */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Quick Add */}
                    <form onSubmit={handleQuickAdd} className="mobile-stack" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <select
                            className="input"
                            value={quickCategory}
                            onChange={e => setQuickCategory(e.target.value)}
                            style={{ flex: 1 }}
                        >
                            <option value="1">Food</option>
                            <option value="2">Transportation</option>
                            <option value="4">Entertainment</option>
                            <option value="5">Others</option>
                        </select>
                        <input
                            className="input"
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            placeholder="Amount (RM)"
                            value={quickAmount}
                            onChange={e => setQuickAmount(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                            + Quick Add
                        </button>
                    </form>

                    {/* Recent Expenses */}
                    {monthlyExpenses.length === 0 ? (
                        <EmptyState
                            icon="📊"
                            title="No spendings this month"
                            message="Use Quick Add above to start tracking your expenses."
                        />
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th>Date</th>
                                        <th style={{ textAlign: 'right' }}>Amount (RM)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentExpenses.map((expense) => (
                                        <tr key={expense.expense_id}>
                                            <td style={{ fontWeight: '500' }}>{expense.category_name}</td>
                                            <td style={{ color: colors.textSecondary }}>{new Date(expense.date).toLocaleDateString()}</td>
                                            <td style={{ textAlign: 'right', fontWeight: '600' }}>
                                                {formatRM(expense.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {monthlyExpenses.length > 5 && (
                                <div style={{ textAlign: 'center', padding: '12px' }}>
                                    <Link to="/expenses/details" style={{ color: colors.primary, fontSize: '14px', fontWeight: '500', textDecoration: 'none' }}>
                                        View All Expenses &rarr;
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
}

export default Dashboard;
