import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react'; // Hanya menggunakan Calendar untuk filter

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
    
    // --- RENDERING UTAMA ---
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-2">
                Ringkasan Rilis Produksi Bulanan
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
                // PERBAIKAN: Mengganti lg:grid-cols-3 menjadi space-y-6 untuk susunan vertikal penuh
                <div className="space-y-6"> 
                    
                    {/* 1. Rilis Produksi Pabrik */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 w-full">
                         <RilisProduksiChart 
                             rilisData={rilisDataStates.pabrik} 
                             selectedYear={selectedYear} 
                             groupName="Pabrik" 
                         />
                    </div>

                    {/* 2. Rilis Produksi BKS (Pelabuhan) */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 w-full">
                         <RilisProduksiChart 
                             rilisData={rilisDataStates.bks} 
                             selectedYear={selectedYear} 
                             groupName="BKS" 
                         />
                    </div>
                    
                    {/* 3. Rilis Packing Plant */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 w-full">
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