// src/components/PemuatanDailyChart.js

import React from 'react';
import {
    ComposedChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    CartesianGrid, Line, LabelList
} from 'recharts';

const PemuatanDailyChart = ({ dailyReport }) => {

    if (!dailyReport || dailyReport.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Produksi Harian Pemuatan</h3>
                <p className="text-center text-gray-500 py-10">Tidak ada data harian Pemuatan yang ditemukan.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Produksi Harian Pemuatan</h3>

            <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={dailyReport} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>

                    <CartesianGrid strokeDasharray="3 3" />

                    {/* === Sumbu X (Hari) === */}
                    <XAxis
                        dataKey="tanggal"
                        tickFormatter={(value) => new Date(value).getDate()} // hanya angka tanggal
                        style={{ fontSize: '10px' }}
                    />

                    {/* === Y Kiri = Bar (Ton Muat) === */}
                    <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#000"
                        label={{ value: 'Ton Muat (Ton)', angle: -90, position: 'insideLeft' }}
                        tickFormatter={(v) => v.toLocaleString()}
                        domain={[0, (max) => Math.ceil(max / 100) * 100 + 500]}
                    />

                    {/* === Y Kanan = Garis Kumulatif & Target === */}
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#000"
                        label={{ value: 'Kumulatif / Target', angle: 90, position: 'insideRight' }}
                        domain={[0, (max) => Math.ceil(max / 1000) * 1000 + 5000]}
                        tickFormatter={(v) => v.toLocaleString()}
                    />

                    <Tooltip
                        formatter={(value, name) => [parseFloat(value).toLocaleString(), name]}
                        labelFormatter={(label) => `Tanggal: ${new Date(label).getDate()}`} // hasil: "Tanggal: 1" atau "Tanggal: 27"
                    />

                    <Legend wrapperStyle={{ paddingTop: 10 }} />

                    {/* === BAR CHART — Produksi Harian === */}
                    <Bar
                        yAxisId="left"
                        dataKey="ton_muat"
                        name="Pemuatan Harian"
                        fill="#4CAF50"
                        barSize={26}
                    >
                        <LabelList
                            dataKey="ton_muat"
                            position="insideMiddle"
                            content={({ x, y, width, height, value }) => {
                                const cx = x + width / 2;
                                const cy = y + height / 2;
                                return (
                                    <text
                                        x={cx}
                                        y={cy}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        transform={`rotate(-90, ${cx}, ${cy})`}   // Rotasi 90°
                                        fill={height < 22 ? "#000" : "#fff"}       // warna dinamis
                                        style={{ fontSize: 12, fontWeight: 700 }}
                                    >
                                        {Number(value).toLocaleString("id-ID")}
                                    </text>
                                );
                            }}
                        />
                    </Bar>

                    {/* === LINE — Kumulatif === */}
                    <Line
                        yAxisId="right"
                        type="linear"
                        dataKey="pemuatan_sd"
                        name="Pemuatan s.d."
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ r: 4, stroke: '#3B82F6', fill: "#fff", strokeWidth: 2 }}
                    />

                    {/* === Target RKAP === */}
                    <Line
                        yAxisId="right"
                        type="linear"
                        dataKey="target"
                        name="Target RKAP"
                        stroke="#FF9800"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                    />

                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PemuatanDailyChart;
