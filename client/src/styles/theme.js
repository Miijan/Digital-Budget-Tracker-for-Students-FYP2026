// Design tokens - single source of truth for all styling values
export const colors = {
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    success: '#16A34A',
    successHover: '#15803D',
    warning: '#F59E0B',
    warningHover: '#D97706',
    danger: '#DC2626',
    dangerHover: '#B91C1C',

    background: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    muted: '#94A3B8',
    textPrimary: '#1E293B',
    textSecondary: '#64748B',

    // Category colors
    food: '#60A5FA',
    transport: '#4ADE80',
    entertainment: '#F472B6',
    others: '#FBBF24',
    goals: '#2DD4BF',
};

export const categoryColors = {
    'Food': colors.food,
    'Transportation': colors.transport,
    'Entertainment': colors.entertainment,
    'Others': colors.others,
    'Savings/Goals': colors.goals,
};

export const categoryEmojis = {
    'Food': '🍴',
    'Transportation': '🚗',
    'Entertainment': '🎤',
    'Others': '👕',
    'Savings/Goals': '⚽',
};

export const spacing = {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
};

export const fontSize = {
    caption: '12px',
    small: '14px',
    body: '16px',
    h3: '20px',
    h2: '24px',
    h1: '32px',
    display: '40px',
};

export const formatRM = (value) => {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
