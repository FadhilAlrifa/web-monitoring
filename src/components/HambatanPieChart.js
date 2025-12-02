// src/components/HambatanPieChart.js

import React from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Warna yang konsisten untuk kategori hambatan
const COLORS = [
    '#FF4500', // Proses 
    '#FFD700', // Listrik 
    '#1E90FF', // Mekanik 
    '#32CD32', // Operator 
    '#87CEFA', // Hujan 
    '#8B0000', // Kapal 
    '#800080'  // PMC 
];

const HambatanPieChart = ({ hambatanSummary, title = "Ringkasan Total Hambatan Bulanan" }) => {
    
    const rawData = hambatanSummary || {}; 
    
    const hambatanChartData = Object.entries(rawData).map(([name, value]) => ({
        name: name.toUpperCase().replace('H_', ''), 
        value: parseFloat(value) || 0
    })).filter(item => item.value > 0); 

    const totalHambatanBulanan = hambatanChartData.reduce((sum, item) => sum + item.value, 0);

    if (hambatanChartData.length === 0 || totalHambatanBulanan === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col justify-center items-center">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">{title}</h3>
                <p className="text-center text-gray-500 py-10">Tidak ada data hambatan yang ditemukan.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg h-full">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">{title}</h3>
            
            <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                    <Pie 
                        data={hambatanChartData} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={100} 
                        fill="#8884d8"
                        labelLine={false}
                        label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                    >
                        {hambatanChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value, name) => [`${parseFloat(value).toFixed(2)} Jam`, name]}
                    />
                    
                    {/* PERUBAHAN KRITIS: Mengatur Legend di Bawah Tengah */}
                    <Legend 
                        layout="horizontal" 
                        align="center" 
                        verticalAlign="bottom" 
                        wrapperStyle={{ paddingTop: '10px' }} 
                        iconType="circle"
                    />
                </PieChart>
            </ResponsiveContainer>
            <p className="mt-4 text-sm text-gray-600 text-center">
                Total Hambatan: 
                <span className="font-bold text-red-600 ml-1">
                    {totalHambatanBulanan.toFixed(2)} Jam
                </span>
            </p>
        </div>
    );
};

export default HambatanPieChart;