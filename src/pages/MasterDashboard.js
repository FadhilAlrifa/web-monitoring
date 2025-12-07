import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar, TrendingUp } from 'lucide-react'; // Hanya menggunakan Calendar untuk filter

// Import komponen chart khusus yang masih digunakan (Rilis)
import RilisProduksiChart from '../components/RilisProduksiChart'; 
import RilisPackingPlantChart from '../components/RilisPackingPlantChart'; 
// UnitSelector tidak diperlukan di sini karena kita tidak memilih unit spesifik

const API_URL = process.env.REACT_APP_API_URL;

const today = new Date();
const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const MasterDashboard = () => {
    // State Filter Global
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    
    // State Rilis Data
    const [rilisDataStates, setRilisDataStates] = useState({
        pabrik:      [],
        bks:         [],
        packing:     [],
    });

    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    
    const availableYears = [2025, 2024, 2023]; 

    // --- FETCH DATA RILIS (Agregasi Tahun Bulanan) ---
    const fetchRilisData = async (moduleKey, apiPath) => {
        try {
            const endpoint = `${API_URL}/api/${apiPath}/rilis/${selectedYear}`;
            const res = await axios.get(endpoint);
            
            setRilisDataStates(prev => ({
                ...prev,
                [moduleKey]: res.data || []
            }));
        } catch (err) {
            console.error(`Error fetching Rilis data for ${moduleKey}:`, err);
        }
    };

    // EFFECT UTAMA: Dipicu oleh filter Tahun
    useEffect(() => {
        setIsLoading(true);
        // Mengambil Rilis Pabrik
        fetchRilisData('pabrik', 'produksi/pabrik');
        // Mengambil Rilis BKS
        fetchRilisData('bks', 'produksi/bks');
        // Mengambil Rilis Packing Plant
        fetchRilisData('packing', 'packing-plant');

        setIsLoading(false);
    }, [selectedYear]); 

    // --- RENDER HELPERS ---
    const monthDisplay = `${monthNames[today.getMonth()]} ${selectedYear}`;
    
    const formatValue = (value) => {
        if (value === 'N/A') return value;
        const numericValue = parseFloat(value);
        return isNaN(numericValue) ? 0 : numericValue.toLocaleString(undefined, { maximumFractionDigits: 0 });
    };

    // FUNGSI BARU: Menghitung Total Produksi dari Data Rilis
    const calculateTotalRilis = (data) => {
        if (!data || data.length === 0) return 0;
        
        // Asumsi: data memiliki struktur [{monthLabel: 'JAN', UnitA: 100, UnitB: 200}, ...]
        // Kita perlu menjumlahkan semua nilai Ton dari semua unit di semua bulan.
        
        let total = 0;
        data.forEach(monthData => {
            Object.keys(monthData).forEach(key => {
                // Hanya jumlahkan key yang bukan 'month' atau 'monthLabel'
                if (key !== 'month' && key !== 'monthLabel') {
                    total += parseFloat(monthData[key]) || 0;
                }
            });
        });
        return total;
    };
    
    // --- RENDERING UTAMA ---
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-2">
                📊 Rilis Produksi 
            </h1>
            <p className="text-gray-500 mb-8">Perbandingan kinerja tahunan antar grup utama.</p>

            {/* Global Filters & Time Display (Hanya Tahun) */}
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 mb-10">
                <div className="flex flex-wrap gap-4 items-center">
                    
                    {/* Display Periode Aktif */}
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Calendar size={18} className="text-purple-600" />
                        <span className="mr-2">Tahun Aktif:</span>
                    </div>
                    
                    {/* Selector Tahun */}
                    <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 transition-shadow focus:ring-2 focus:ring-purple-200">
                        {availableYears.map(year => (<option key={year} value={year}>{year}</option>))}
                    </select>
                </div>
            </div>
            
            {/* === CHART RILIS UTAMA (SUSUNAN VERTIKAL) === */}
            <h3 className="text-xl font-semibold text-gray-700 mb-4 border-t pt-6">Visualisasi Agregasi ({selectedYear})</h3>
            
            {isLoading ? (
                <p className="text-center p-10 text-blue-600 animate-pulse">Memuat data rilis bulanan...</p>
            ) : (
                // Susunan Vertikal
                <div className="space-y-6"> 
                    
                    {/* 1. Rilis Produksi Pabrik */}
                    <div className="w-full bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                         {/* Total Produksi Pabrik */}
                         <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-red-50">
                             <TrendingUp size={24} className="text-red-600" />
                             <div>
                                 <p className="text-sm font-medium text-gray-600">Total Produksi Pabrik (Agregat)</p>
                                 <h4 className="text-2xl font-extrabold text-red-700">
                                     {formatValue(calculateTotalRilis(rilisDataStates.pabrik))} <span className="text-lg font-semibold">TON</span>
                                 </h4>
                             </div>
                         </div>
                         <RilisProduksiChart 
                             rilisData={rilisDataStates.pabrik} 
                             selectedYear={selectedYear} 
                             groupName="Pabrik" 
                         />
                    </div>

                    {/* 2. Rilis Produksi BKS (Pelabuhan) */}
                    <div className="w-full bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                         {/* Total Produksi BKS */}
                         <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-green-50">
                             <TrendingUp size={24} className="text-green-600" />
                             <div>
                                 <p className="text-sm font-medium text-gray-600">Total Produksi Pelabuhan (Agregat)</p>
                                 <h4 className="text-2xl font-extrabold text-green-700">
                                     {formatValue(calculateTotalRilis(rilisDataStates.bks))} <span className="text-lg font-semibold">TON</span>
                                 </h4>
                             </div>
                         </div>
                         <RilisProduksiChart 
                             rilisData={rilisDataStates.bks} 
                             selectedYear={selectedYear} 
                             groupName="BKS" 
                         />
                    </div>
                    
                    {/* 3. Rilis Packing Plant */}
                    <div className="w-full bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                         {/* Total Produksi Packing Plant */}
                         <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-indigo-50">
                             <TrendingUp size={24} className="text-indigo-600" />
                             <div>
                                 <p className="text-sm font-medium text-gray-600">Total Produksi Packing Plant (Agregat)</p>
                                 <h4 className="text-2xl font-extrabold text-indigo-700">
                                     {formatValue(calculateTotalRilis(rilisDataStates.packing))} <span className="text-lg font-semibold">TON</span>
                                 </h4>
                             </div>
                         </div>
                         <RilisPackingPlantChart 
                             rilisData={rilisDataStates.packing} 
                             selectedYear={selectedYear} 
                             groupName="Packing Plant" 
                         />
                    </div>
                </div>
            )}
        </div>
    );
};


export default MasterDashboard;