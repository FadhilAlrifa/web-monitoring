import React, { useMemo } from 'react';
import {
    ComposedChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    CartesianGrid, Line, LabelList, Label
} from 'recharts';

// Warna yang konsisten untuk unit (dapat disesuaikan)
const UNIT_COLORS = [
    '#007bff', // Biru Cerah - P1
    '#ffc107', // Kuning - P2
    '#28a745', // Hijau - P3
    '#dc3545', // Merah - P4
    '#6f42c1', // Ungu - P5
    '#17a2b8', // Cyan
    '#fd7e14', // Orange
    '#6c757d', // Abu-abu
];

// Custom Tooltip Content untuk menampilkan detail per Unit dan Total
const CustomTooltip = ({ active, payload, label, selectedYear }) => {
    if (active && payload && payload.length) {
        // Find total line and target line
        const totalLine = payload.find(p => p.dataKey === 'TOTAL_PRODUKSI');
        const targetLine = payload.find(p => p.dataKey === 'RKAP');
        
        return (
            <div className="bg-white p-3 border border-gray-300 shadow-md rounded-lg text-sm">
                <p className="font-bold text-gray-800 mb-1">{label} {selectedYear}</p>
                {payload
                    // Filter Bar (Unit) dan sort by value
                    .filter(p => p.dataKey !== 'TOTAL_PRODUKSI' && p.dataKey !== 'RKAP' && p.type === 'bar') 
                    .sort((a, b) => b.value - a.value) // Sort descending by value
                    .map((p, index) => (
                        <p key={`tooltip-bar-${index}`} style={{ color: p.color }}>
                            {p.name}: <span className="font-semibold">{p.value?.toLocaleString()} Ton</span>
                        </p>
                    ))}
                
                {/* Total and Target Lines */}
                {(totalLine || targetLine) && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                        {totalLine && <p className="font-bold text-gray-700">Total: {totalLine.value?.toLocaleString()} Ton</p>}
                        {targetLine && <p className="text-orange-500 font-semibold">Target RKAP: {targetLine.value?.toLocaleString()} Ton</p>}
                    </div>
                )}
            </div>
        );
    }
    return null;
};

// Custom Label untuk Line Chart (Total Produksi & RKAP)
const CustomLineLabel = ({ x, y, value, name }) => {
    if (value && value > 0) {
         return (
            <text x={x} y={y - 10} dy={-4} fill="#000" fontSize={12} textAnchor="middle" fontWeight="bold">
                {value.toLocaleString()}
            </text>
        );
    }
    return null;
};


// --- FUNGSI PREPARASI DATA (Kunci: Agregasi Unit Keys) ---
const prepareRilisData = (data) => {
    // 1. Sort data berdasarkan bulan (1 hingga 12)
    const processedData = (data || []).sort((a, b) => a.month - b.month);
    
    // 2. Tambahkan total agregat per bulan (Line Chart TOTAL)
    return processedData.map(monthData => {
        let totalBulanan = 0;
        // Hanya jumlahkan data key yang TIDAK termasuk month, monthLabel, RKAP
        Object.keys(monthData).forEach(key => {
            if (key !== 'month' && key !== 'monthLabel' && key !== 'RKAP' && key !== 'TOTAL_PRODUKSI') {
                totalBulanan += parseFloat(monthData[key]) || 0;
            }
        });
        
        return {
            ...monthData,
            TOTAL_PRODUKSI: totalBulanan, // Total produksi per bulan (untuk Line Chart)
            RKAP: parseFloat(monthData.RKAP) || 10000 // Pastikan RKAP tersedia
        };
    });
};


const RilisProduksiChart = ({ rilisData, selectedYear, groupName }) => {
    
    // Gunakan useMemo untuk memproses data hanya jika rilisData berubah
    const processedData = useMemo(() => prepareRilisData(rilisData), [rilisData]);

    // PERBAIKAN: Ambil semua nama unit unik dari SELURUH data array
    const allUnitKeys = useMemo(() => {
        const keys = new Set();
        processedData.forEach(item => {
            Object.keys(item).forEach(key => {
                // Hanya ambil kunci yang merupakan Unit Kerja
                if (!['month', 'monthLabel', 'TOTAL_PRODUKSI', 'RKAP'].includes(key)) {
                    keys.add(key);
                }
            });
        });
        return Array.from(keys);
    }, [processedData]);

    const unitKeys = allUnitKeys; // Ini adalah daftar unit kerja yang akan menjadi Legenda
    
    if (!processedData || processedData.length === 0 || unitKeys.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg h-96 flex flex-col justify-center items-center">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Rilis Produksi {groupName} (Tahun {selectedYear})</h3>
                <p className="text-center text-gray-500 py-10">Tidak ada data rilis unit ditemukan untuk tahun {selectedYear}.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Rilis Produksi {groupName} (Tahun {selectedYear})</h3>
            
            <ResponsiveContainer width="100%" height={500}>
                <ComposedChart 
                    data={processedData}
                    margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
                    // Menggunakan barGap={2} untuk memisahkan bar agar tidak terlalu rapat
                    barGap={2} 
                > 
                    <CartesianGrid strokeDasharray="3 3" />
                    
                    {/* Sumbu X: BULAN */}
                    <XAxis 
                        dataKey="monthLabel" 
                        style={{ fontSize: '12px' }}
                    />
                    
                    {/* Sumbu Y Kiri: Rilis Produksi (Bar) */}
                    <YAxis 
                        yAxisId="left" 
                        orientation="left" 
                        stroke="#8884d8"
                        label={{ value: 'Rilis Produksi (Ton)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                        tickFormatter={(v) => v.toLocaleString()}
                        // Dinamis domain dari data total bulanan
                        domain={[0, (dataMax) => Math.ceil(dataMax * 1.1 / 10000) * 10000]}
                    />
                    
                    {/* Sumbu Y Kanan: Line (Total) - Dihilangkan atau Disembunyikan jika tidak digunakan */}
                    <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        stroke="#54A24B"
                        tickFormatter={(v) => v.toLocaleString()}
                        // Dinamis domain yang lebih besar untuk Total (Line)
                        domain={[0, (dataMax) => Math.ceil(dataMax * 1.1 / 50000) * 50000]} 
                        // Tambahkan label di sini untuk sumbu kanan agar mudah dipahami
                        label={{ value: 'Total Rilis Produksi (Ton)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#54A24B' } }}
                        
                    />
                    
                    <Tooltip content={<CustomTooltip selectedYear={selectedYear} />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    
                    {/* Render Bar untuk setiap Unit Kerja (Disusun ke Samping - Grouped Bar) */}
                    {unitKeys.map((unit, index) => (
                        <Bar 
                            key={unit}
                            yAxisId="left"
                            dataKey={unit} // Nama Unit Kerja sebagai dataKey
                            fill={UNIT_COLORS[index % UNIT_COLORS.length]}
                            barSize={15}
                            name={unit} // Nama Unit Kerja sebagai nama legenda
                            // TIDAK ADA stackId agar Bar tidak bertumpuk (Grouped Bar)
                        />
                    ))}

                    {/* Line Chart untuk RKAP (Target) */}
                    <Line 
                        yAxisId="right" // Menggunakan sumbu KANAN untuk skala target yang berbeda
                        type="monotone" 
                        dataKey="RKAP" 
                        stroke="#FF9800" // Oranye/Emas
                        strokeDasharray="5 5" 
                        strokeWidth={3}
                        name="Target RKAP"
                        dot={{ r: 5, fill: '#FF9800', stroke: '#FFA000', strokeWidth: 2 }} // Titik Target
                        label={<CustomLineLabel name="RKAP" />}
                    />
                    
                     {/* Line Chart untuk TOTAL PRODUKSI per bulan */}
                    <Line 
                        yAxisId="right" // Menggunakan sumbu KANAN untuk skala yang berbeda
                        type="monotone" 
                        dataKey="TOTAL_PRODUKSI" 
                        stroke="#636363" // Abu-abu gelap kontras
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#636363', stroke: '#000', strokeWidth: 1 }} 
                        name="TOTAL BULANAN"
                        label={<CustomLineLabel name="TOTAL_PRODUKSI" />}
                    />

                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RilisProduksiChart;