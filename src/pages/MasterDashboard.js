import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Import komponen chart khusus yang masih digunakan (Rilis & Selector)
import UnitSelector from '../components/UnitSelector';
import RilisProduksiChart from '../components/RilisProduksiChart'; 
import RilisPackingPlantChart from '../components/RilisPackingPlantChart'; 

// HAPUS IMPOR CHART DETAIL YANG TIDAK DIGUNAKAN:
// DailyChart, MonthlyChart, HambatanPieChart, dll.

const API_URL = process.env.REACT_APP_API_URL;

const today = new Date();

// Definisi Nama Bulan
const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];


const MasterDashboard = () => {
    const { logout, user, isAdmin } = useAuth();
    const navigate = useNavigate();
    
    // Global Filters (Monthly Context)
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    
    // State untuk Master Data Unit (Dipakai oleh semua selector)
    const [allUnits, setAllUnits] = useState([]);

    // States untuk Filter & Data Spesifik MODUL (Hanya simpan MTD dan Rilis)
    const [modulStates, setModulStates] = useState({
        // PRODUKSI UMUM (LaporanHarian)
        pabrik:      { unitId: null, name: 'Pabrik', data: { totalProductionMTD: 0, rilisData: [] } },
        bks:         { unitId: null, name: 'BKS', data: { totalProductionMTD: 0, rilisData: [] } },
        // MODUL SPESIFIK
        penjumboan:  { unitId: null, name: 'Penjumboan', data: { totalProductionMTD: 0 } },
        pemuatan:    { unitId: null, name: 'Pemuatan', data: { totalProductionMTD: 0 } },
        packing:     { unitId: null, name: 'Packing Plant', data: { totalProductionMTD: 0, rilisData: [] } },
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const availableYears = [2025, 2024, 2023]; 

    // --- FETCH MASTER UNIT (GLOBAL) ---
    useEffect(() => {
        const fetchMasterUnits = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/units`); 
                setAllUnits(res.data);
                setIsLoading(false);
            } catch (err) {
                console.error("Gagal fetch unit master:", err);
                setIsLoading(false);
            }
        };
        fetchMasterUnits();
    }, []);
    
    // --- FUNGSI UTAMA FETCH DATA MODUL (Hanya ambil Total MTD) ---
    const fetchModuleData = async (moduleKey, unitId, groupName) => {
        if (!unitId || !selectedYear || !selectedMonth) return;

        let endpoint;
        switch (moduleKey) {
            case 'pabrik':
            case 'bks':
                // Dashboard Produksi/Hambatan
                endpoint = `${API_URL}/api/dashboard/${unitId}/${selectedYear}/${selectedMonth}`; 
                break;
            case 'penjumboan':
                endpoint = `${API_URL}/api/penjumboan/dashboard/${unitId}/${selectedYear}/${selectedMonth}`;  
                break;
            case 'pemuatan':
                endpoint = `${API_URL}/api/pemuatan/dashboard/${unitId}/${selectedYear}/${selectedMonth}`;
                break;
            case 'packing':
                endpoint = `${API_URL}/api/packing-plant/dashboard/${unitId}/${selectedYear}/${selectedMonth}`;
                break;
            default:
                return;
        }

        try {
            const res = await axios.get(endpoint);
            // Hanya ambil totalProductionMTD dari response yang mungkin berisi dailyReport, monthlyReport, dll.
            const totalMTD = res.data.totalProductionMTD || 0; 

            setModulStates(prev => ({
                ...prev,
                [moduleKey]: { 
                    ...prev[moduleKey], 
                    data: { ...prev[moduleKey].data, totalProductionMTD: totalMTD } 
                }
            }));

        } catch (err) {
            console.error(`Error fetching MTD data for ${groupName}:`, err);
        }
    };
    
    // --- FETCH DATA RILIS (Agregasi Tahun Bulanan) ---
    const fetchRilisData = async (moduleKey, groupName) => {
        let apiPath;
        if (moduleKey === 'packing') apiPath = 'packing-plant';
        else if (moduleKey === 'pabrik') apiPath = 'produksi/pabrik';
        else if (moduleKey === 'bks') apiPath = 'produksi/bks';
        else return;

        try {
            const res = await axios.get(`${API_URL}/api/${apiPath}/rilis/${selectedYear}`); 
            setModulStates(prev => ({
                ...prev,
                [moduleKey]: { 
                    ...prev[moduleKey], 
                    data: { ...prev[moduleKey].data, rilisData: res.data || [] } 
                }
            }));
        } catch (err) {
            console.error(`Error fetching Rilis data for ${groupName}:`, err);
        }
    };

    // EFFECT UTAMA: Dipicu oleh filter Global
    useEffect(() => {
        // Fetch data harian/bulanan untuk semua modul yang unitnya sudah dipilih
        Object.entries(modulStates).forEach(([key, moduleState]) => {
            // Hanya fetch jika unitId sudah terpilih
            if (moduleState.unitId) {
                fetchModuleData(key, moduleState.unitId, moduleState.name);
            }
        });
        
        // Fetch data rilis (agregasi) untuk modul yang didukung
        fetchRilisData('pabrik', 'Pabrik');
        fetchRilisData('bks', 'BKS');
        fetchRilisData('packing', 'Packing Plant');

    }, [selectedYear, selectedMonth, modulStates]); 

    // --- RENDER HELPERS ---
    const handleUnitChange = (moduleKey, newUnitId) => {
        // Ketika unit berubah, kita update state dan trigger useEffect
        setModulStates(prev => ({
            ...prev,
            [moduleKey]: { ...prev[moduleKey], unitId: newUnitId }
        }));
    };

    // FIX: getSelectedUnitName ditambahkan
    const getSelectedUnitName = (moduleKey) => {
        const unitId = modulStates[moduleKey]?.unitId;
        if (!unitId) return '';
        return allUnits.find(u => u.id_unit.toString() === unitId)?.nama_unit || '';
    };

    const formatProductionValue = (value) => {
        const numericValue = parseFloat(value);
        return isNaN(numericValue) ? 0 : numericValue.toLocaleString(undefined, { maximumFractionDigits: 0 });
    };

    const monthDisplay = `${monthNames[selectedMonth - 1]} ${selectedYear}`;
    
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    
    // --- RENDERING UTAMA ---
    if (isLoading) { return <p className="text-center p-20">Memuat data master...</p>; }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 border-b pb-2">
                Master Dashboard Kinerja Operasi
            </h1>

            {/* Global Filters */}
            <div className="flex flex-wrap gap-4 mb-8 items-center">
                
                <div className="bg-white p-3 rounded-lg shadow-md border-l-4 border-purple-600">
                    <p className="text-xs font-medium text-gray-500 uppercase">Bulan Aktif</p>
                    <h2 className="text-xl font-bold text-gray-900">{monthDisplay}</h2>
                </div>
                
                {/* Selector Bulan */}
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="p-2 border rounded-md text-sm">
                    {monthNames.map((name, index) => (<option key={index + 1} value={index + 1}>{name}</option>))}
                </select>
                
                {/* Selector Tahun */}
                <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="p-2 border rounded-md text-sm">
                    {availableYears.map(year => (<option key={year} value={year}>{year}</option>))}
                </select>
            </div>
            
            <div className="space-y-10">
                
                {/* ==================================================================== */}
                {/* MODUL 1: PRODUKSI PABRIK */}
                {/* ==================================================================== */}
                <div className="p-6 bg-white rounded-xl shadow-lg border-t-4 border-red-500">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-red-700">1. Produksi Pabrik</h2>
                    <div className="flex flex-wrap gap-4 mb-4 items-center">
                        <UnitSelector 
                            onSelect={(id) => handleUnitChange('pabrik', id)} 
                            selectedUnit={modulStates.pabrik.unitId} 
                            allowedGroupName="Pabrik" 
                        />
                        <span className="text-lg font-semibold text-gray-700">
                             Total MTD: {formatProductionValue(modulStates.pabrik.data?.totalProductionMTD)} TON
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* CHART DETAIL HILANG */}
                         <div className="lg:col-span-3 mt-4">
                             <RilisProduksiChart 
                                 rilisData={modulStates.pabrik.data?.rilisData || []} 
                                 selectedYear={selectedYear} 
                                 groupName="Pabrik" 
                             />
                         </div>
                    </div>
                </div>
                
                {/* ==================================================================== */}
                {/* MODUL 2: PRODUKSI BKS */}
                {/* ==================================================================== */}
                <div className="p-6 bg-white rounded-xl shadow-lg border-t-4 border-green-500">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-green-700">2. Produksi BKS</h2>
                    <div className="flex flex-wrap gap-4 mb-4 items-center">
                        <UnitSelector 
                            onSelect={(id) => handleUnitChange('bks', id)} 
                            selectedUnit={modulStates.bks.unitId} 
                            allowedGroupName="BKS" 
                        />
                        <span className="text-lg font-semibold text-gray-700">
                             Total MTD: {formatProductionValue(modulStates.bks.data?.totalProductionMTD)} TON
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* CHART DETAIL HILANG */}
                         <div className="lg:col-span-3 mt-4">
                             <RilisProduksiChart 
                                 rilisData={modulStates.bks.data?.rilisData || []} 
                                 selectedYear={selectedYear} 
                                 groupName="BKS" 
                             />
                         </div>
                    </div>
                </div>


                {/* ==================================================================== */}
                {/* MODUL 3: PENJUMBOAN */}
                {/* ==================================================================== */}
                <div className="p-6 bg-white rounded-xl shadow-lg border-t-4 border-blue-500">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-blue-700">3. Penjumboan</h2>
                    <div className="flex flex-wrap gap-4 mb-4 items-center">
                        <UnitSelector 
                            onSelect={(id) => handleUnitChange('penjumboan', id)} 
                            selectedUnit={modulStates.penjumboan.unitId} 
                            allowedGroupName="Penjumboan" 
                        />
                         <span className="text-lg font-semibold text-gray-700">
                              Total MTD: {formatProductionValue(modulStates.penjumboan.data?.totalProductionMTD)} TON
                         </span>
                    </div>
                    
                    {/* CHART DETAIL HILANG */}
                    <div className="mt-4">
                        <p className="text-sm text-gray-500">
                            *Untuk melihat data harian dan bulanan silahkan pindah ke halaman dashboard Penjumboan.*
                        </p>
                    </div>
                </div>

                {/* ==================================================================== */}
                {/* MODUL 4: PEMUATAN */}
                {/* ==================================================================== */}
                 <div className="p-6 bg-white rounded-xl shadow-lg border-t-4 border-yellow-500">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-yellow-700">4. Pemuatan</h2>
                    <div className="flex flex-wrap gap-4 mb-4 items-center">
                        <UnitSelector 
                            onSelect={(id) => handleUnitChange('pemuatan', id)} 
                            selectedUnit={modulStates.pemuatan.unitId} 
                            allowedGroupName="Pemuatan" 
                        />
                         <span className="text-lg font-semibold text-gray-700">
                              Total MTD: {formatProductionValue(modulStates.pemuatan.data?.totalProductionMTD)} TON
                         </span>
                    </div>
                    
                    {/* CHART DETAIL HILANG */}
                    <div className="mt-4">
                        <p className="text-sm text-gray-500">
                            *Untuk melihat data harian dan bulanan silahkan pindah ke halaman dashboard Pemuatan.*
                        </p>
                    </div>
                </div>
                
                {/* ==================================================================== */}
                {/* MODUL 5: PACKING PLANT */}
                {/* ==================================================================== */}
                 <div className="p-6 bg-white rounded-xl shadow-lg border-t-4 border-indigo-500">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-indigo-700">5. Packing Plant</h2>
                    <div className="flex flex-wrap gap-4 mb-4 items-center">
                        <UnitSelector 
                            onSelect={(id) => handleUnitChange('packing', id)} 
                            selectedUnit={modulStates.packing.unitId} 
                            allowedGroupName="Packing Plant" 
                        />
                         <span className="text-lg font-semibold text-gray-700">
                              Total MTD: {formatProductionValue(modulStates.packing.data?.totalProductionMTD)} TON
                         </span>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                         {/* Chart Rilis Packing Plant (Selalu tampil) */}
                          <div className="lg:col-span-3 mt-4">
                              <RilisPackingPlantChart 
                                  rilisData={modulStates.packing.data?.rilisData || []} 
                                  selectedYear={selectedYear} 
                                  groupName="Packing Plant" 
                              />
                          </div>
                    </div>
                </div>


            </div> {/* End space-y-10 */}
        </div>
    );
};


export default MasterDashboard;