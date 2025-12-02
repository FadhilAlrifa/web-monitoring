// src/components/PenjumboanMonthlyChart.js

import React from 'react';
import {
    ComposedChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    CartesianGrid, Line
} from 'recharts';

const PenjumboanMonthlyChart = ({ monthlyReport }) => {

    if (!monthlyReport || monthlyReport.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Produksi Bulanan Penjumboan</h3>
                <p className="text-center text-gray-500 py-10">Tidak ada data bulanan Penjumboan yang ditemukan.</p>
            </div>
        );
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

    const formattedData = monthlyReport.map(item => ({
        ...item,
        monthLabel: monthNames[item.month - 1], 
        total_produksi_ton: parseFloat(item.total_produksi_ton) || 0,
        total_target_bulanan: parseFloat(item.total_target_bulanan) || 0
    }));

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Produksi Bulanan Penjumboan (Total vs RKAP)</h3>
            
            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthLabel" style={{ fontSize: '10px' }} />
                    
                    {/* Y-Axis Kiri: Total Produksi (Batang) */}
                    <YAxis yAxisId="left" orientation="left" stroke="#38A169" tickFormatter={(v) => v.toLocaleString()} />
                    
                    {/* Y-Axis Kanan: Target RKAP (Garis) */}
                    <YAxis yAxisId="right" orientation="right" stroke="#FF9800" />
                    
                    <Tooltip formatter={(value, name) => [parseFloat(value).toLocaleString(undefined, { maximumFractionDigits: 0 }), name]} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    
                    {/* BAR CHART: Total Produksi */}
                    <Bar yAxisId="left" dataKey="total_produksi_ton" fill="#38A169" name="Total Produksi" />

                    {/* LINE CHART: Target RKAP */}
                    <Line yAxisId="right" type="monotone" dataKey="total_target_bulanan" stroke="#FF9800" name="Target (RKAP)" strokeWidth={2} dot={{ r: 4 }} />

                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PenjumboanMonthlyChart;