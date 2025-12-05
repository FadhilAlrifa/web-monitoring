// src/pages/PenjumboanDashboardPage.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import UnitSelector from '../components/UnitSelector';
import PenjumboanDailyChart from '../components/PenjumboanDailyChart'; 
import PenjumboanMonthlyChart from '../components/PenjumboanMonthlyChart'; 

const API_URL = process.env.REACT_APP_API_URL;

// Hapus baris fetch(`${API_URL}/api`) karena ini bukan cara memicu API di React
// fetch(`${API_URL}/api`) 
const PAGE_GROUP_NAME = 'Penjumboan'; 

const PenjumboanDashboardPage = () => {
    const today = new Date();
    const { logout, user, isAdmin } = useAuth();
    const navigate = useNavigate();
    
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    
    const [penjumboanData, setPenjumboanData] = useState({ 
        dailyReport: [], 
        monthlyReport: [],
        totalProductionMTD: 0 
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const availableYears = [2025, 2024, 2023]; 

    // --- LOGIC ---
    useEffect(() => {
        if (selectedUnit && selectedYear && selectedMonth) {
            setIsLoading(true);
            setError(null);
            
            // PERBAIKAN: Tambahkan awalan '/api'
            axios.get(`${API_URL}/api/penjumboan/dashboard/${selectedUnit}/${selectedYear}/${selectedMonth}`)
                 .then(res => {
                     setPenjumboanData(res.data);
                     setIsLoading(false);
                 })
                 .catch(err => {
                     console.error("Gagal mengambil data penjumboan:", err);
                     // Pesan error diubah agar lebih informatif:
                     setError("Gagal memuat data dashboard Penjumboan. Periksa koneksi API dan konsol.");
                     setIsLoading(false);
                 });
        } else {
            setPenjumboanData({ dailyReport: [], monthlyReport: [], totalProductionMTD: 0 });
        }
    }, [selectedUnit, selectedYear, selectedMonth]);

    const formatProductionValue = (value) => {
        const numericValue = parseFloat(value);
        const finalValue = isNaN(numericValue) ? 0 : numericValue;
        return finalValue.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    };
    
    const totalProduksiTitle = `${monthNames[selectedMonth - 1]} ${selectedYear}`;
    
    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-6 border-b pb-2">
                Dashboard Kinerja {PAGE_GROUP_NAME}
            </h1>
            
            {error && <p className="text-red-600 p-4 bg-red-100 rounded-lg">{error}</p>}
            {isLoading && !error && <p className="text-center text-blue-600 p-8">Memuat data...</p>}

            {/* 1. BARIS KONTROL UTAMA: KPI | Bulan/Tahun | Unit Kerja */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

                {/* ✅ TOTAL PRODUKSI */}
                {!isLoading && (
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
                    <div>
                        <p className="text-sm uppercase opacity-90">
                        Total Produksi
                        </p>
                        <h2 className="text-3xl font-extrabold mt-2 tracking-wide">
                        {formatProductionValue(penjumboanData.totalProductionMTD)}
                        <span className="text-lg font-semibold ml-1">TON</span>
                        </h2>
                    </div>
                    <div className="text-5xl opacity-20 font-black">MTD</div>
                    </div>
                )}

                {/* ✅ FILTER BULAN & TAHUN */}
                <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col gap-4 justify-center">
                    <p className="text-sm font-semibold text-gray-600">
                    Filter Periode
                    </p>
                    <div className="flex gap-3">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        {monthNames.map((name, index) => (
                        <option key={index + 1} value={index + 1}>{name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                    </div>
                </div>

                {/* ✅ FILTER UNIT KERJA */}
                <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col justify-center">
                    <p className="text-sm font-semibold text-gray-600 mb-3">
                    Unit Kerja Aktif
                    </p>

                    <UnitSelector 
                    onSelect={setSelectedUnit}
                    selectedUnit={selectedUnit}
                    allowedGroupName={PAGE_GROUP_NAME}
                    />
                </div>

                </div>
            {/* Akhir BARIS KONTROL UTAMA */}

            
            {/* 2. AREA VISUALISASI CHART */}
            {selectedUnit && !isLoading && !error && (
                <div className="grid grid-cols-1 gap-6">
                    
                    {/* CHART HARIAN POLYSILING */}
                    <div className="lg:col-span-1">
                        <PenjumboanDailyChart dailyReport={penjumboanData.dailyReport} />
                    </div>
                    
                    {/* CHART BULANAN PENJUMBOAN */}
                    <div className="lg:col-span-1">
                        <PenjumboanMonthlyChart monthlyReport={penjumboanData.monthlyReport} />
                    </div>
                </div>
            )}
            
            {/* Pesan jika belum ada unit yang dipilih */}
            {!selectedUnit && !isLoading && (
                <p className="text-center text-gray-500 mt-10 p-4 bg-yellow-100 rounded-lg border border-yellow-300">
                    Silakan pilih **Unit Kerja** untuk menampilkan data dashboard.
                </p>
            )}
        </div>
    );
};


export default PenjumboanDashboardPage;
