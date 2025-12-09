// src/components/RilisPackingPlantChart.js (FINAL FIXED LEGEND ORDER)

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

// Label untuk Line TOTAL
const CustomLineLabel = ({ x, y, value }) => {
    if (value && value > 0) {
        return (
            <text 
                x={x} 
                y={y - 10} 
                dy={-4} 
                fill="#000" 
                fontSize={12} 
                textAnchor="middle" 
                fontWeight="bold"
            >
                {value.toLocaleString()}
            </text>
        );
    }
    return null;
};

// Pivoting data
const pivotRilisData = (data) => {
    const unitNames = [...new Set(data.flatMap(item => 
        Object.keys(item).filter(key => key !== 'month' && key !== 'monthLabel')
    ))];

    const pivotedMap = new Map();

    unitNames.forEach(unit => {
        pivotedMap.set(unit, { 
            unitName: unit, 
            TOTAL_PRODUKSI: 0 
        });
        monthNamesAbbr.forEach(month => {
            pivotedMap.get(unit)[month] = 0;
        });
    });

    data.forEach(monthRow => {
        const monthAbbr = monthNamesAbbr[monthRow.month - 1];

        Object.keys(monthRow).forEach(key => {
            if (pivotedMap.has(key)) {
                const value = parseFloat(monthRow[key]) || 0;
                const unitEntry = pivotedMap.get(key);

                unitEntry[monthAbbr] = value;
                unitEntry.TOTAL_PRODUKSI += value;
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
        return null;
    }

    const monthlyKeys = monthNamesAbbr;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">
                Rilis Produksi Per Unit & Bulan (Tahun {selectedYear})
            </h3>
            
            <ResponsiveContainer width="100%" height={500}>
                <ComposedChart
                    data={pivotedData}
                    margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />

                    <XAxis
                        dataKey="unitName"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                        style={{ fontSize: '12px' }}
                    />

                    <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#8884d8"
                        label={{ value: 'Rilis Produksi (Ton)', angle: -90, position: 'insideLeft' }}
                        tickFormatter={(v) => v.toLocaleString()}
                        domain={[0, (dataMax) => Math.ceil(dataMax * 1.1 / 10000) * 10000]}
                    />

                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#82ca9d"
                        label={{ value: 'Total Rilis Produksi (Ton)', angle: 90, position: 'insideRight' }}
                        tickFormatter={(v) => v.toLocaleString()}
                        domain={[0, (dataMax) => Math.ceil(dataMax * 1.1 / 50000) * 50000]}
                    />

                    <Tooltip />

                    {/* LEGEND CUSTOM – FIXED ORDER */}
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        payload={[
                            ...monthNamesAbbr.map((month) => ({
                                id: month,
                                type: "square",
                                value: month,
                                color: monthColors[month] || monthColors.DEFAULT
                            })),
                            {
                                id: "TOTAL",
                                type: "line",
                                value: "TOTAL",
                                color: "#9D755D"
                            }
                        ]}
                    />

                    {/* Bar Bulanan */}
                    {monthlyKeys.map((month) => (
                        <Bar
                            key={month}
                            yAxisId="left"
                            dataKey={month}
                            fill={monthColors[month] || monthColors.DEFAULT}
                            legendType="none"  // Disable legend bawaan
                        />
                    ))}

                    {/* Line TOTAL PRODUKSI */}
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="TOTAL_PRODUKSI"
                        stroke="#9D755D"
                        strokeWidth={3}
                        legendType="none"   // Disable legend bawaan
                        dot={{ r: 6, fill: '#FFD700', stroke: '#9D755D', strokeWidth: 2 }}
                        label={<CustomLineLabel />}
                    />

                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RilisPackingPlantChart;
