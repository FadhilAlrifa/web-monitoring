import React from 'react';
import {
    ComposedChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    CartesianGrid, Line, LabelList
} from 'recharts';

const DailyChart = ({ dailyReport, unitGroup, unitName }) => {

    // Mendapatkan judul chart
    const getTitle = () => {
        if (unitGroup === 'pabrik') return "Produksi Harian Packer Pabrik";
        if (unitGroup === 'bks') return "Produksi Harian Packer Pelabuhan";
        return "Produksi Harian Packer";
    };
    const chartTitle = unitName ? `Produksi Harian ${unitName}` : getTitle();

    if (!dailyReport || dailyReport.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col justify-center items-center">
                <h3 className="text-xl font-semibold mb-3 text-gray-800">{chartTitle}</h3>
                <p className="text-gray-500">Tidak ada data untuk ditampilkan.</p>
            </div>
        );
    }

    // PROSES DATA FIX — urut tanggal + generate nomor hari
    const sortedReport = dailyReport
        .map(d => ({ ...d, day: new Date(d.tanggal).getDate() }))
        .sort((a, b) => a.day - b.day);

    return (
        <div className="bg-white pb-1 rounded-xl shadow-lg h-full">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">{chartTitle}</h3>

            <ResponsiveContainer width="100%" height={460}>
                <ComposedChart data={sortedReport} margin={{ top: 30, right: 25, left: 0, bottom: 10 }}>

                    <CartesianGrid strokeDasharray="3 3" stroke="#CFCFCF" />

                    {/*======================== AXIS ========================*/}
                    <XAxis
                        dataKey="day"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: "#000" }}
                    />

                    <YAxis
                        yAxisId="left"
                        domain={[0, 1300]}   // mengikuti grafik contoh
                        tickCount={8}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                    />

                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 24]}
                        tickCount={7}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                    />

                    <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                    <Legend verticalAlign="bottom" height={40} />

                    {/*======================== BAR PRODUKSI ========================*/}
                    <Bar
                        yAxisId="left"
                        dataKey="produksi_ton"
                        fill="#8BC34A"
                        barSize={35}
                        name="Produksi"
                        label={({ x, y, width, height, value }) => (
                            <text
                                x={x + width / 2}
                                y={y + height / 2}
                                textAnchor="middle"
                                fill="#000"
                                fontSize="13"
                                fontWeight="bold"
                                transform={`rotate(-90, ${x + width / 2}, ${y + height / 2})`}
                            >
                                {Number(value).toLocaleString()}
                            </text>
                        )}
                    />


                    {/*======================== TARGET ========================*/}
                    <Line
                        yAxisId="left"
                        dataKey="target"
                        name="Target"
                        stroke="#F4B400"
                        strokeWidth={2}
                        strokeDasharray="6 6"
                        dot={{ r: 4, fill: "#F4B400" }}
                    />

                    {/*======================== JAM OPERASI ========================*/}
                    <Line
                        yAxisId="right"
                        dataKey="jam_operasi"
                        name="Jam Operasi"
                        stroke="#1A73E8"
                        strokeWidth={3}
                        dot={{ r: 5, fill: "#1A73E8" }}
                    >
                        <LabelList
                            dataKey="jam_operasi"
                            position="top"
                            fill="#000"
                            fontSize={12}
                        />
                    </Line>

                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default DailyChart;
