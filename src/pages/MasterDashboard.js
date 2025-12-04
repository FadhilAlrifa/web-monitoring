import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Factory, PackagePlus, Ship, PackageSearch, Calendar, Clock } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

const today = new Date();
const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Data untuk kartu navigasi
const moduleCards = [
    { title: "Produksi Pabrik", icon: Factory, path: "/produksi/pabrik", color: "text-red-500", group: "Pabrik" },
    { title: "Produksi Pelabuhan (BKS)", icon: Factory, path: "/produksi/bks", color: "text-green-500", group: "BKS" },
    { title: "Penjumboan", icon: PackagePlus, path: "/penjumboan", color: "text-blue-500", group: "Penjumboan" },
    { title: "Pemuatan", icon: Ship, path: "/pemuatan", color: "text-yellow-600", group: "Pemuatan" },
    { title: "Packing Plant", icon: PackageSearch, path: "/packing-plant/dashboard", color: "text-indigo-500", group: "Packing Plant" },
];


const MasterDashboard = () => {
    const [summary, setSummary] = useState({
        totalProductionMTD: 0,
        totalHambatanMTD: 0,
        totalTargetMTD: 0,
    });
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [isLoading, setIsLoading] = useState(true); // Default menjadi true untuk loading state
    const navigate = useNavigate();
    
    const availableYears = [2025, 2024, 2023]; 

    // --- FETCH RINGKASAN GLOBAL MTD (Fungsional) ---
    useEffect(() => {
        const fetchGlobalSummary = async () => {
            setIsLoading(true);
            try {
                // Endpoint ini harus dibuat di backend (server.js) untuk menghasilkan data agregat
                const endpoint = `${API_URL}/api/global-summary/${selectedYear}/${selectedMonth}`;
                
                const res = await axios.get(endpoint);

                setSummary({
                    totalProductionMTD: res.data.totalProductionMTD || 0,
                    totalHambatanMTD: res.data.totalHambatanMTD || 0,
                    totalTargetMTD: res.data.totalTargetMTD || 0,
                });
            } catch (err) {
                console.error("Gagal fetch global summary. Pastikan endpoint /api/global-summary sudah dibuat:", err);
                // Fallback data
                setSummary({ totalProductionMTD: 0, totalHambatanMTD: 0, totalTargetMTD: 0 });
            } finally {
                setIsLoading(false);
            }
        };
        fetchGlobalSummary();
    }, [selectedYear, selectedMonth]);

    // --- RENDER HELPERS ---
    const formatValue = (value) => {
        if (value === 'N/A') return value;
        const numericValue = parseFloat(value);
        return isNaN(numericValue) ? 0 : numericValue.toLocaleString(undefined, { maximumFractionDigits: 0 });
    };

    const monthDisplay = `${monthNames[selectedMonth - 1]} ${selectedYear}`;
    const progressPercent = summary.totalTargetMTD > 0 
        ? Math.min(100, (summary.totalProductionMTD / summary.totalTargetMTD) * 100).toFixed(1) 
        : 0;
    
    // Warna progress bar (Hijau > 80%, Kuning 50%-80%, Merah < 50%)
    const getProgressColor = (percent) => {
        if (percent >= 80) return 'bg-green-500';
        if (percent >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    // --- RENDERING UTAMA ---
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-2">
                Dashboard Kinerja Operasi
            </h1>
            <p className="text-gray-500 mb-8">Ringkasan Performa Bulanan PT. Biringkassi Raya</p>

            {/* Global Filters & Time Display (Desain Elegan) */}
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 mb-10">
                <div className="flex flex-wrap gap-4 items-center">
                    
                    {/* Display Bulan Aktif */}
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Calendar size={18} className="text-purple-600" />
                        <span className="mr-2">Periode Aktif:</span>
                    </div>

                    {/* Selector Bulan */}
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 transition-shadow focus:ring-2 focus:ring-purple-200">
                        {monthNames.map((name, index) => (<option key={index + 1} value={index + 1}>{name}</option>))}
                    </select>
                    
                    {/* Selector Tahun */}
                    <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 transition-shadow focus:ring-2 focus:ring-purple-200">
                        {availableYears.map(year => (<option key={year} value={year}>{year}</option>))}
                    </select>
                    
                    <span className="text-gray-500 text-sm ml-auto font-medium">{monthDisplay}</span>
                </div>
            </div>
            
            {/* === KARTU RINGKASAN GLOBAL === */}
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Performa MTD Keseluruhan</h3>
            
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white p-6 rounded-xl shadow-xl h-32 border-b-2 border-gray-100"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                    
                    {/* Total Produksi MTD */}
                    <div className="bg-white p-6 rounded-xl shadow-xl transform hover:scale-[1.02] transition duration-300 border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 flex items-center gap-2"><LayoutDashboard size={16} className="text-blue-500" /> Total Produksi MTD</p>
                        <h2 className="text-4xl font-extrabold text-blue-800 mt-2">
                            {formatValue(summary.totalProductionMTD)}
                            <span className="text-xl font-semibold text-blue-600 ml-1">TON</span>
                        </h2>
                        <div className="mt-2 text-xs text-gray-500">Target: {formatValue(summary.totalTargetMTD)} TON</div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
                            <div className={`h-2.5 rounded-full ${getProgressColor(progressPercent)}`} style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <p className="text-xs mt-1 font-semibold" style={{ color: progressPercent >= 80 ? '#10B981' : progressPercent >= 50 ? '#F59E0B' : '#EF4444' }}>
                            {progressPercent}% dari Target
                        </p>
                    </div>

                    {/* Total Jam Hambatan MTD */}
                    <div className="bg-white p-6 rounded-xl shadow-xl transform hover:scale-[1.02] transition duration-300 border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 flex items-center gap-2"><Clock size={16} className="text-red-500" /> Total Jam Hambatan</p>
                        <h2 className="text-4xl font-extrabold text-red-800 mt-2">
                            {formatValue(summary.totalHambatanMTD)}
                            <span className="text-xl font-semibold text-red-600 ml-1">JAM</span>
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Akumulasi waktu henti operasional.</p>
                    </div>
                    
                    {/* Efisiensi Keseluruhan */}
                    <div className="bg-white p-6 rounded-xl shadow-xl transform hover:scale-[1.02] transition duration-300 border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 flex items-center gap-2"><LayoutDashboard size={16} className="text-purple-600" /> Efisiensi Total</p>
                        <h2 className="text-4xl font-extrabold text-purple-800 mt-2">
                            {progressPercent}%
                            <span className="text-xl font-semibold text-purple-600 ml-1">EFISIENSI</span>
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Produksi vs. Target (Ringkasan KPI).</p>
                    </div>

                </div>
            )}


            {/* === KARTU NAVIGASI MODUL === */}
            <h3 className="text-xl font-semibold text-gray-700 mb-4 border-t pt-6">Akses Dashboard Spesifik</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {moduleCards.map(card => {
                    const Icon = card.icon;
                    return (
                        <button 
                            key={card.title}
                            onClick={() => navigate(card.path)}
                            className={`bg-white p-6 rounded-xl shadow-md transition duration-300 hover:shadow-lg text-left border border-gray-200 transform hover:translate-x-1`}
                        >
                            <div className="flex items-center space-x-4">
                                <Icon size={28} className={card.color} />
                                <h2 className="text-xl font-bold text-gray-800">{card.title}</h2>
                            </div>
                            <p className="text-sm text-gray-500 mt-3">
                                Analisis data harian, bulanan, dan grafik per unit.
                            </p>
                        </button>
                    );
                })}
            </div>
            
        </div>
    );
};


export default MasterDashboard;