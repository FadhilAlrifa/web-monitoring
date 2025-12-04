import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, TrendingUp } from 'lucide-react'; 

import UnitSelector from '../components/UnitSelector';
import DailyChart from '../components/DailyChart';       
import HambatanPieChart from '../components/HambatanPieChart';  
import MonthlyChart from '../components/MonthlyChart';      
import RilisProduksiChart from '../components/RilisProduksiChart'; 

const API_URL = process.env.REACT_APP_API_URL;

const today = new Date();

// Definisi Nama Bulan
const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];


const DashboardPage = ({ unitGroup }) => { 
    const { logout, user, isAdmin } = useAuth();
    const navigate = useNavigate();
    
    // States utama
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    
    // State tambahan untuk menyimpan semua unit yang diizinkan (agar bisa lookup nama)
    const [allowedUnitsList, setAllowedUnitsList] = useState([]); 
    
    const [dashboardData, setDashboardData] = useState({ 
        dailyReport: [], 
        monthlyReport: [],
        totalProductionMTD: 0,
        hambatanSummary: {},
    });
    
    // State Rilis
    const [rilisData, setRilisData] = useState([]); 
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const availableYears = [2025, 2024, 2023]; 

    // --- FUNGSI HELPER ---
    const getGroupName = () => unitGroup === 'pabrik' ? 'Pabrik' : unitGroup === 'bks' ? 'BKS' : 'Global';
    const groupDisplay = getGroupName();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // --- FETCH MASTER DATA (Untuk lookup nama unit) ---
    useEffect(() => {
        const fetchUnitsList = async () => {
            try {
                // Perbaikan: Tambahkan /api/ untuk rute units
                const res = await axios.get(`${API_URL}/api/units`);
                
                let filteredUnits = res.data;
                if (groupDisplay !== 'Global') {
                    filteredUnits = res.data.filter(unit => unit.group_name === groupDisplay);
                }
                
                setAllowedUnitsList(filteredUnits);
            } catch (err) {
                console.error("Gagal fetch unit master:", err);
            }
        };
        fetchUnitsList();
    }, [unitGroup]);


    // --- FETCH DATA RILIS (Semua Unit, Dynamic Group) ---
    const fetchRilis = async () => {
        if (groupDisplay === 'Global') return setRilisData([]);
        
        try {
            // Perbaikan: Tambahkan /api/ untuk rute rilis
            const res = await axios.get(`${API_URL}/api/produksi/${unitGroup}/rilis/${selectedYear}`); 
            setRilisData(res.data);
        } catch (err) {
            console.error(`Gagal ambil data rilis ${groupDisplay}:`, err);
            // setError(`Gagal memuat Rilis Data untuk ${groupDisplay}.`); 
        }
    };


    // --- FUNGSI PENGAMBILAN DATA DASHBOARD (Per Unit) ---
    useEffect(() => {
        if (selectedUnit && selectedYear && selectedMonth) {
            setIsLoading(true);
            setError(null);
            
            // Perbaikan: Tambahkan /api/ untuk rute dashboard
            axios.get(`${API_URL}/api/dashboard/${selectedUnit}/${selectedYear}/${selectedMonth}`) 
                 .then(res => {
                     setDashboardData(res.data);
                     setIsLoading(false);
                 })
                 .catch(err => {
                     console.error("Gagal mengambil data dashboard:", err);
                     if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                         handleLogout();
                         setError("Sesi kadaluarsa. Silakan login kembali.");
                     } else {
                         setError("Gagal memuat data dashboard. Cek log server.");
                     }
                     setIsLoading(false);
                 });
        } else {
            setDashboardData({ dailyReport: [], monthlyReport: [], totalProductionMTD: 0, hambatanSummary: {} });
        }
    }, [selectedUnit, selectedYear, selectedMonth, logout, navigate]);
    
    // EFFECT 2: Mengambil data Rilis (Dipicu saat tahun atau group berubah)
    useEffect(() => {
        fetchRilis();
    }, [selectedYear, unitGroup]); // <-- Sinkronkan dengan unitGroup


    // --- LOGIC LOOKUP NAMA UNIT AKTIF ---
    const selectedUnitObject = allowedUnitsList.find(unit => unit.id_unit.toString() === selectedUnit);
    const selectedUnitName = selectedUnitObject ? selectedUnitObject.nama_unit : '';


    // --- FUNGSI HELPER (Rendering) ---
    const formatProductionValue = (value) => {
        const numericValue = parseFloat(value);
        const finalValue = isNaN(numericValue) ? 0 : numericValue;
        return finalValue.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    };

    // MOCK TARGET: Asumsi target bulanan tetap 26350 dari server.js
    const MOCK_TARGET_BULANAN = 26350; 
    const progressPercent = MOCK_TARGET_BULANAN > 0 
        ? Math.min(100, (dashboardData.totalProductionMTD / MOCK_TARGET_BULANAN) * 100).toFixed(1) 
        : 0;

    const getProgressColor = (percent) => {
        if (percent >= 80) return 'bg-green-500';
        if (percent >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };
    
    const totalProduksiTitle = `${monthNames[selectedMonth - 1]} ${selectedYear}`;
    const hambatanChartTitle = `Total Hambatan ${monthNames[selectedMonth - 1]} ${selectedYear}`;

    
    // --- RENDERING UTAMA ---
    
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
            
            <div className="flex justify-between items-end mb-6 border-b pb-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                    Dashboard Kinerja {groupDisplay}
                </h1>
            </div>

            {error && <p className="text-red-600 p-4 bg-red-100 rounded-lg">{error}</p>}
            
            {isLoading && !error && <p className="text-center text-blue-600 p-8">Memuat data...</p>}

            {/* 1. BARIS KONTROL UTAMA & KPI (Elegan, Shadow, Border-less) */}
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 mb-8">
                <div className="flex flex-wrap gap-4 items-center mb-4 border-b pb-4">
                    {/* SELEKTOR BULAN DAN TAHUN */}
                    <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-purple-600" />
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="p-2 border rounded-md text-sm bg-gray-50"
                        >
                            {monthNames.map((name, index) => (<option key={index + 1} value={index + 1}>{name}</option>))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="p-2 border rounded-md text-sm bg-gray-50"
                        >
                            {availableYears.map(year => (<option key={year} value={year}>{year}</option>))}
                        </select>
                    </div>

                    {/* UNIT SELECTOR */}
                    <div className="flex items-center gap-3 ml-auto">
                        <label className="text-sm font-medium text-gray-700">Unit:</label>
                        <UnitSelector 
                            onSelect={setSelectedUnit} 
                            selectedUnit={selectedUnit} 
                            allowedGroupName={groupDisplay} 
                        />
                    </div>
                </div>

                {/* KPI CARDS - Menampilkan ringkasan MTD per Unit yang Dipilih */}
                {selectedUnit && !isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {/* KPI 1: Total Produksi MTD */}
                        <div className="p-4 bg-white rounded-lg shadow-xl border border-gray-100">
                            <p className="text-sm font-medium text-blue-700 flex items-center gap-1"><TrendingUp size={16} className="text-blue-500" /> Produksi MTD</p>
                            <h3 className="text-2xl font-extrabold text-blue-800 mt-1">
                                {formatProductionValue(dashboardData.totalProductionMTD)} 
                                <span className="text-sm font-semibold text-blue-600">TON</span>
                            </h3>
                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                    <div className={`h-2.5 rounded-full ${getProgressColor(progressPercent)}`} style={{ width: `${progressPercent}%` }}></div>
                                </div>
                                <p className="text-xs mt-1 font-semibold text-gray-600">{progressPercent}% dari Target Bulanan</p>
                        </div>
                        {/* KPI 2: Total Hambatan */}
                        <div className="p-4 bg-white rounded-lg shadow-xl border border-gray-100">
                            <p className="text-sm font-medium text-red-700 flex items-center gap-1"><Clock size={16} className="text-red-500" /> Total Jam Hambatan</p>
                            <h3 className="text-2xl font-extrabold text-red-800 mt-1">
                                {formatProductionValue(dashboardData.hambatanSummary.total_hambatan)} 
                                <span className="text-sm font-semibold text-red-600">JAM</span>
                            </h3>
                                <p className="text-xs text-gray-500 mt-1">Total waktu henti operasional.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. AREA VISUALISASI CHART */}
            <div className="grid grid-cols-1 gap-6 mt-6">
                
                {/* CHART HARIAN, HAMBATAN, BULANAN (Hanya Tampil jika unit spesifik dipilih) */}
                {selectedUnit && !isLoading && !error ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Daily Chart (2/3 lebar di desktop) */}
                        <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                            <DailyChart 
                                dailyReport={dashboardData.dailyReport} 
                                unitGroup={unitGroup} 
                                unitName={selectedUnitName} 
                            />
                        </div>

                        {/* Hambatan Pie Chart (1/3 lebar di desktop) */}
                        <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                            <HambatanPieChart 
                                hambatanSummary={dashboardData.hambatanSummary}
                                title={hambatanChartTitle} 
                            />
                        </div>
                        
                        {/* Monthly Chart (3/3 lebar di desktop) */}
                        <div className="lg:col-span-3 bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                            <MonthlyChart monthlyReport={dashboardData.monthlyReport} />
                        </div>
                    </div>
                ) : (
                    <div className="lg:col-span-3">
                         {!selectedUnit && groupDisplay !== 'Global' && (
                             <p className="text-center text-gray-500 mt-10 p-8 bg-white rounded-lg shadow-md border border-yellow-300">
                                 Silakan pilih **Unit Kerja** untuk menampilkan data harian dan bulanan.
                             </p>
                         )}
                    </div>
                )}
                
                {/* CHART RILIS (Komparasi Semua Unit) - Tampil di bawah jika group spesifik (Pabrik/BKS) */}
                {groupDisplay !== 'Global' && (
                    <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                        <RilisProduksiChart 
                            rilisData={rilisData} 
                            selectedYear={selectedYear} 
                            groupName={groupDisplay} 
                        />
                    </div>
                )}
                
            </div>
        </div>
    );
};


export default DashboardPage;