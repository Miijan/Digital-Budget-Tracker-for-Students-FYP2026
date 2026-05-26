import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { colors, categoryColors, formatRM } from '../styles/theme';
import { API_BASE } from '../config';

const ALL_CATEGORIES = ['Food', 'Transportation', 'Entertainment', 'Others', 'Savings/Goals'];

function Expenses() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [allExpenses, setAllExpenses] = useState([]);
    const [filteredExpenses, setFilteredExpenses] = useState([]);
    const [timeFilter, setTimeFilter] = useState('month');
    const [isLoading, setIsLoading] = useState(true);

    // Budget + category limits
    const [budget, setBudget] = useState(null);
    const [categoryLimits, setCategoryLimits] = useState({});
    const [showLimitForm, setShowLimitForm] = useState(false);
    const [limitDraft, setLimitDraft] = useState({});

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) { navigate('/'); return; }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchData(parsedUser.user_id);
    }, [navigate]);

    const fetchData = async (userId) => {
        try {
            const [expRes, budgetRes] = await Promise.all([
                axios.get(`${API_BASE}/expenses/${userId}`),
                axios.get(`${API_BASE}/budget/${userId}`)
            ]);
            setAllExpenses(expRes.data);
            applyFilter(expRes.data, 'month');

            if (budgetRes.data && budgetRes.data.budget_id) {
                setBudget(budgetRes.data);
            }

            const savedLimits = JSON.parse(localStorage.getItem(`categoryLimits_${userId}`)) || {};
            setCategoryLimits(savedLimits);
            setLimitDraft(savedLimits);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilter = (data, filterType) => {
        const now = new Date();
        const filtered = data.filter(exp => {
            const expDate = new Date(exp.date);
            if (filterType === 'month') {
                return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
            } else if (filterType === 'week') {
                const diffTime = Math.abs(now - expDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
            } else if (filterType === 'day') {
                return expDate.toDateString() === now.toDateString();
            }
            return true;
        });
        setFilteredExpenses(filtered);
    };

    const handleFilterChange = (filter) => {
        setTimeFilter(filter);
        applyFilter(allExpenses, filter);
    };

    // Dynamic date text
    const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
    const getWeekOfMonth = () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
        return Math.ceil((today.getDate() + firstDay) / 7);
    };
    const displayPeriodText = timeFilter === 'month'
        ? currentMonthName
        : timeFilter === 'week'
        ? `Week ${getWeekOfMonth()} of ${currentMonthName}`
        : new Date().toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'long' });

    // Category totals
    const categoryTotals = filteredExpenses.reduce((acc, curr) => {
        acc[curr.category_name] = (acc[curr.category_name] || 0) + parseFloat(curr.amount);
        return acc;
    }, {});

    const totalSpending = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

    // Category limit helpers
    const totalBudget = budget ? parseFloat(budget.total_amount) || 0 : 0;
    const draftTotal = Object.values(limitDraft).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

    const handleSaveLimits = () => {
        if (totalBudget > 0 && draftTotal > totalBudget) return;
        setCategoryLimits({ ...limitDraft });
        localStorage.setItem(`categoryLimits_${user.user_id}`, JSON.stringify(limitDraft));
        setShowLimitForm(false);
    };

    const handleLimitChange = (category, value) => {
        setLimitDraft(prev => ({ ...prev, [category]: value }));
    };

    // 6-month receipt download
    const handleDownloadReceipt = () => {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const relevantExpenses = allExpenses.filter(exp => new Date(exp.date) >= sixMonthsAgo);

        // Build month buckets
        const months = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
            months[key] = { label, categories: {}, total: 0 };
        }

        relevantExpenses.forEach(exp => {
            const d = new Date(exp.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (months[key]) {
                const cat = exp.category_name;
                months[key].categories[cat] = (months[key].categories[cat] || 0) + parseFloat(exp.amount);
                months[key].total += parseFloat(exp.amount);
            }
        });

        const grandTotal = Object.values(months).reduce((sum, m) => sum + m.total, 0);
        const allCats = [...new Set(relevantExpenses.map(e => e.category_name))].sort();

        let html = `<!DOCTYPE html><html><head><title>6-Month Expense Summary</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:700px;margin:0 auto;padding:40px 24px;color:#1E293B}
h1{font-size:22px;margin-bottom:4px}
.subtitle{color:#64748B;font-size:14px;margin-bottom:32px}
table{width:100%;border-collapse:collapse;margin-bottom:24px}
th,td{padding:10px 12px;text-align:right;font-size:13px;border-bottom:1px solid #E2E8F0}
th:first-child,td:first-child{text-align:left}
th{background:#F8FAFC;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;font-size:11px}
.month-header{background:#EFF6FF;font-weight:600;color:#2563EB}
.grand-total{font-weight:700;font-size:15px;border-top:2px solid #1E293B}
.footer{text-align:center;color:#94A3B8;font-size:12px;margin-top:32px}
@media print{body{padding:20px}}
</style></head><body>`;

        html += `<h1>Expense Summary Report</h1>`;
        html += `<div class="subtitle">${user.name} &mdash; Generated on ${new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</div>`;
        html += `<table><thead><tr><th>Month / Category</th><th>Amount (RM)</th></tr></thead><tbody>`;

        Object.values(months).forEach(month => {
            html += `<tr class="month-header"><td>${month.label}</td><td>${formatRM(month.total)}</td></tr>`;
            allCats.forEach(cat => {
                const val = month.categories[cat];
                if (val) {
                    html += `<tr><td style="padding-left:24px">${cat}</td><td>${formatRM(val)}</td></tr>`;
                }
            });
        });

        html += `<tr class="grand-total"><td>Grand Total (6 Months)</td><td>RM ${formatRM(grandTotal)}</td></tr>`;
        html += `</tbody></table>`;
        html += `<div class="footer">Digital Budget Tracker &mdash; Student Financial Management</div>`;
        html += `</body></html>`;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 300);
    };

    if (!user || isLoading) return <LoadingSpinner />;

    return (
        <PageLayout maxWidth="800px">
            {/* Header */}
            <div className="mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div className="segmented-control">
                        <button className={`segmented-btn ${timeFilter === 'month' ? 'active' : ''}`} onClick={() => handleFilterChange('month')}>Month</button>
                        <button className={`segmented-btn ${timeFilter === 'week' ? 'active' : ''}`} onClick={() => handleFilterChange('week')}>Week</button>
                        <button className={`segmented-btn ${timeFilter === 'day' ? 'active' : ''}`} onClick={() => handleFilterChange('day')}>Day</button>
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: colors.textSecondary }}>
                        {displayPeriodText}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline btn-sm" onClick={handleDownloadReceipt}>
                        Download 6-Month Summary
                    </button>
                    <Link to="/expenses/details">
                        <button className="btn btn-primary btn-sm">View Full Details</button>
                    </Link>
                </div>
            </div>

            {/* Category Spending Summary */}
            <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: colors.textPrimary }}>Category Spending Summary</h3>

                {Object.keys(categoryTotals).length === 0 ? (
                    <EmptyState
                        icon="💰"
                        title="No expenses this period"
                        message="Start tracking by adding your first expense."
                    />
                ) : (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {Object.entries(categoryTotals).map(([category, total]) => {
                                const limit = parseFloat(categoryLimits[category]) || 0;
                                const spentPercent = limit > 0 ? Math.min((total / limit) * 100, 100) : 0;
                                const isOver = limit > 0 && total > limit;

                                return (
                                    <div key={category} style={{
                                        padding: '14px 18px',
                                        backgroundColor: colors.background,
                                        borderRadius: '8px',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: limit > 0 ? '8px' : 0 }}>
                                            <div style={{
                                                width: '10px', height: '10px', borderRadius: '50%',
                                                backgroundColor: categoryColors[category] || colors.muted, flexShrink: 0
                                            }} />
                                            <span style={{ fontWeight: '600', flex: 1, fontSize: '15px' }}>{category}</span>
                                            <span style={{ fontWeight: '700', fontSize: '15px', color: isOver ? colors.danger : colors.textPrimary }}>
                                                RM {formatRM(total)}
                                            </span>
                                        </div>

                                        {/* Spending vs limit bar */}
                                        {limit > 0 && (
                                            <div style={{ marginLeft: '24px' }}>
                                                <div style={{ height: '6px', backgroundColor: colors.border, borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${spentPercent}%`,
                                                        backgroundColor: isOver ? colors.danger : categoryColors[category] || colors.muted,
                                                        borderRadius: '3px',
                                                        transition: 'width 0.3s ease'
                                                    }} />
                                                </div>
                                                <div style={{ fontSize: '12px', color: isOver ? colors.danger : colors.textSecondary, marginTop: '3px' }}>
                                                    RM {formatRM(total)} / RM {formatRM(limit)} {isOver && '— Over limit!'}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Total */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            padding: '16px 18px 0', marginTop: '16px',
                            borderTop: `1px solid ${colors.border}`,
                            fontSize: '16px', fontWeight: '700', color: colors.textPrimary
                        }}>
                            <span>Total</span>
                            <span>RM {formatRM(totalSpending)}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Category Limits Section */}
            <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: colors.textPrimary }}>Category Budget Limits</h3>
                    {!showLimitForm && (
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={() => { setLimitDraft({ ...categoryLimits }); setShowLimitForm(true); }}
                            disabled={!budget}
                        >
                            {Object.keys(categoryLimits).length > 0 ? 'Edit Limits' : 'Set Limits'}
                        </button>
                    )}
                </div>

                {!budget && (
                    <p style={{ fontSize: '14px', color: colors.muted, margin: 0 }}>
                        Set your total budget on the <Link to="/budget" style={{ color: colors.primary }}>Budget page</Link> first to enable category limits.
                    </p>
                )}

                {budget && !showLimitForm && Object.keys(categoryLimits).length === 0 && (
                    <p style={{ fontSize: '14px', color: colors.muted, margin: 0 }}>
                        No category limits set. Click "Set Limits" to allocate your budget across categories.
                    </p>
                )}

                {budget && !showLimitForm && Object.keys(categoryLimits).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {ALL_CATEGORIES.map(cat => {
                            const limit = parseFloat(categoryLimits[cat]) || 0;
                            if (limit <= 0) return null;
                            return (
                                <div key={cat} style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '8px 14px', backgroundColor: colors.background,
                                    borderRadius: '6px', fontSize: '13px'
                                }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: categoryColors[cat] }} />
                                    <span style={{ fontWeight: '600' }}>{cat}</span>
                                    <span style={{ color: colors.textSecondary }}>RM {formatRM(limit)}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Limit Setting Form */}
                {showLimitForm && budget && (
                    <div>
                        <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '16px' }}>
                            Total Budget: <strong style={{ color: colors.textPrimary }}>RM {formatRM(totalBudget)}</strong>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                            {ALL_CATEGORIES.map(cat => (
                                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: categoryColors[cat], flexShrink: 0 }} />
                                    <span style={{ width: '140px', fontSize: '14px', fontWeight: '500' }}>{cat}</span>
                                    <div style={{ position: 'relative', flex: 1, maxWidth: '200px' }}>
                                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: colors.muted }}>RM</span>
                                        <input
                                            className="input"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            value={limitDraft[cat] || ''}
                                            onChange={e => handleLimitChange(cat, e.target.value)}
                                            style={{ paddingLeft: '40px' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{
                            fontSize: '14px', marginBottom: '16px', fontWeight: '600',
                            color: totalBudget > 0 && draftTotal > totalBudget ? colors.danger : colors.textSecondary
                        }}>
                            Allocated: RM {formatRM(draftTotal)} / RM {formatRM(totalBudget)}
                            {totalBudget > 0 && draftTotal > totalBudget && (
                                <span style={{ fontWeight: '400', marginLeft: '8px' }}>— Exceeds your total budget!</span>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="btn btn-success"
                                onClick={handleSaveLimits}
                                disabled={totalBudget > 0 && draftTotal > totalBudget}
                            >
                                Save Limits
                            </button>
                            <button className="btn btn-ghost" onClick={() => setShowLimitForm(false)}>Cancel</button>
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    );
}

export default Expenses;
