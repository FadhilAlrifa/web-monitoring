import React from 'react';
import {
    ComposedChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    CartesianGrid, LabelList
} from 'recharts';

/**
 * Komponen Diagram Bulanan (ComposedChart: Line untuk Produksi dan Target).
 * Menerima array data bulanan ({year, month, total_produksi_ton, target_bulanan}) sebagai prop.
 */
const MonthlyChart = ({ monthlyReport, groupName }) => {

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
                        "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

    const dataToProcess = monthlyReport || []; 

    const formattedData = dataToProcess.map(item => ({
        ...item,
        // Buat label Bulan (Jan, Feb, dst.)
        monthLabel: monthNames[item.month - 1], 
        // Pastikan nilai adalah float
        total_produksi_ton: parseFloat(item.total_produksi_ton) || 0,
        // ASUMSI: Ada properti 'target_bulanan' dari backend
        target_bulanan: parseFloat(item.target_bulanan) || 0 // Default ke 0 jika tidak ada
    }));

    // Cek apakah array yang sudah diformat kosong atau hanya berisi 0
    if (formattedData.length === 0 || formattedData.every(item => item.total_produksi_ton === 0 && item.target_bulanan === 0)) { 
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col justify-center items-center">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Produksi Bulanan {groupName}</h3>
                <p className="text-center text-gray-500 py-10">Tidak ada data bulanan yang ditemukan untuk unit ini.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg h-full">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Produksi Bulanan Packer Pabrik & Pelabuhan (MTD)</h3>
            
            <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    
                    {/* Sumbu X: Nama Bulan */}
                    <XAxis 
                        dataKey="monthLabel" 
                        padding={{ left: 30, right: 30 }}
                        style={{ fontSize: '12px' }}
                    />
                    
                    {/* Sumbu Y Kiri: Untuk Produksi Bulanan */}
                    <YAxis 
                        yAxisId="left" 
                        orientation="left" 
                        stroke="#8884d8" // Warna untuk Produksi
                        domain={[0, 30000]}
                        tickFormatter={(value) => value.toLocaleString()} // Format angka ribuan
                        label={{ value: 'Produksi', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                    />
                    
                    {/* Sumbu Y Kanan: Untuk Target Bulanan */}
                    <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        stroke="#FF9800" // Warna untuk Target
                        domain={[0, 30000]}
                        tickFormatter={(value) => value.toLocaleString()} // Format angka ribuan
                        label={{ value: 'Target', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
                    />
                    
                    {/* Tooltip */}
                    <Tooltip 
                        formatter={(value, name) => [parseFloat(value).toLocaleString(undefined, { maximumFractionDigits: 0 }), name]} 
                    />
                    
                    {/* Legend (jika ingin ditampilkan) */}
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    
                    {/* LINE CHART: Produksi Bulanan */}
                    <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="total_produksi_ton" 
                        stroke="#D3D3D3" // Biru Cerah seperti di gambar
                        strokeWidth={2}
                        name="Produksi" 
                        activeDot={{ r: 8 }}
                        dot={{ r: 6, fill: '#007bff', stroke: '#0056b3', strokeWidth: 2 }} // Titik produksi
                    >
                        {/* Label nilai di atas titik produksi */}
                        <LabelList 
                            dataKey="total_produksi_ton" 
                            position="top" 
                            formatter={(value) => parseFloat(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            style={{ fontSize: '12px', fill: '#333' }}
                        />
                    </Line>
                    
                    {/* LINE CHART: Target Bulanan */}
                    <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="target_bulanan" 
                        stroke="#FF9800" // Oranye/Emas untuk Target
                        strokeDasharray="5 5" // Garis putus-putus
                        strokeWidth={2}
                        name="Target"
                        activeDot={{ r: 8 }}
                        dot={{ r: 5, fill: '#FF9800', stroke: '#FFA000', strokeWidth: 2 }} // Titik target
                    >
                        {/* Label nilai di atas titik target */}
                        <LabelList 
                            dataKey="target_bulanan" 
                            position="top" 
                            formatter={(value) => parseFloat(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            style={{ fontSize: '12px', fill: '#333' }}
                        />
                    </Line>

                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MonthlyChart;