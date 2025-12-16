import React, { useMemo } from 'react';
import {
    ComposedChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    CartesianGrid, Line
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

const CustomLineLabel = ({ x, y, value }) => {
    if (value && value > 0) {
        return (
            <text x={x} y={y - 10} fill="#ef4444" fontSize={11} textAnchor="middle" fontWeight="bold">
                {value.toLocaleString('id-ID')}
            </text>
        );
    }
    return null;
};

const pivotRilisData = (data) => {
    if (!data || data.length === 0) return [];

    // 1. Identifikasi semua nama unit unik (kecuali key sistem)
    const unitNames = [...new Set(data.flatMap(item => 
        Object.keys(item).filter(key => !['month', 'monthLabel', 'target_rkp_bulanan'].includes(key))
    ))];

    const pivotedMap = new Map();

    unitNames.forEach(unit => {
        pivotedMap.set(unit, { 
            unitName: unit, 
            TOTAL_PRODUKSI: 0,
            TARGET_RKAP: 0 // Inisialisasi target
        });
        monthNamesAbbr.forEach(month => {
            pivotedMap.get(unit)[month] = 0;
        });
    });

    // 2. Isi data bulanan dan akumulasi target
    data.forEach(monthRow => {
        const monthAbbr = monthNamesAbbr[monthRow.month - 1];
        // Ambil target bulanan dari row (asumsi target_rkp_bulanan dikirim dari server)
        const rowTarget = parseFloat(monthRow.target_rkp_bulanan) || 0;
        
        Object.keys(monthRow).forEach(key => {
            if (pivotedMap.has(key)) {
                const value = parseFloat(monthRow[key]) || 0;
                const unitEntry = pivotedMap.get(key);
                
                unitEntry[monthAbbr] = value;
                unitEntry.TOTAL_PRODUKSI += value;
                // Kita ambil target rkap bulanan (menggunakan target terbaru yang tersedia)
                unitEntry.TARGET_RKAP = rowTarget; 
            }
        });
    });

    const finalArray = Array.from(pivotedMap.values());
    finalArray.sort((a, b) => b.TOTAL_PRODUKSI - a.TOTAL_PRODUKSI); 

    return finalArray;
};

const RilisPackingPlantChart = ({ rilisData, selectedYear }) => {
    
    const pivotedData = useMemo(() => pivotRilisData(rilisData), [rilisData]);

    if (!pivotedData || pivotedData.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg h-64 flex items-center justify-center">
                <p className="text-gray-500 italic">Data rilis packing plant tidak tersedia.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                    📊 Rilis Produksi & Target RKAP per Unit ({selectedYear})
                </h3>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs text-gray-600 font-medium">Realisasi</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-b-2 border-dashed border-red-500"></div>
                        <span className="text-xs text-gray-600 font-medium">Target RKAP</span>
                    </div>
                </div>
            </div>
            
            <ResponsiveContainer width="100%" height={500}>
                <ComposedChart 
                    data={pivotedData} 
                    margin={{ top: 30, right: 30, left: 20, bottom: 60 }}
                > 
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    
                    <XAxis 
                        dataKey="unitName" 
                        angle={-45} 
                        textAnchor="end" 
                        interval={0} 
                        style={{ fontSize: '11px', fontWeight: '600' }}
                        stroke="#64748b"
                    />
                    
                    <YAxis 
                        yAxisId="left" 
                        stroke="#64748b"
                        style={{ fontSize: '11px' }}
                        tickFormatter={(v) => v.toLocaleString('id-ID')}
                        label={{ value: 'Tonase (Ton)', angle: -90, position: 'insideLeft', offset: -10 }}
                    />
                    
                    <Tooltip 
                        formatter={(value) => value.toLocaleString('id-ID') + " Ton"}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    /> 
                    
                    <Legend 
                        verticalAlign="top" 
                        align="right" 
                        wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }} 
                    />
                    
                    {/* Bar per bulan (Stacked) */}
                    {monthNamesAbbr.map((month) => (
                        <Bar 
                            key={month}
                            yAxisId="left"
                            dataKey={month} 
                            stackId="a"
                            fill={monthColors[month] || monthColors.DEFAULT}
                            name={month}
                        />
                    ))}

                    {/* Garis Target RKAP Dinamis */}
                    <Line 
                        yAxisId="left"
                        name="TARGET RKAP"
                        type="stepAfter" 
                        dataKey="TARGET_RKAP"
                        stroke="#ef4444" 
                        strokeWidth={3}
                        strokeDasharray="8 5"
                        dot={{ r: 5, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                        label={<CustomLineLabel />}
                    />

                </ComposedChart>
            </ResponsiveContainer>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-[10px] text-gray-400 italic">
                    * Grafik menampilkan akumulasi realisasi bulanan (Stacked Bar) dibandingkan dengan nilai target RKAP bulanan (Dashed Line).
                </p>
            </div>
        </div>
    );
};

export default React.memo(RilisPackingPlantChart);