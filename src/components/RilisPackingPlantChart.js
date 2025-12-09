import React, { useMemo } from 'react';
import {
    ComposedChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    CartesianGrid, Line
} from 'recharts';

// Warna konsisten per bulan
const MONTH_COLORS = {
    JAN: '#4C78A8', FEB: '#F58518', MAR: '#E45756', APR: '#72B7B2',
    MEI: '#54A24B', JUN: '#EECA3B', JUL: '#B279A2', AGU: '#FF9DA7',
    SEP: '#9D755D', OKT: '#BAB0AC', NOV: '#1F77B4', DES: '#AEC7E8',
    DEFAULT: '#636363'
};

const monthNamesAbbr = [
    "JAN", "FEB", "MAR", "APR", "MEI", "JUN",
    "JUL", "AGU", "SEP", "OKT", "NOV", "DES"
];

// Custom Tooltip
const CustomTooltip = ({ active, payload, label, selectedYear }) => {
    if (active && payload && payload.length) {
        const totalLine = payload.find(p => p.dataKey === 'TOTAL_PRODUKSI');
        const targetLine = payload.find(p => p.dataKey === 'RKAP');

        const monthPayload = payload
            .filter(p => monthNamesAbbr.includes(p.dataKey))
            .sort((a, b) => monthNamesAbbr.indexOf(a.dataKey) - monthNamesAbbr.indexOf(b.dataKey));

        return (
            <div className="bg-white p-3 border border-gray-300 shadow-md rounded-lg text-sm">
                <p className="font-bold text-gray-800 mb-1">Unit: {label} ({selectedYear})</p>

                {monthPayload.map((p, index) => (
                    <p key={index} style={{ color: p.color }}>
                        {p.name}: <span className="font-semibold">{p.value?.toLocaleString()} Ton</span>
                    </p>
                ))}

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

// Label untuk Line
const CustomLineLabel = ({ x, y, value }) => {
    if (!value) return null;
    return (
        <text x={x} y={y - 10} fill="#000" fontSize={12} textAnchor="middle" fontWeight="bold">
            {value.toLocaleString()}
        </text>
    );
};

// Pivot data
const pivotRilisData = (data) => {
    const unitNames = [...new Set(data.map(item => item.nama_unit))];
    const pivotedMap = new Map();

    unitNames.forEach(unit => {
        const entry = { unitName: unit, TOTAL_PRODUKSI: 0, RKAP: 0 };
        monthNamesAbbr.forEach(month => (entry[month] = 0));
        pivotedMap.set(unit, entry);
    });

    data.forEach(row => {
        const unit = row.nama_unit;
        const monthAbbr = monthNamesAbbr[row.month - 1];
        const val = parseFloat(row.total_muat_ton) || 0;
        const target = parseFloat(row.target) || 0;

        if (pivotedMap.has(unit)) {
            const u = pivotedMap.get(unit);
            u[monthAbbr] = val;
            u.TOTAL_PRODUKSI += val;
            if (u.RKAP === 0) u.RKAP = target;
        }
    });

    return Array.from(pivotedMap.values()).sort(
        (a, b) => b.TOTAL_PRODUKSI - a.TOTAL_PRODUKSI
    );
};

const RilisPackingPlantChart = ({ rilisData, selectedYear, groupName }) => {
    const pivotedData = useMemo(() => pivotRilisData(rilisData), [rilisData]);
    const monthlyKeys = monthNamesAbbr;

    if (!pivotedData || pivotedData.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg h-96 flex flex-col justify-center items-center">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">
                    Rilis Produksi {groupName} (Tahun {selectedYear})
                </h3>
                <p className="text-center text-gray-500 py-10">
                    Tidak ada data rilis unit ditemukan untuk tahun {selectedYear}.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">
                Rilis Produksi {groupName} (Tahun {selectedYear})
            </h3>

            <ResponsiveContainer width="100%" height={500}>
                <ComposedChart
                    data={pivotedData}
                    margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
                    barGap={2}
                >
                    <CartesianGrid strokeDasharray="3 3" />

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
                        tickFormatter={(v) => v.toLocaleString()}
                        domain={[0, (max) => Math.ceil(max * 1.1)]}
                        label={{ value: 'Rilis Produksi (Ton)', angle: -90, position: 'insideLeft' }}
                    />

                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#54A24B"
                        tickFormatter={(v) => v.toLocaleString()}
                        domain={[0, (max) => Math.ceil(max * 1.1)]}
                        label={{ value: 'Total Rilis Produksi (Ton)', angle: 90, position: 'insideRight' }}
                    />

                    <Tooltip
                        content={({ active, payload, label }) => (
                            <CustomTooltip active={active} payload={payload} label={label} selectedYear={selectedYear} />
                        )}
                    />

                    {/* Legend default (DATA MUNCUL SAFELY) */}
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />

                    {/* === Bar Bulanan dengan order JAN → DES === */}
                    {monthlyKeys.map((month, index) => (
                        <Bar
                            key={month}
                            yAxisId="left"
                            dataKey={month}
                            fill={MONTH_COLORS[month] || MONTH_COLORS.DEFAULT}
                            barSize={15}
                            name={month}
                            order={index}   
                        />
                    ))}

                    {/* Line RKAP */}
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="RKAP"
                        stroke="#FF9800"
                        strokeDasharray="5 5"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#FF9800' }}
                        label={<CustomLineLabel />}
                        name="Target RKAP"
                    />

                    {/* Line Total Produksi */}
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="TOTAL_PRODUKSI"
                        stroke="#636363"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#636363' }}
                        label={<CustomLineLabel />}
                        name="TOTAL YTD"
                    />

                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RilisPackingPlantChart;
