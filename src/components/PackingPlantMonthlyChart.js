// src/components/PackingPlantMonthlyChart.js

import React from 'react';
import {
    ComposedChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    CartesianGrid, Line
} from 'recharts';

const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

const PackingPlantMonthlyChart = ({ monthlyReport }) => {

    if (!monthlyReport || monthlyReport.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg h-96">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Produksi Bulanan Packing Plant</h3>
                <p className="text-center text-gray-500 py-10">Tidak ada laporan bulanan yang tersimpan.</p>
            </div>
        );
    }

    // FIX: Sorting + Generate Label Bulan
    const sortedData = [...monthlyReport]
        .sort((a, b) => a.month - b.month)
        .map(item => ({
            ...item,
            monthLabel: monthNames[item.month - 1] || "?"
        }));

    // Hitung domain Y-Axis
    const maxProduction = Math.max(...sortedData.map(i => i.total_produksi || 0));
    const maxTarget = Math.max(...sortedData.map(i => i.target_rkp_bulanan || 0));
    const maxDomain = Math.ceil(Math.max(maxProduction, maxTarget) * 1.1 / 5000) * 5000;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Produksi Bulanan Packing Plant</h3>

            <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />

                    {/* X Axis */}
                    <XAxis 
                        dataKey="monthLabel"
                        style={{ fontSize: "12px" }}
                    />

                    {/* Y Axis */}
                    <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#000"
                        tickFormatter={(v) => v.toLocaleString()}
                        domain={[0, maxDomain]}
                        label={{ value: 'Produksi (Ton)', angle: -90, position: 'insideLeft' }}
                    />

                    <Tooltip 
                        formatter={(val) => val?.toLocaleString()}
                    />
                    <Legend />

                    {/* BAR → Produksi */}
                    <Bar 
                        yAxisId="left"
                        dataKey="total_produksi"
                        name="Produksi"
                        fill="#00BFFF"
                    />

                    {/* LINE → RKAP */}
                    <Line
                        yAxisId="left"
                        dataKey="target_rkp_bulanan"
                        name="RKAP"
                        type="monotone"
                        stroke="#FF8C00"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 4, fill: "#fff", stroke: "#FF8C00", strokeWidth: 2 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PackingPlantMonthlyChart;
