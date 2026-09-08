import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import MainLayout from './layout/MainLayout'; // ✅ 레이아웃
import Home from './pages/Home';
import Profile from './pages/Profile';
import Posts from './pages/Posts';
import Schedules from './pages/Schedules';
import Points from './pages/Points';
import Support from './pages/Support';
import NewPost from './pages/NewPost';
import PostDetail from './pages/PostDetail';
import NewSchedule from './pages/NewSchedule';
import ScheduleDetail from './pages/ScheduleDetail';
import MyActivity from './pages/MyActivity';
import LoginHistory from './pages/LoginHistory';
import ResetPassword from './pages/ResetPassword';
import AdminLoginHistory from './pages/AdminLoginHistory';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/my-activity" element={<MyActivity />} />
                    <Route path="/login-history" element={<LoginHistory />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/admin/login-history" element={<AdminLoginHistory />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/posts" element={<Posts />} />
                    <Route path="/posts/new" element={<NewPost />} />
                    <Route path="/posts/:postId" element={<PostDetail />} />
                    <Route path="/schedules" element={<Schedules />} />
                    <Route path="/schedules/new" element={<NewSchedule />} />
                    <Route path="/schedules/:scheduleId" element={<ScheduleDetail />} />
                    <Route path="/points" element={<Points />} />
                    <Route path="/support" element={<Support />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);
