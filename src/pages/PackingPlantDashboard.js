// src/pages/PackingPlantDashboard.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; 

// Import komponen chart khusus
import PackingPlantDailyChart from '../components/PackingPlantDailyChart'; 
import PackingPlantMonthlyChart from '../components/PackingPlantMonthlyChart'; 
import UnitSelector from '../components/UnitSelector';
import RilisPackingPlantChart from '../components/RilisPackingPlantChart'; 

const API_URL = 'http://localhost:5000/api';
const PAGE_GROUP_NAME = 'Packing Plant'; 

const PackingPlantDashboard = () => {
    const today = new Date();
    const { user, isAdmin } = useAuth();
    
    // States untuk filter
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    
    // State untuk data agregat Rilis (semua unit per bulan)
    const [rilisData, setRilisData] = useState([]); 
    
    // State untuk data per unit yang dipilih (harian/bulanan)
    const [ppData, setPpData] = useState({ 
        dailyReport: [], 
        monthlyReport: [],
        totalProductionMTD: 0
    });
    
    // State UI
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [allowedUnitsList, setAllowedUnitsList] = useState([]); // Untuk lookup nama unit

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", 
                        "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const availableYears = [2025, 2024, 2023]; 

    // --- FETCH MASTER DATA (Untuk lookup nama unit) ---
    useEffect(() => {
        const fetchUnitsList = async () => {
            try {
                const res = await axios.get(`${API_URL}/units`);
                const filteredUnits = res.data.filter(unit => unit.group_name === PAGE_GROUP_NAME);
                setAllowedUnitsList(filteredUnits);
            } catch (err) {
                console.error("Gagal fetch unit master:", err);
            }
        };
        fetchUnitsList();
    }, []);

    // --- FUNGSI FETCH DATA HARIAN/BULANAN (1 UNIT) ---
    const fetchPpData = async () => {
        if (!selectedUnit || !selectedYear || !selectedMonth) {
             setPpData({ dailyReport: [], monthlyReport: [], totalProductionMTD: 0 });
             return;
        }

        setIsLoading(true);
        setError(null);
        
        axios.get(`${API_URL}/packing-plant/dashboard/${selectedUnit}/${selectedYear}/${selectedMonth}`)
             .then(res => {
                 setPpData(res.data);
                 setIsLoading(false);
             })
             .catch(err => {
                 console.error("Gagal mengambil data PP:", err);
                 setError("Gagal memuat data dashboard Packing Plant. Cek log server.");
                 setIsLoading(false);
             });
    };

    // --- FUNGSI FETCH DATA RILIS BULANAN (Semua Unit per Tahun) ---
    const fetchRilisData = async () => {
        if (!selectedYear) return;
        
        try {
            const res = await axios.get(`${API_URL}/packing-plant/rilis/${selectedYear}`);
            setRilisData(res.data);
        } catch (err) {
            console.error("Gagal ambil data rilis:", err);
        }
    };
    
    // useEffect 1: Mengambil data Harian/Bulanan (Per Unit)
    useEffect(() => {
        fetchPpData();
    }, [selectedUnit, selectedYear, selectedMonth]); 

    // useEffect 2: Mengambil data Rilis (Semua Unit, Hanya per Tahun)
    useEffect(() => {
        fetchRilisData();
    }, [selectedYear]); 

    // --- FUNGSI HELPER ---
    const formatProductionValue = (value) => {
        const numericValue = parseFloat(value);
        const finalValue = isNaN(numericValue) ? 0 : numericValue;
        return finalValue.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    };
    
    // Lookup nama unit spesifik
    const selectedUnitObject = allowedUnitsList.find(unit => unit.id_unit.toString() === selectedUnit);
    const selectedUnitName = selectedUnitObject ? selectedUnitObject.nama_unit : '';
    
    const totalMuatTitle = `${monthNames[selectedMonth - 1]} ${selectedYear}`;
    
    // --- RENDERING UTAMA ---
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            
            <div className="flex justify-between items-end mb-6 border-b pb-2">
                <h1 className="text-4xl font-extrabold text-gray-900">
                    Dashboard Kinerja {PAGE_GROUP_NAME}
                </h1>
            </div>

            {error && <p className="text-red-600 p-4 bg-red-100 rounded-lg">{error}</p>}
            
            {isLoading && !error && <p className="text-center text-blue-600 p-8">Memuat data...</p>}

            {/* 1. BARIS KONTROL UTAMA: KPI | Bulan/Tahun | Unit Kerja */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-start">
                
                {/* A. TOTAL MUAT KPI */}
                {!isLoading && (
                    <div className="bg-white p-3 rounded-lg shadow-md border-l-4 border-green-600 flex flex-col justify-center min-h-[80px]">
                        <p className="text-xs font-medium text-gray-500 uppercase flex items-center">
                            <span className="mr-1 text-base">🏢</span> 
                            {totalMuatTitle}
                        </p>
                        <h2 className="text-xl font-bold text-gray-900">
                            {formatProductionValue(ppData.totalProductionMTD)}
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
                
                {/* C. UNIT SELECTOR */}
                <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-yellow-600 flex items-center">
                    <label className="mr-2 text-sm font-medium text-gray-700">Pilih Unit:</label>
                    <UnitSelector 
                        onSelect={setSelectedUnit} 
                        selectedUnit={selectedUnit} 
                        allowedGroupName={PAGE_GROUP_NAME} // Filter HANYA unit Packing Plant
                    />
                </div>
            </div>

            
            {/* 2. AREA VISUALISASI CHART (Layout 3-Row Stacked) */}
            <div className="grid grid-cols-1 gap-6 mt-6">
                 
                {/* ROW 1: CHART HARIAN (Per Unit) */}
                {selectedUnit && !isLoading && !error && (
                    <div className="lg:col-span-1">
                        <PackingPlantDailyChart 
                            dailyReport={ppData.dailyReport} 
                            unitName={selectedUnitName} 
                        />
                    </div>
                )}
                
                {/* ROW 2: CHART BULANAN (Per Unit) */}
                {selectedUnit && !isLoading && !error && (
                    <div className="lg:col-span-1">
                        <PackingPlantMonthlyChart monthlyReport={ppData.monthlyReport} />
                    </div>
                )}
                
                {/* ROW 3: CHART RILIS (Komparasi Semua Unit) - Di posisi paling bawah */}
                 {selectedYear && (
                     <div className="lg:col-span-1">
                         <RilisPackingPlantChart 
                            rilisData={rilisData} 
                            selectedYear={selectedYear} 
                         />
                     </div>
                 )}
                
            </div>
            
            {/* Pesan jika belum ada unit yang dipilih */}
            {!selectedUnit && !isLoading && (
                <p className="text-center text-gray-500 mt-10 p-4 bg-yellow-100 rounded-lg border border-yellow-300">
                    Silakan pilih **Unit Kerja** untuk menampilkan data dashboard harian dan bulanan.
                </p>
            )}
        </div>
    );
};

export default PackingPlantDashboard;