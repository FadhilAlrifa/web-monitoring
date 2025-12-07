import React, { useMemo } from 'react';
import {
    ComposedChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    CartesianGrid, Line, LabelList
} from 'recharts';

// Warna yang konsisten untuk unit (dapat disesuaikan)
const UNIT_COLORS = [
    '#007bff', // Biru Cerah
    '#28a745', // Hijau
    '#ffc107', // Kuning
    '#dc3545', // Merah
    '#6f42c1', // Ungu
    '#17a2b8', // Cyan
    '#fd7e14', // Orange
    '#6c757d', // Abu-abu
];


const prepareRilisData = (data) => {
    // 1. Sort data berdasarkan bulan (1 hingga 12)
    const sortedData = (data || []).sort((a, b) => a.month - b.month);
    
    // 2. Tambahkan total agregat per bulan (untuk Line Chart RKAP/TOTAL)
    return sortedData.map(monthData => {
        let totalBulanan = 0;
        Object.keys(monthData).forEach(key => {
            if (key !== 'month' && key !== 'monthLabel' && key !== 'RKAP') {
                totalBulanan += parseFloat(monthData[key]) || 0;
            }
        });
        
        return {
            ...monthData,
            TOTAL_PRODUKSI: totalBulanan, // Total produksi per bulan (untuk Line Chart)
            RKAP: parseFloat(monthData.RKAP) || 0 // Pastikan RKAP tersedia
        };
    });
};

const RilisProduksiChart = ({ rilisData, selectedYear, groupName }) => {
    
    // Gunakan useMemo untuk memproses data hanya jika rilisData berubah
    const processedData = useMemo(() => prepareRilisData(rilisData), [rilisData]);

    // Ambil semua nama unit unik (kunci numerik dari data, contoh: 'P1 BKS', 'P2 BKS')
    // Asumsi: Kita ambil dari kunci di data[0], selain yang standar
    const firstData = processedData[0] || {};
    const unitKeys = Object.keys(firstData).filter(key => 
        !['month', 'monthLabel', 'TOTAL_PRODUKSI', 'RKAP'].includes(key)
    );

    if (!processedData || processedData.length === 0 || unitKeys.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg h-96 flex flex-col justify-center items-center">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Rilis Produksi {groupName} (Tahun {selectedYear})</h3>
                <p className="text-center text-gray-500 py-10">Tidak ada data rilis unit ditemukan untuk tahun {selectedYear}.</p>
            </div>
        );
    }
    
    // Custom Tooltip untuk menampilkan semua unit di bulan itu
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-300 shadow-md rounded-lg text-sm">
                    <p className="font-bold text-gray-800 mb-1">{label} {selectedYear}</p>
                    {payload
                        .filter(p => p.dataKey !== 'TOTAL_PRODUKSI')
                        .map((p, index) => (
                            <p key={`tooltip-${index}`} style={{ color: p.color }}>
                                {p.name}: <span className="font-semibold">{p.value?.toLocaleString()} Ton</span>
                            </p>
                        ))}
                    <p className="mt-2 pt-2 border-t border-gray-200 font-bold text-blue-700">
                        Total: {payload.find(p => p.dataKey === 'TOTAL_PRODUKSI')?.value?.toLocaleString() || 0} Ton
                    </p>
                </div>
            );
        }
        return null;
    };
    
    // Custom Label untuk Line Chart (Total Produksi)
    const CustomLineLabel = ({ x, y, value, name }) => {
        if (name === "TOTAL_PRODUKSI" || name === "RKAP") {
             return (
                <text x={x} y={y - 10} dy={-4} fill="#000" fontSize={12} textAnchor="middle" fontWeight="bold">
                    {value.toLocaleString()}
                </text>
            );
        }
        return null;
    };
    

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Rilis Produksi {groupName} (Tahun {selectedYear})</h3>
            
            <ResponsiveContainer width="100%" height={500}>
                <ComposedChart 
                    data={processedData}
                    margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
                > 
                    <CartesianGrid strokeDasharray="3 3" />
                    
                    {/* Sumbu X: Bulan */}
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
                    
                    {/* Sumbu Y Kanan: Total Rilis (Line) - Opsional, bisa pakai sumbu kiri */}
                    <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        stroke="#54A24B"
                        tickFormatter={(v) => v.toLocaleString()}
                        domain={[0, (dataMax) => Math.ceil(dataMax * 1.1 / 50000) * 50000]}
                        hide={true} // Sembunyikan sumbu kanan agar fokus pada sumbu kiri
                    />
                    
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    
                    {/* Render Bar untuk setiap Unit Kerja */}
                    {unitKeys.map((unit, index) => (
                        <Bar 
                            key={unit}
                            yAxisId="left"
                            dataKey={unit} // Nama Unit Kerja sebagai dataKey
                            fill={UNIT_COLORS[index % UNIT_COLORS.length]}
                            barSize={15}
                            name={unit} // Nama Unit Kerja sebagai nama legenda
                        />
                    ))}

                    {/* Line Chart untuk RKAP (Target) */}
                    <Line 
                        yAxisId="left" // Menggunakan sumbu kiri
                        type="monotone" 
                        dataKey="RKAP" 
                        stroke="#FF9800" // Oranye/Emas
                        strokeDasharray="5 5" 
                        strokeWidth={3}
                        name="Target RKAP"
                        dot={false}
                        label={<CustomLineLabel name="RKAP" />}
                    />
                    
                     {/* Line Chart untuk TOTAL PRODUKSI per bulan */}
                    <Line 
                        yAxisId="left" // Menggunakan sumbu kiri
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