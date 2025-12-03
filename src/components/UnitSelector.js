// src/components/UnitSelector.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// const API_URL = 'http://localhost:5000/api';
const API_URL = process.env.REACT_APP_API_URL;

// Panggilan API di frontend:
fetch(`${API_URL}/api`)

// Menerima allowedGroupName: string (misal: 'Pabrik' atau 'BKS')
const UnitSelector = ({ onSelect, selectedUnit, allowedGroupName }) => { 
    const [units, setUnits] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUnits = async () => {
            try {
                // API mengembalikan daftar unit dengan group_name masing-masing
                const res = await axios.get(`${API_URL}/api/units`); 
                
                // LOGIKA FILTERING BERDASARKAN GROUP NAME
                let filteredUnits = res.data;
                if (allowedGroupName) {
                    // Hanya tampilkan unit di mana group_name cocok dengan allowedGroupName
                    filteredUnits = res.data.filter(unit => 
                        unit.group_name === allowedGroupName
                    );
                }
                
                setUnits(filteredUnits);
                setIsLoading(false);
                setError(null);
                
                // Set default selected unit
                if (filteredUnits.length > 0 && !selectedUnit) {
                    onSelect(filteredUnits[0].id_unit.toString());
                }
            } catch (err) {
                console.error('Error fetching daftar Unit Kerja:', err);
                setError('Gagal memuat unit kerja dari server.');
                setIsLoading(false);
            }
        };

        fetchUnits();
    }, [onSelect, selectedUnit, allowedGroupName]); 

    if (isLoading) {
        return <p className="text-gray-500 mb-4">Memuat Unit Kerja...</p>;
    }
    if (error) {
        return <p className="text-red-600 font-medium mb-4">{error}</p>;
    }

    return (
        <select
            value={selectedUnit || ''}
            onChange={(e) => onSelect(e.target.value)}
            className="p-2 border border-gray-300 rounded-md text-sm font-medium focus:ring-blue-500 focus:border-blue-500"
        >
            <option value="" disabled>-- Pilih Unit --</option>
            {units.map(u => (
                // Tampilkan nama unit (nama unik per group sudah dijamin di DB)
                <option key={u.id_unit} value={u.id_unit.toString()}>
                    {u.nama_unit}
                </option>
            ))}
        </select>
    );
};


export default UnitSelector;

