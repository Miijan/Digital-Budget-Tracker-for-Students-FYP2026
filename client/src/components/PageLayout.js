import React from 'react';
import Navbar from './Navbar';

function PageLayout({ children, maxWidth = '1000px' }) {
    return (
        <div className="page-wrapper">
            <Navbar />
            <div className="page-container" style={{ maxWidth }}>
                {children}
            </div>
        </div>
    );
}

export default PageLayout;
