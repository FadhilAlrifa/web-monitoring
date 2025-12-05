// src/pages/PemuatanDashboardPage.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Import komponen kontrol standar
import UnitSelector from '../components/UnitSelector';
// Import komponen chart khusus Pemuatan
import PemuatanDailyChart from '../components/PemuatanDailyChart'; 
import PemuatanMonthlyChart from '../components/PemuatanMonthlyChart'; 

// const API_URL = 'http://localhost:5000/api';
const API_URL = process.env.REACT_APP_API_URL;

// HAPUS: fetch(`${API_URL}/api`)
const PAGE_GROUP_NAME = 'Pemuatan'; 

const PemuatanDashboardPage = () => {
    const today = new Date();
    const { logout, user, isAdmin } = useAuth();
    const navigate = useNavigate();
    
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    
    // State untuk menampung data Pemuatan
    const [pemuatanData, setPemuatanData] = useState({ 
        dailyReport: [], 
        monthlyReport: [],
        totalProductionMTD: 0 // Ton Muat MTD
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const availableYears = [2025, 2024, 2023]; 

    // --- FETCH DATA KHUSUS PEMUATAN ---
    useEffect(() => {
        if (selectedUnit && selectedYear && selectedMonth) {
            setIsLoading(true);
            setError(null);
            
            // Panggil API khusus Pemuatan
            // PERBAIKAN: Tambahkan /api/ di sini
            axios.get(`${API_URL}/api/pemuatan/dashboard/${selectedUnit}/${selectedYear}/${selectedMonth}`)
                 .then(res => {
                     setPemuatanData(res.data);
                     setIsLoading(false);
                 })
                 .catch(err => {
                     console.error("Gagal mengambil data pemuatan:", err);
                     setError("Gagal memuat data dashboard Pemuatan. Cek log server.");
                     setIsLoading(false);
                 });
        } else {
            setPemuatanData({ dailyReport: [], monthlyReport: [], totalProductionMTD: 0 });
        }
    }, [selectedUnit, selectedYear, selectedMonth]);

    // --- FUNGSI HELPER ---
    const formatProductionValue = (value) => {
        const numericValue = parseFloat(value);
        const finalValue = isNaN(numericValue) ? 0 : numericValue;
        return finalValue.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    };
    
    const totalMuatTitle = `${monthNames[selectedMonth - 1]} ${selectedYear}`;
    
    // --- RENDERING UTAMA ---
    return (
        <div className="min-h-screen bg-gray-50 p-4">

            {/* ================= HEADER ================= */}
            <div className="flex justify-between items-end mb-6 border-b pb-2">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-wide">
                    Dashboard Kinerja Pemuatan
                </h1>
            </div>

            {error && (
            <p className="text-red-600 p-4 bg-red-100 rounded-xl mb-6">
                {error}
            </p>
            )}

            {isLoading && !error && (
            <p className="text-center text-blue-600 p-8 font-semibold">
                Memuat data...
            </p>
            )}

            {/* ================= HEADER CONTROL PANEL ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

            {/* ✅ TOTAL PEMUATAN */}
            {!isLoading && (
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
                <div>
                    <p className="text-sm uppercase opacity-90">
                    Total Tonase • {totalMuatTitle}
                    </p>
                    <h2 className="text-3xl font-extrabold mt-2 tracking-wide">
                    {formatProductionValue(pemuatanData.totalProductionMTD)}
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
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                    {monthNames.map((name, index) => (
                    <option key={index + 1} value={index + 1}>{name}</option>
                    ))}
                </select>

                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
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
            {/* ================= END HEADER CONTROL PANEL ================= */}


            {/* ================= AREA CHART ================= */}
            {selectedUnit && !isLoading && !error && (
            <div className="grid grid-cols-1 gap-8">

                <div className="bg-white p-6 rounded-2xl shadow-md">
                <PemuatanDailyChart dailyReport={pemuatanData.dailyReport} />
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md">
                <PemuatanMonthlyChart monthlyReport={pemuatanData.monthlyReport} />
                </div>

            </div>
            )}

            {/* ================= EMPTY STATE ================= */}
            {!selectedUnit && !isLoading && (
            <div className="text-center text-gray-500 mt-10 p-6 bg-yellow-100 rounded-xl border border-yellow-300">
                Silakan pilih <b>Unit Kerja</b> untuk menampilkan data dashboard.
            </div>
            )}

        </div>
    );
};


export default PemuatanDashboardPage;
