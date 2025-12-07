// src/components/PackingPlantDailyChart.js

import React from 'react';
import {
    ComposedChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    CartesianGrid, Line, LabelList
} from 'recharts';

const PackingPlantDailyChart = ({ dailyReport }) => {

    if (!dailyReport || dailyReport.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Produksi Harian Packing Plant</h3>
                <p className="text-center text-gray-500 py-10">Tidak ada data harian Packing Plant yang ditemukan.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Produksi Harian Packing Plant</h3>

            <ResponsiveContainer width="100%" height={420}>
                <ComposedChart
                    data={dailyReport}
                    margin={{ top: 30, right: 40, left: 10, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="4 4" stroke="#e0e0e0" />

                    {/* === Sumbu X === */}
                    <XAxis
                        dataKey="tanggal"
                        tickFormatter={(d) => {
                            const t = new Date(d)
                            return `${t.getDate()} ${t.toLocaleString("id-ID", { month: "short" })}`
                        }}
                        style={{ fontSize: "11px", fontWeight: 600 }}
                    />

                    {/* === Sumbu Y KIRI (Untuk Bar) === */}
                    <YAxis
                        yAxisId="left"
                        label={{ value: "Ton Muat", angle: -90, position: "insideLeft", offset: -5 }}
                        tickFormatter={(v) => v.toLocaleString()}
                        domain={[0, (max) => max + 500]}
                        style={{ fontSize: "11px" }}
                    />

                    {/* === Sumbu Y KANAN untuk line === */}
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        label={{ value: "Kumulatif / Target", angle: 90, position: "insideRight", offset: -5 }}
                        tickFormatter={(v) => v.toLocaleString()}
                        domain={[0, (max) => max + 3000]}
                        style={{ fontSize: "11px" }}
                    />

                    {/* === Tooltip lebih rapih === */}
                    <Tooltip
                        contentStyle={{ borderRadius: 10, borderColor: "#ccc" }}
                        formatter={(value) => Number(value).toLocaleString("id-ID")}
                        labelFormatter={(label) => {
                            const d = new Date(label)
                            return `📅 ${d.getDate()} ${d.toLocaleString("id-ID", { month: "long" })}`
                        }}
                    />

                    <Legend iconSize={12} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />

                    {/* === BAR PRODUKSI HARIAN (dengan label miring)=== */}
                    {/* === BAR PRODUKSI HARIAN (LABEL BERPOTASI 90° DI TENGAH BAR) === */}
                    <Bar
                        yAxisId="left"
                        dataKey="ton_muat"
                        name="Produksi Harian"
                        fill="#039be5"
                        barSize={26}
                    >
                        <LabelList
                            dataKey="ton_muat"
                            position="insideMiddle"
                            content={({ x, y, width, height, value }) => {
                                const centerX = x + width / 2;
                                const centerY = y + height / 2;

                                return (
                                    <text
                                        x={centerX}
                                        y={centerY}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        transform={`rotate(-90, ${centerX}, ${centerY})`}  // ROTASI 90° 🔥
                                        fill={height < 22 ? "#000" : "#fff"}               // warna otomatis
                                        style={{ fontSize: 12, fontWeight: 700 }}
                                    >
                                        {Number(value).toLocaleString("id-ID")}
                                    </text>
                                );
                            }}
                        />
                    </Bar>


                    {/* === LINE KUMULATIF === */}
                    <Line
                        yAxisId="right"
                        dataKey="pemuatan_sd"
                        name="Produksi S.D."
                        stroke="#F57C00"
                        strokeWidth={3}
                        type="monotone"
                        dot={{ r: 5, fill: "white", stroke: "#F57C00", strokeWidth: 2 }}
                    />

                    {/* === LINE TARGET RKAP === */}
                    <Line
                        yAxisId="right"
                        dataKey="target"
                        name="Target Harian"
                        stroke="#E53935"
                        strokeDasharray="6 4"
                        strokeWidth={3}
                        type="monotone"
                        dot={false}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PackingPlantDailyChart;
