import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

export default function MainLayout() {
    return (
        <>
            <AppHeader />
            <div style={{ display: 'flex', marginTop: '80px' }}>
                <Sidebar />
                <main style={{ marginLeft: '260px', padding: '20px', flex: 1 }}>
                    <Outlet /> {/* ✅ 여기에 각 페이지 내용이 들어감 */}
                </main>
            </div>

            <Footer />
        </>
    );
}
