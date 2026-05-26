import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { colors, formatRM } from '../styles/theme';
import { API_BASE } from '../config';

function ExpenseDetails() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [categoryId, setCategoryId] = useState('1');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');

    // Feedback states
    const [successMsg, setSuccessMsg] = useState('');
    const [error, setError] = useState('');
    const [deleteExpenseId, setDeleteExpenseId] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) { navigate('/'); return; }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchDetailedExpenses(parsedUser.user_id);
    }, [navigate]);

    const fetchDetailedExpenses = async (userId) => {
        try {
            const res = await axios.get(`${API_BASE}/expenses/${userId}`);
            setExpenses(res.data);
        } catch (err) {
            setError('Failed to load expenses');
        } finally {
            setIsLoading(false);
        }
    };

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                user_id: user.user_id,
                category_id: categoryId,
                amount: parseFloat(amount),
                date: date,
                description: description
            };

            if (editingId) {
                await axios.put(`${API_BASE}/edit-expense/${editingId}`, payload);
                showSuccess('Expense updated');
            } else {
                await axios.post(`${API_BASE}/add-expense`, payload);
                showSuccess('Expense added');
            }

            resetForm();
            fetchDetailedExpenses(user.user_id);
        } catch (err) {
            setError('Failed to save expense');
        }
    };

    const handleDelete = async () => {
        if (!deleteExpenseId) return;
        try {
            await axios.delete(`${API_BASE}/delete-expense/${deleteExpenseId}`);
            setDeleteExpenseId(null);
            showSuccess('Expense deleted');
            fetchDetailedExpenses(user.user_id);
        } catch (err) {
            setError('Failed to delete expense');
        }
    };

    const handleEditClick = (expense) => {
        setEditingId(expense.expense_id);
        setCategoryId(expense.category_id);
        setAmount(expense.amount);
        setDate(new Date(expense.date).toISOString().split('T')[0]);
        setDescription(expense.description);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingId(null);
        setCategoryId('1');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setDescription('');
        setShowForm(false);
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
            <div className="mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '24px', color: colors.textPrimary }}>Expense History</h2>
                <Link to="/expenses" style={{ textDecoration: 'none' }}>
                    <button className="btn btn-ghost btn-sm">&larr; Back to Summary</button>
                </Link>
            </div>

            {/* Add/Edit Toggle */}
            <button
                className={`btn ${showForm ? 'btn-secondary' : 'btn-success'}`}
                onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
                style={{ marginBottom: '16px' }}
            >
                {showForm ? 'Cancel' : '+ Add New Expense'}
            </button>

            {/* Form */}
            {showForm && (
                <div className="card" style={{
                    padding: '24px',
                    marginBottom: '24px',
                    borderLeft: `4px solid ${editingId ? colors.warning : colors.primary}`
                }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: colors.textPrimary }}>
                        {editingId ? 'Edit Expense' : 'Add New Expense'}
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Category</label>
                                <select className="input" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                                    <option value="1">Food</option>
                                    <option value="2">Transportation</option>
                                    <option value="4">Entertainment</option>
                                    <option value="5">Others</option>
                                    <option value="6">Savings/Goals</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Amount (RM)</label>
                                <input className="input" type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Date</label>
                                <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                            </div>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Description</label>
                            <input className="input" type="text" placeholder="e.g. Chicken rice at cafeteria" value={description} onChange={e => setDescription(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-primary">
                            {editingId ? 'Update Expense' : 'Save Expense'}
                        </button>
                    </form>
                </div>
            )}

            {/* Table */}
            {expenses.length === 0 ? (
                <EmptyState
                    icon="📝"
                    title="No expenses recorded"
                    message="Add your first expense to start tracking your spending."
                />
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th style={{ textAlign: 'right' }}>Amount (RM)</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map((expense, index) => (
                                <tr key={expense.expense_id} style={{ backgroundColor: index % 2 === 1 ? colors.background : colors.surface }}>
                                    <td>{new Date(expense.date).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: '500' }}>{expense.category_name}</td>
                                    <td style={{ color: colors.textSecondary }}>{expense.description}</td>
                                    <td style={{ textAlign: 'right', fontWeight: '600' }}>
                                        {formatRM(expense.amount)}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                            <button className="btn btn-warning btn-sm" onClick={() => handleEditClick(expense)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteExpenseId(expense.expense_id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Delete Confirm */}
            <ConfirmDialog
                isOpen={!!deleteExpenseId}
                title="Delete Expense"
                message="Are you sure you want to delete this expense? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteExpenseId(null)}
            />
        </PageLayout>
    );
}

export default ExpenseDetails;
