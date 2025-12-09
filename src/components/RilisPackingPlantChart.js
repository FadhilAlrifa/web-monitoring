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

const monthNamesAbbr = [
    "JAN", "FEB", "MAR", "APR", "MEI", "JUN", 
    "JUL", "AGU", "SEP", "OKT", "NOV", "DES"
];

// Custom Tooltip Content
const CustomTooltip = ({ active, payload, label, selectedYear }) => {
    if (active && payload && payload.length) {
        // Find total line and target line
        const totalLine = payload.find(p => p.dataKey === 'TOTAL_PRODUKSI');
        const targetLine = payload.find(p => p.dataKey === 'RKAP');
        
        // Filter out non-month dataKeys and Total/RKAP lines
        const monthPayload = payload
            .filter(p => monthNamesAbbr.includes(p.dataKey))
            // TIDAK PERLU SORTING DI SINI karena sudah diurutkan JAN-DES
            .sort((a, b) => monthNamesAbbr.indexOf(a.dataKey) - monthNamesAbbr.indexOf(b.dataKey));
        
        return (
            <div className="bg-white p-3 border border-gray-300 shadow-md rounded-lg text-sm">
                <p className="font-bold text-gray-800 mb-1">Unit: {label} ({selectedYear})</p>
                {monthPayload.map((p, index) => (
                    <p key={`tooltip-bar-${index}`} style={{ color: p.color }}>
                        {p.name}: <span className="font-semibold">{p.value?.toLocaleString()} Ton</span>
                    </p>
                ))}
                
                {/* Total and Target Lines */}
                {(totalLine || targetLine) && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                        {totalLine && <p className="font-bold text-gray-700">Total YTD: {totalLine.value?.toLocaleString()} Ton</p>}
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


// --- FUNGSI PIVOTING DATA BARU (Membuat Unit jadi Sumbu X, Bulan jadi Bar) ---
const pivotRilisData = (data) => {
    // 1. Dapatkan semua nama unit unik (Unit Kerja)
    const unitNames = [...new Set(data.map(item => item.nama_unit))];

    const pivotedMap = new Map();

    // 2. Inisialisasi map dengan UnitName sebagai kunci
    unitNames.forEach(unit => {
        const entry = { unitName: unit, TOTAL_PRODUKSI: 0, RKAP: 0 };
        monthNamesAbbr.forEach(month => {
            entry[month] = 0; // Inisialisasi semua bulan ke 0
        });
        pivotedMap.set(unit, entry);
    });

    // 3. Isi data bulanan dan hitung total
    data.forEach(monthRow => {
        const unit = monthRow.nama_unit;
        const monthAbbr = monthNamesAbbr[monthRow.month - 1];
        const value = parseFloat(monthRow.total_muat_ton) || 0;
        const target = parseFloat(monthRow.target) || 0; // Ambil target dari baris data

        if (pivotedMap.has(unit)) {
            const unitEntry = pivotedMap.get(unit);
            
            unitEntry[monthAbbr] = value;
            unitEntry.TOTAL_PRODUKSI += value;

            // ASUMSI: Target RKAP sama setiap bulan. Kita hanya ambil target dari baris data pertama.
            if (unitEntry.RKAP === 0) {
                 unitEntry.RKAP = target; 
            }
        }
    });

    // 4. Konversi ke array dan sort berdasarkan total produksi
    const finalArray = Array.from(pivotedMap.values());
    finalArray.sort((a, b) => b.TOTAL_PRODUKSI - a.TOTAL_PRODUKSI); // Sort descending

    return finalArray;
};


const RilisPackingPlantChart = ({ rilisData, selectedYear, groupName }) => {
    
    // Gunakan useMemo untuk memproses data hanya jika rilisData berubah
    // Data yang masuk di sini adalah array per bulan, misal: [{month:1, nama_unit:'A', total_muat_ton: 100}, ...]
    const pivotedData = useMemo(() => pivotRilisData(rilisData), [rilisData]);

    // Kunci Bar sekarang adalah Bulan (JAN, FEB, MAR...)
    const monthlyKeys = monthNamesAbbr; // <--- Digunakan untuk me-render Bar

    // Kunci Sumbu X adalah Unit Name
    const unitKeys = pivotedData.map(d => d.unitName);

    if (!pivotedData || pivotedData.length === 0 || unitKeys.length === 0) {
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
                    data={pivotedData}
                    margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
                    barGap={2} 
                > 
                    <CartesianGrid strokeDasharray="3 3" />
                    
                    {/* Sumbu X: NAMA UNIT KERJA */}
                    <XAxis 
                        dataKey="unitName" // Sumbu X adalah Unit Name
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
                        // Dinamis domain dari data total bulanan
                        domain={[0, (dataMax) => Math.ceil(dataMax * 1.1 / 10000) * 10000]}
                    />
                    
                    {/* Sumbu Y Kanan: Total dan Target (Line) */}
                    <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        stroke="#54A24B"
                        tickFormatter={(v) => v.toLocaleString()}
                        // Domain lebih besar untuk Line Chart
                        domain={[0, (dataMax) => Math.ceil(dataMax * 1.1 / 50000) * 50000]} 
                        label={{ value: 'Total Rilis Produksi (Ton)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#54A24B' } }}
                    />
                    
                    <Tooltip content={<CustomTooltip selectedYear={selectedYear} />} />
                    
                    {/* LEGEND: BULAN (Berurut JAN - DES) */}
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    
                    {/* Render Bar untuk setiap BULAN (Grouped Bar) */}
                    {monthlyKeys.map((month, index) => (
                        <Bar 
                            key={month}
                            yAxisId="left"
                            dataKey={month} // Bulan sebagai dataKey
                            fill={UNIT_COLORS[index % UNIT_COLORS.length]}
                            barSize={15}
                            name={month} // Bulan sebagai nama legenda
                            // Hapus stackId agar Bar tidak bertumpuk (Grouped Bar)
                        />
                    ))}

                    {/* Line Chart untuk RKAP (Target) */}
                    <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="RKAP" 
                        stroke="#FF9800" 
                        strokeDasharray="5 5" 
                        strokeWidth={3}
                        name="Target RKAP"
                        dot={{ r: 5, fill: '#FF9800', stroke: '#FFA000', strokeWidth: 2 }} // Titik Target
                        label={<CustomLineLabel name="RKAP" />}
                    />
                    
                     {/* Line Chart untuk TOTAL PRODUKSI Tahunan per Unit */}
                    <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="TOTAL_PRODUKSI" 
                        stroke="#636363" 
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#636363', stroke: '#000', strokeWidth: 1 }} 
                        name="TOTAL YTD"
                        label={<CustomLineLabel name="TOTAL_PRODUKSI" />}
                    />

                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RilisPackingPlantChart;