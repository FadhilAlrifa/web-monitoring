import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import UnitSelector from '../components/UnitSelector';
import DailyChart from '../components/DailyChart';       
import HambatanPieChart from '../components/HambatanPieChart';  
import MonthlyChart from '../components/MonthlyChart';       
import RilisProduksiChart from '../components/RilisProduksiChart'; 

const API_URL = process.env.REACT_APP_API_URL;

const DashboardPage = ({ unitGroup }) => { 
    const today = new Date();
    const { logout } = useAuth();
    const navigate = useNavigate();
    
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [allowedUnitsList, setAllowedUnitsList] = useState([]); 
    
    const [dashboardData, setDashboardData] = useState({ 
        dailyReport: [], 
        monthlyReport: [],
        totalProductionMTD: 0,
        hambatanSummary: {}
    });
    
    const [rilisData, setRilisData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const availableYears = [2025, 2024, 2023]; 

    const getGroupName = () => unitGroup === 'pabrik' ? 'Pabrik' : unitGroup === 'bks' ? 'BKS' : 'Global';
    const groupDisplay = getGroupName();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        const fetchUnitsList = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/units`);
                let filteredUnits = res.data;
                if (groupDisplay !== 'Global') {
                    filteredUnits = res.data.filter(unit => unit.group_name === groupDisplay);
                }
                setAllowedUnitsList(filteredUnits);
            } catch (err) {
                console.error(err);
            }
        };
        fetchUnitsList();
    }, [unitGroup, groupDisplay]);

    const fetchRilis = async () => {
        if (groupDisplay === 'Global') return setRilisData([]);
        try {
            const res = await axios.get(`${API_URL}/api/produksi/${unitGroup}/rilis/${selectedYear}`); 
            setRilisData(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (selectedUnit && selectedYear && selectedMonth) {
            setIsLoading(true);
            setError(null);
            
            axios.get(`${API_URL}/api/dashboard/${selectedUnit}/${selectedYear}/${selectedMonth}`) 
                 .then(res => {
                     setDashboardData(res.data);
                     setIsLoading(false);
                 })
                 .catch(err => {
                     if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                         handleLogout();
                     } else {
                         setError("Gagal memuat data dashboard.");
                     }
                     setIsLoading(false);
                 });
        }
    }, [selectedUnit, selectedYear, selectedMonth]);
    
    useEffect(() => {
        fetchRilis();
    }, [selectedYear, unitGroup]);

    const selectedUnitObject = allowedUnitsList.find(unit => unit.id_unit.toString() === selectedUnit);
    const selectedUnitName = selectedUnitObject ? selectedUnitObject.nama_unit : '';

    const formatProductionValue = (value) => {
        const numericValue = parseFloat(value);
        const finalValue = isNaN(numericValue) ? 0 : numericValue;
        return finalValue.toLocaleString('id-ID', { maximumFractionDigits: 0 });
    };
    
    const hambatanChartTitle = `Hambatan ${monthNames[selectedMonth - 1]} ${selectedYear}`;

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="flex justify-between items-end mb-6 border-b pb-2">
                <h1 className="text-4xl font-extrabold text-gray-900">
                    Dashboard Produksi {groupDisplay}
                </h1>
            </div>

            {error && <p className="text-red-600 p-4 bg-red-100 rounded-lg">{error}</p>}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
                    <div>
                        <p className="text-sm uppercase opacity-90">Total Produksi MTD</p>
                        <h2 className="text-3xl font-extrabold mt-2 tracking-wide">
                            {formatProductionValue(dashboardData.totalProductionMTD)} 
                            <span className="text-lg font-semibold ml-1">TON</span>
                        </h2>
                    </div>
                    <div className="text-5xl opacity-20 font-black">MTD</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col gap-4 justify-center">
                    <p className="text-sm font-semibold text-gray-600">Periode</p>
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

                {groupDisplay !== 'Global' && (
                    <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col justify-center">
                        <p className="text-sm font-semibold text-gray-600 mb-3">Unit Kerja</p>
                        <UnitSelector 
                            onSelect={setSelectedUnit} 
                            selectedUnit={selectedUnit} 
                            allowedGroupName={groupDisplay} 
                        />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 mt-6">
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
                
                {groupDisplay !== 'Global' && (
                    <div className="w-full">
                        <RilisProduksiChart 
                            rilisData={rilisData} 
                            selectedYear={selectedYear} 
                            groupName={groupDisplay} 
                        />
                    </div>
                )}
            </div>

            {!selectedUnit && groupDisplay !== 'Global' && !isLoading && (
                <div className="text-center text-gray-500 mt-10 p-6 bg-blue-50 rounded-xl border-2 border-dashed border-blue-200">
                    <p className="text-lg font-medium">Pilih Unit Kerja untuk melihat visualisasi data performa harian dan bulanan.</p>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;