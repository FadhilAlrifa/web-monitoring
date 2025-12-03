// src/pages/PenjumboanDashboardPage.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import UnitSelector from '../components/UnitSelector';
import PenjumboanDailyChart from '../components/PenjumboanDailyChart'; 
import PenjumboanMonthlyChart from '../components/PenjumboanMonthlyChart'; 

// const API_URL = 'http://localhost:5000/api';
const API_URL = process.env.REACT_APP_API_URL;

// Panggilan API di frontend:
fetch(`${API_URL}/api`)
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
            
            // Panggil API khusus Penjumboan
            axios.get(`${API_URL}/penjumboan/dashboard/${selectedUnit}/${selectedYear}/${selectedMonth}`)
                 .then(res => {
                     setPenjumboanData(res.data);
                     setIsLoading(false);
                 })
                 .catch(err => {
                     console.error("Gagal mengambil data penjumboan:", err);
                     setError("Gagal memuat data dashboard Penjumboan. Perlu membuat API /penjumboan/dashboard.");
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
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-6 border-b pb-2">
                Dashboard Kinerja {PAGE_GROUP_NAME}
            </h1>
            
            {error && <p className="text-red-600 p-4 bg-red-100 rounded-lg">{error}</p>}
            {isLoading && !error && <p className="text-center text-blue-600 p-8">Memuat data...</p>}

            {/* 1. BARIS KONTROL UTAMA: KPI | Bulan/Tahun | Unit Kerja */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-start">
                
                {/* A. TOTAL PRODUKSI KPI */}
                {!isLoading && (
                    <div className="bg-white p-3 rounded-lg shadow-md border-l-4 border-green-600 flex flex-col justify-center min-h-[80px]">
                        <p className="text-xs font-medium text-gray-500 uppercase flex items-center">
                            <span className="mr-1 text-base">🏢</span> 
                            {totalProduksiTitle}
                        </p>
                        <h2 className="text-xl font-bold text-gray-900">
                            {formatProductionValue(penjumboanData.totalProductionMTD)}
                            <span className="text-xl font-bold text-blue-600 ml-1">TON</span>
                        </h2>
                    </div>
                )}
                
                {/* B. SELEKTOR BULAN DAN TAHUN */}
                <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-blue-600 flex gap-3 items-center">
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="p-2 border rounded-md">
                        {monthNames.map((name, index) => (<option key={index + 1} value={index + 1}>{name}</option>))}
                    </select>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="p-2 border rounded-md">
                        {availableYears.map(year => (<option key={year} value={year}>{year}</option>))}
                    </select>
                </div>
                
                {/* C. UNIT SELECTOR */}
                <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-yellow-600 flex items-center">
                    <label className="mr-2 text-sm font-medium text-gray-700">Pilih Unit:</label>
                    <UnitSelector 
                        onSelect={setSelectedUnit} 
                        selectedUnit={selectedUnit} 
                        allowedGroupName={PAGE_GROUP_NAME} // Filter HANYA unit Penjumboan
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
