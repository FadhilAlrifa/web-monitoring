import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import CrudPage from './pages/CrudPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import './index.css';

// Import Komponen Wrapper Spesifik (Wajib ada di folder src/pages/)
import ProduksiBKSDashboard from './pages/ProduksiBKSDashboard';
import ProduksiBKSCrud from './pages/ProduksiBKSCrud';
import ProduksiPabrikDashboard from './pages/ProduksiPabrikDashboard';
import ProduksiPabrikCrud from './pages/ProduksiPabrikCrud';
import PenjumboanDashboardPage from './pages/PenjumboanDashboardPage';
import PenjumboanCrudPage from './pages/PenjumboanCrudPage';
import PemuatanDashboardPage from './pages/PemuatanDashboardPage';
import PemuatanCrudPage from './pages/PemuatanCrudPage';
import PackingPlantDashboard from './pages/PackingPlantDashboard';
import PackingPlantCrud from './pages/PackingPlantCrud';
import MasterDashboard from './pages/MasterDashboard';


const LOGO_PATH = '/logo-perusahaan.png';

// -----------------------------------------------------------
// 1. KOMPONEN PROTEKSI RUTE
// -----------------------------------------------------------

const AdminRoute = ({ children }) => {
    const { user, isLoading, isAdmin } = useAuth();

    if (isLoading) {
        return <div className="text-center p-20 text-blue-600">Memuat autentikasi...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    // isAdmin di AuthContext sudah diperbarui untuk mencakup 'superuser' dan 'entry_admin'
    return isAdmin ? children : <Navigate to="/" />;
};

// -----------------------------------------------------------
// 2. LAYOUT UTAMA (HEADER & SIDEBAR INTEGRATION)
// -----------------------------------------------------------

const AppLayout = () => {
    const { user, isAdmin, logout } = useAuth();

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    const showSidebar = window.location.pathname !== '/login';

    return (
        <div className="min-h-screen flex flex-col">
            <header className="backdrop-blur-lg bg-white/80 border-b sticky top-0 z-50 shadow-sm">
                <div className="max-w-full px-6 py-3 flex justify-between items-center">

                    {/* LEFT – Nama Sistem */}
                    <a href="/" className="md:ml-6 text-xl font-bold tracking-wide bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
                        PT. Biringkassi Raya | Manajemen Produksi Harian
                    </a>

                    {/* RIGHT – User + Info */}
                    <div className="flex items-center gap-4">

                        {user && (
                            <div className="hidden sm:flex items-center gap-3">

                                {/* Username Badge */}
                                <span className="text-sm bg-blue-100 px-3 py-1 rounded-full text-blue-800 font-medium shadow-md flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A4 4 0 017 17h10a4 4 0 011.879.804M15 11a3 3 0 100-6 3 3 0 000 6z" />
                                    </svg>
                                    {user?.username}
                                </span>

                                {/* Role Badge */}
                                <span
                                    className={`
                                        text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide
                                        shadow-lg border border-white/80 
                                        ${["admin","superuser"].includes(user.role) 
                                            ? "bg-red-600/90 text-white" 
                                            : "bg-green-600/90 text-white" 
                                        }
                                    `}
                                >
                                    {user.role}
                                </span>

                                {/* Logout Button */}
                                <button
                                    onClick={handleLogout}
                                    className="px-3 py-1 text-sm text-white font-semibold rounded-lg bg-gradient-to-r from-red-500 to-red-700 shadow hover:scale-[1.05] transition">
                                    Logout
                                </button>
                            </div>
                        )}
                        {/* Mobile/Default Logo & Login */}
                        <div className="flex items-center gap-3">
                            {!user && (
                                <a href="/login" className="
                                    px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-red-600
                                    shadow hover:scale-[1.05] active:scale-95 transition">
                                    Login
                                </a>
                            )}
                            <img
                                src={LOGO_PATH}
                                alt="Logo Perusahaan"
                                className="h-9 w-9 object-cover rounded-full shadow-md border border-gray-200"
                            />
                        </div>
                    </div>
                </div>
            </header>


            {/* MAIN LAYOUT: SIDEBAR DAN KONTEN */}
            <div className="flex flex-1 min-h-screen"> 

                {/* 1. SIDEBAR (Positioned under Header) */}
                {/* Komponen Sidebar akan memiliki posisi fixed di desktop */}
                {showSidebar && <Sidebar />}

                {/* 2. KONTEN UTAMA (Fleksibel) */}
                {/* md:ml-64 untuk mengimbangi lebar sidebar di desktop */}
                <main className={`flex-1 overflow-y-auto bg-gray-50 ${showSidebar ? 'md:ml-64' : ''}`}> 
                    <div className="container mx-auto p-4 md:p-6">
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />

                            {/* Dashboard & Produksi (Akses Publik) */}
                            <Route path="/" element={<MasterDashboard />} />
                            <Route path="/master" element={<MasterDashboard />} /> 
                            <Route path="/produksi/pabrik" element={<ProduksiPabrikDashboard />} />
                            <Route path="/produksi/bks" element={<ProduksiBKSDashboard />} />
                            <Route path="/penjumboan" element={<PenjumboanDashboardPage />} />
                            <Route path="/pemuatan" element={<PemuatanDashboardPage />} />
                            <Route path="/packing-plant/dashboard" element={<PackingPlantDashboard />} />


                            {/* Input Data Admin (CRUD) - DILINDUNGI ADMIN */}
                            {/* Input Spesifik Unit Group */}
                            <Route path="/input/pabrik" element={<AdminRoute><ProduksiPabrikCrud /></AdminRoute>} />
                            <Route path="/input/bks" element={<AdminRoute><ProduksiBKSCrud /></AdminRoute>} />
                            <Route path="/input/penjumboan" element={<AdminRoute><PenjumboanCrudPage /></AdminRoute>} />
                            <Route path="/input/pemuatan" element={<AdminRoute><PemuatanCrudPage /></AdminRoute>} />
                            <Route path="/input/packing-plant" element={<AdminRoute><PackingPlantCrud /></AdminRoute>} />

                            {/* Catch-all route */}
                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                    </div>
                </main>
            </div>
        </div>
    );
};


const App = () => {
    return (
        <AuthProvider>
            <Router>
                <AppLayout />
            </Router>
        </AuthProvider>
    );
};

export default App;