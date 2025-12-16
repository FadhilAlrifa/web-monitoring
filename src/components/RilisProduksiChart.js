import React, { useMemo } from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    CartesianGrid, LabelList
} from 'recharts';

const UNIT_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#64748b'
];

const CustomTooltip = ({ active, payload, label, selectedYear }) => {
    if (active && payload && payload.length) {
        const targetLine = payload.find(p => p.dataKey === 'targetRKAP');
        const totalLine = payload.find(p => p.dataKey === 'TOTAL_PRODUKSI');
        
        return (
            <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-xl text-sm">
                <p className="font-bold text-gray-800 mb-2 border-b pb-1">{label} {selectedYear}</p>
                {payload
                    .filter(p => !['targetRKAP', 'TOTAL_PRODUKSI'].includes(p.dataKey) && p.type === 'bar') 
                    .sort((a, b) => b.value - a.value)
                    .map((p, index) => (
                        <div key={`tooltip-bar-${index}`} className="flex justify-between gap-4 my-1">
                            <span style={{ color: p.color }} className="font-medium">{p.name}:</span>
                            <span className="font-bold text-gray-700">{p.value?.toLocaleString('id-ID')} Ton</span>
                        </div>
                    ))}
                
                <div className="mt-2 pt-2 border-t-2 border-dashed border-gray-100 space-y-1">
                    {totalLine && (
                        <div className="flex justify-between font-bold text-gray-800">
                            <span>Total Aktual:</span>
                            <span>{totalLine.value?.toLocaleString('id-ID')} Ton</span>
                        </div>
                    )}
                    {targetLine && (
                        <div className="flex justify-between font-bold text-red-600">
                            <span>Target RKAP:</span>
                            <span>{targetLine.value?.toLocaleString('id-ID')} Ton</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

const RilisProduksiChart = ({ rilisData, selectedYear, groupName }) => {
    
    // 1. Preparasi Data: Tambahkan Total Produksi dan Sinkronkan Target
    const processedData = useMemo(() => {
        if (!rilisData || rilisData.length === 0) return [];
        
        return rilisData.map(monthData => {
            let totalBulanan = 0;
            // Identifikasi unit kerja (exclude keys sistem)
            Object.keys(monthData).forEach(key => {
                if (!['month', 'monthLabel', 'target', 'target_bulanan', 'TOTAL_PRODUKSI'].includes(key)) {
                    totalBulanan += parseFloat(monthData[key]) || 0;
                }
            });
            
            return {
                ...monthData,
                TOTAL_PRODUKSI: totalBulanan,
                // Pastikan target mengambil data dari API (field 'target' dari server.js)
                targetRKAP: parseFloat(monthData.target) || 0 
            };
        });
    }, [rilisData]);

    // 2. Ambil Kunci Unit Kerja secara dinamis
    const unitKeys = useMemo(() => {
        if (processedData.length === 0) return [];
        const keys = new Set();
        processedData.forEach(item => {
            Object.keys(item).forEach(key => {
                if (!['month', 'monthLabel', 'TOTAL_PRODUKSI', 'target', 'target_bulanan', 'targetRKAP'].includes(key)) {
                    keys.add(key);
                }
            });
        });
        return Array.from(keys);
    }, [processedData]);

    if (processedData.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-lg h-96 flex items-center justify-center border border-gray-100">
                <p className="text-gray-400 italic">Data rilis produksi {groupName} tidak ditemukan.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 uppercase tracking-tight">
                    📊 Rilis Produksi & Target {groupName} ({selectedYear})
                </h3>
            </div>
            
            <ResponsiveContainer width="100%" height={500}>
                <ComposedChart data={processedData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}> 
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    
                    <XAxis 
                        dataKey="monthLabel" 
                        axisLine={false}
                        tickLine={false}
                        style={{ fontSize: '12px', fontWeight: '600', fill: '#64748b' }}
                    />
                    
                    <YAxis 
                        axisLine={false}
                        tickLine={false}
                        style={{ fontSize: '11px', fill: '#94a3b8' }}
                        tickFormatter={(v) => v.toLocaleString('id-ID')}
                    />
                    
                    <Tooltip content={<CustomTooltip selectedYear={selectedYear} />} />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '30px', fontSize: '12px' }} />
                    
                    {/* Render Bar per Unit Kerja (Stacked) */}
                    {unitKeys.map((unit, index) => (
                        <Bar 
                            key={unit}
                            dataKey={unit} 
                            stackId="production"
                            fill={UNIT_COLORS[index % UNIT_COLORS.length]}
                            name={unit}
                            barSize={40}
                        />
                    ))}

                    {/* Garis Target RKAP Dinamis dari Backend */}
                    <Line 
                        name="Target RKAP Grup"
                        type="monotone" 
                        dataKey="targetRKAP"
                        stroke="#ef4444" 
                        strokeWidth={3}
                        strokeDasharray="8 4"
                        dot={{ r: 5, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                    >
                        <LabelList 
                            dataKey="targetRKAP" 
                            position="top" 
                            style={{ fill: '#ef4444', fontSize: '10px', fontWeight: 'bold' }}
                            formatter={(v) => v > 0 ? v.toLocaleString('id-ID') : ''}
                        />
                    </Line>

                    {/* Garis Total Produksi Aktual */}
                    <Line 
                        name="Total Aktual"
                        type="monotone" 
                        dataKey="TOTAL_PRODUKSI" 
                        stroke="#334155" 
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#334155' }}
                    />

                </ComposedChart>
            </ResponsiveContainer>
            
            <div className="mt-6 flex flex-wrap gap-6 justify-center border-t pt-6">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-3 border-b-2 border-dashed border-red-500"></div>
                    <span className="text-xs font-bold text-gray-600">TARGET RKAP</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-3 bg-blue-500 rounded-sm"></div>
                    <span className="text-xs font-bold text-gray-600">REALISASI PER UNIT</span>
                </div>
            </div>
        </div>
    );
};

export default React.memo(RilisProduksiChart);