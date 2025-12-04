// src/pages/DashboardPage.js (KODE FINAL)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import UnitSelector from '../components/UnitSelector';
import DailyChart from '../components/DailyChart';       
import HambatanPieChart from '../components/HambatanPieChart';  
import MonthlyChart from '../components/MonthlyChart';      
import RilisProduksiChart from '../components/RilisProduksiChart'; // Import Rilis Chart

// const API_URL = 'http://localhost:5000/api';
const API_URL = process.env.REACT_APP_API_URL;

// Panggilan API di frontend:
// HAPUS fetch(`${API_URL}/api`)

const DashboardPage = ({ unitGroup }) => { 
    const today = new Date();
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
        totalProductionMTD: 0 
    });
    
    // State Rilis
    const [rilisData, setRilisData] = useState([]); // <-- Data Rilis
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
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
            const res = await axios.get(`${API_URL}/api/produksi/${unitGroup}/rilis/${selectedYear}`); // <--- PERBAIKAN
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
            axios.get(`${API_URL}/api/dashboard/${selectedUnit}/${selectedYear}/${selectedMonth}`) // <--- PERBAIKAN
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
    
    const totalProduksiTitle = `${monthNames[selectedMonth - 1]} ${selectedYear}`;
    const hambatanChartTitle = `Total Hambatan ${monthNames[selectedMonth - 1]} ${selectedYear}`;

    
    // --- RENDERING UTAMA ---
    
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            
            <div className="flex justify-between items-end mb-6 border-b pb-2">
                <h1 className="text-4xl font-extrabold text-gray-900">
                    Dashboard Kinerja {groupDisplay}
                </h1>
            </div>

            {error && <p className="text-red-600 p-4 bg-red-100 rounded-lg">{error}</p>}
            
            {isLoading && !error && <p className="text-center text-blue-600 p-8">Memuat data...</p>}

            {/* 1. BARIS KONTROL UTAMA */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-start">
                
                {/* A. TOTAL PRODUKSI KPI */}
                {!isLoading && (
                    <div className="bg-white p-3 rounded-lg shadow-md border-l-4 border-green-600 flex flex-col justify-center min-h-[80px]">
                        <p className="text-xs font-medium text-gray-500 uppercase flex items-center">
                            <span className="mr-1 text-base">🏢</span> 
                            {totalProduksiTitle}
                        </p>
                        <h2 className="text-xl font-bold text-gray-900">
                            {formatProductionValue(dashboardData.totalProductionMTD)}
                            <span className="text-xl font-bold text-blue-600 ml-1">TON</span>
                        </h2>
                    </div>
                )}
                
                {/* B. SELEKTOR BULAN DAN TAHUN */}
                <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-blue-600 flex gap-3 items-center">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="p-2 border rounded-md"
                    >
                        {monthNames.map((name, index) => (<option key={index + 1} value={index + 1}>{name}</option>))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="p-2 border rounded-md"
                    >
                        {availableYears.map(year => (<option key={year} value={year}>{year}</option>))}
                    </select>
                </div>
                
                {/* C. UNIT SELECTOR (Hanya tampilkan jika unitGroup bukan Global) */}
                {groupDisplay !== 'Global' && (
                    <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-yellow-600 flex items-center">
                        <label className="mr-2 text-sm font-medium text-gray-700">Pilih Unit:</label>
                        <UnitSelector 
                            onSelect={setSelectedUnit} 
                            selectedUnit={selectedUnit} 
                            allowedGroupName={groupDisplay} 
                        />
                    </div>
                )}
            </div>
            {/* Akhir BARIS KONTROL UTAMA */}

            
            {/* 2. AREA VISUALISASI CHART */}
            <div className="grid grid-cols-1 gap-6 mt-6">
                
                {/* 2A. CHART HARIAN, HAMBATAN, BULANAN (Hanya Tampil jika unit spesifik dipilih) */}
                {selectedUnit && !isLoading && !error && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        <div className="lg:col-span-2">
                            <DailyChart 
                                dailyReport={dashboardData.dailyReport} 
                                unitGroup={unitGroup} 
                                unitName={selectedUnitName} 
                            />
                        </div>

                        <div className="lg:col-span-1">
                            <HambatanPieChart 
                                hambatanSummary={dashboardData.hambatanSummary}
                                title={hambatanChartTitle} 
                            />
                        </div>
                        
                        <div className="lg:col-span-3">
                            <MonthlyChart monthlyReport={dashboardData.monthlyReport} />
                        </div>
                    </div>
                )}
                
                {/* 2B. CHART RILIS (Komparasi Semua Unit) - Tampil di bawah jika group spesifik (Pabrik/BKS) */}
                {groupDisplay !== 'Global' && (
                    <div className="lg:col-span-1">
                        <RilisProduksiChart 
                            rilisData={rilisData} 
                            selectedYear={selectedYear} 
                            groupName={groupDisplay} 
                        />
                    </div>
                )}
                
            </div>
            
            {/* Pesan jika belum ada unit yang dipilih */}
            {!selectedUnit && groupDisplay !== 'Global' && !isLoading && (
                <p className="text-center text-gray-500 mt-10 p-4 bg-yellow-100 rounded-lg border border-yellow-300">
                    Silakan pilih **Unit Kerja** untuk menampilkan data harian dan bulanan.
                </p>
            )}
        </div>
    );
};


export default DashboardPage;
