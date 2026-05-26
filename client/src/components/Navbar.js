import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    const navItems = [
        { path: '/dashboard', label: 'Home' },
        { path: '/expenses', label: 'Expenses' },
        { path: '/budget', label: 'Budget' },
        { path: '/goals', label: 'Goals' },
    ];

    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <h1>DBT</h1>
                {user && <span>Hello, {user.name}!</span>}
            </div>

            <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? '✕' : '☰'}
            </button>

            <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                {navItems.map(item => (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMenuOpen(false)}
                        style={{
                            backgroundColor: location.pathname === item.path ? '#EFF6FF' : undefined,
                            color: location.pathname === item.path ? '#2563EB' : undefined,
                            fontWeight: location.pathname === item.path ? '600' : undefined,
                        }}
                    >
                        {item.label}
                    </Link>
                ))}
                <button className="btn btn-danger btn-sm" onClick={handleLogout} style={{ marginLeft: '8px' }}>
                    Logout
                </button>
            </div>
        </nav>
    );
}

export default Navbar;
