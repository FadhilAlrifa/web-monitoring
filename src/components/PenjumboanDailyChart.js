// src/components/PenjumboanDailyChart.js

import React from 'react';
import {
    ComposedChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    CartesianGrid, Line, LabelList
} from 'recharts';

const PenjumboanDailyChart = ({ dailyReport }) => {

    if (!dailyReport || dailyReport.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Produksi Harian Polysling (Per Shift)</h3>
                <p className="text-center text-gray-500 py-10">Tidak ada data harian Penjumboan yang ditemukan.</p>
            </div>
        );
    }
    
    // ==========================================================
    // 1. KODE PERBAIKAN TIMEZONE DAN PLOTTING NUMERIK (Kritis)
    // ==========================================================
    const processedReport = dailyReport.map(item => {
        // Tambahkan offset 12 jam (43,200,000 ms) ke waktu UTC untuk mengoreksi Timezone Shift.
        const dateObject = new Date(item.tanggal);
        const correctedDateMs = dateObject.getTime() + (12 * 60 * 60 * 1000);
        const correctedDate = new Date(correctedDateMs);

        // Ambil nomor hari dari TANGGAL YANG SUDAH DIKOREKSI
        const dayNumber = correctedDate.getDate(); 
        
        return {
            ...item,
            day_number: dayNumber, // Kunci plotting numerik BARU
            date_object: correctedDate // Objek date yang sudah dikoreksi untuk sorting
        };
    });

    // 2. MEMAKSA PENGURUTAN ARRAY BERDASARKAN TANGGAL
    const sortedReport = processedReport.sort((a, b) => a.date_object - b.date_object);


    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Produksi Harian Polysling (Per Shift)</h3>
            
            <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={sortedReport} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    
                    {/* Sumbu X: Menggunakan KUNCI day_number NUMERIK */}
                    <XAxis 
                        dataKey="day_number" // <-- MENGGUNAKAN KUNCI NUMERIK
                        type="number" 
                        domain={[0, 31]} // Padding di kedua ujung
                        tickCount={0} // Agar tidak terlalu menumpuk
                        labelFormatter={(label) => `Hari ke-${label}`}
                        style={{ fontSize: '10px' }} 
                    />
                    
                    {/* Y-Axis Kiri (left): Untuk Shift (Tonase) */}
                    <YAxis 
                        yAxisId="left" 
                        orientation="left" 
                        stroke="#000000" 
                        label={{ value: 'Produksi Shift (Ton)', angle: -90, position: 'insideLeft' }}
                        domain={[0, (dataMax) => Math.ceil(dataMax / 100) * 100 + 100]} 
                    />
                    
                    {/* Y-Axis Kanan (right): Untuk Total dan Target */}
                    <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        stroke="#000000" 
                        domain={[0, (dataMax) => Math.ceil(dataMax / 100) * 100 + 1000]} 
                        label={{ value: 'Total / Target', angle: 90, position: 'insideRight' }}
                    />
                    
                    <Tooltip 
                        formatter={(value, name) => [parseFloat(value).toFixed(0), name]} 
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    
                    {/* BAR CHART BERDAMPINGAN (Grouped) */}
                    <Bar yAxisId="left" dataKey="shift_1_ton" fill="#F4A460" name="Shift 1" barSize={10} />
                    <Bar yAxisId="left" dataKey="shift_2_ton" fill="#00BFFF" name="Shift 2" barSize={10} />
                    <Bar yAxisId="left" dataKey="shift_3_ton" fill="#ADFF2F" name="Shift 3" barSize={10} />

                    {/* LINE CHART: Target (Garis Putus-Putus) */}
                    <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="target" 
                        stroke="#FF9800" 
                        name="Target" 
                        strokeWidth={2} 
                        strokeDasharray="5 5"
                        dot={{ r: 4, fill: '#FFFFFF', stroke: '#FF9800', strokeWidth: 2 }}
                    />

                    {/* LINE CHART: Total Produksi */}
                    <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="total_produksi" // <-- Kunci ini sudah ada dari backend
                        stroke="#00008B" 
                        name="Total" 
                        strokeWidth={2} 
                        dot={{ r: 4, fill: '#FFFFFF', stroke: '#00008B', strokeWidth: 2 }} 
                    >
                        <LabelList 
                            dataKey="total_produksi" 
                            position="top" 
                            formatter={(value) => parseFloat(value).toFixed(0)}
                            style={{ fontSize: '10px', fill: '#333' }}
                        />
                    </Line>
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PenjumboanDailyChart;