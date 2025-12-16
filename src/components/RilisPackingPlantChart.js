// src/components/RilisPackingPlantChart.js (FINAL WITH PIVOTING)

import React, { useMemo } from 'react';
import {
    ComposedChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    CartesianGrid, Line, Label
} from 'recharts';

const monthColors = {
    JAN: '#4C78A8', FEB: '#F58518', MAR: '#E45756', APR: '#72B7B2',
    MEI: '#54A24B', JUN: '#EECA3B', JUL: '#B279A2', AGU: '#FF9DA7',
    SEP: '#9D755D', OKT: '#BAB0AC', NOV: '#1F77B4', DES: '#AEC7E8',
    DEFAULT: '#636363'
};

const monthNamesAbbr = [
    "JAN", "FEB", "MAR", "APR", "MEI", "JUN", 
    "JUL", "AGU", "SEP", "OKT", "NOV", "DES"
];
// Custom Label untuk Line Chart (Total Produksi)
const CustomLineLabel = ({ x, y, value }) => {
    if (value && value > 0) {
        return (
            <text x={x} y={y - 10} dy={-4} fill="#000" fontSize={12} textAnchor="middle" fontWeight="bold">
                {value.toLocaleString()}
            </text>
        );
    }
    return null;
};

// --- FUNGSI PIVOTING DATA (KUNCI PERBAIKAN) ---
const pivotRilisData = (data) => {
    // 1. Dapatkan semua nama unit unik dari data
    const unitNames = [...new Set(data.flatMap(item => 
        Object.keys(item).filter(key => key !== 'month' && key !== 'monthLabel')
    ))];

    const pivotedMap = new Map();

    // Inisialisasi map dengan unit sebagai kunci
    unitNames.forEach(unit => {
        pivotedMap.set(unit, { 
            unitName: unit, 
            TOTAL_PRODUKSI: 0 
        });
        monthNamesAbbr.forEach(month => {
            pivotedMap.get(unit)[month] = 0; // Inisialisasi semua bulan ke 0
        });
    });

    // 2. Isi data bulanan ke dalam struktur pivoted
    data.forEach(monthRow => {
        const monthAbbr = monthNamesAbbr[monthRow.month - 1];
        
        Object.keys(monthRow).forEach(key => {
            if (pivotedMap.has(key)) {
                const value = parseFloat(monthRow[key]) || 0;
                const unitEntry = pivotedMap.get(key);
                
                // Set nilai bulanan
                unitEntry[monthAbbr] = value;
                // Hitung total produksi
                unitEntry.TOTAL_PRODUKSI += value;
            }
        });
    });

    // 3. Konversi ke array dan sort berdasarkan total produksi (sesuai gambar)
    const finalArray = Array.from(pivotedMap.values());
    finalArray.sort((a, b) => b.TOTAL_PRODUKSI - a.TOTAL_PRODUKSI); // Sort descending

    return finalArray;
};


const RilisPackingPlantChart = ({ rilisData, selectedYear }) => {
    
    // Gunakan useMemo untuk memproses data hanya jika rilisData berubah
    const pivotedData = useMemo(() => pivotRilisData(rilisData), [rilisData]);

    if (!pivotedData || pivotedData.length === 0) {
        // ... (return error/empty state) ...
    }

    // Ambil semua nama bulan (JAN, FEB, MAR...) untuk Bar Loop
    const monthlyKeys = monthNamesAbbr; 

    // --- Rendering Logic ---
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Rilis Produksi Per Unit & Bulan (Tahun {selectedYear})</h3>
            
            <ResponsiveContainer width="100%" height={500}>
                <ComposedChart 
                    data={pivotedData} // <-- Menggunakan data yang sudah di-pivot
                    margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
                > 
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    
                    {/* Sumbu X: Nama Unit Kerja */}
                    <XAxis 
                        dataKey="unitName" // Key adalah UnitName
                        angle={-45} 
                        textAnchor="end" 
                        height={100} 
                        interval={0} 
                        style={{ fontSize: '12px' }}
                    />
                    
                    {/* Sumbu Y Kiri: Rilis Produksi (Bar) */}
                    <YAxis 
                        yAxisId="left" 
                        orientation="left" 
                        stroke="#8884d8"
                        label={{ value: 'Rilis Produksi (Ton)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                        tickFormatter={(v) => v.toLocaleString()}
                        domain={[0, (dataMax) => Math.ceil(dataMax * 1.1 / 10000) * 10000]}
                    />
                    
                    {/* Sumbu Y Kanan: Total Rilis Produksi (Line) */}
                    <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        stroke="#82ca9d"
                        label={{ value: 'Total Rilis Produksi (Ton)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
                        tickFormatter={(v) => v.toLocaleString()}
                        domain={[0, (dataMax) => Math.ceil(dataMax * 1.1 / 50000) * 50000]}
                    />
                    
                    <Tooltip /> {/* Gunakan Tooltip default yang lebih baik dengan data pivot */}
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    
                    {/* Render Bar untuk setiap bulan */}
                    {monthlyKeys.map((month, index) => (
                        <Bar 
                            key={month}
                            yAxisId="left"
                            dataKey={month} // JAN, FEB, MAR...
                            fill={monthColors[month] || monthColors.DEFAULT}
                            name={month}
                        />
                    ))}

                    {/* Line Chart untuk Total Produksi Tahunan per Unit */}
                    <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="TOTAL_PRODUKSI" 
                        stroke="#9D755D" // Warna Total yang Kontras
                        strokeWidth={3}
                        dot={{ r: 6, fill: '#FFD700', stroke: '#9D755D', strokeWidth: 2 }} 
                        name="TOTAL"
                        label={<CustomLineLabel />} // Label nilai di atas titik
                    />

                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RilisPackingPlantChart;