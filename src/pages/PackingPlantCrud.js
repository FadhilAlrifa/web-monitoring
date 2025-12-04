import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; 

const API_URL = process.env.REACT_APP_API_URL;

const PAGE_GROUP_NAME = 'Packing Plant'; 
const REPORT_API = 'packing-plant/laporan';

const initialFormData = {
    tanggal: new Date().toISOString().split('T')[0],
    id_unit: '',
    ton_muat: 0,
    target: 150, 
    target_rkp: 5000,
    id_laporan: null,
};

const PackingPlantCrud = () => { 
    const { user, isAdmin } = useAuth();
    const [units, setUnits] = useState([]);
    const [laporan, setLaporan] = useState([]);
    const [formData, setFormData] = useState(initialFormData);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);

    const [filterUnitId, setFilterUnitId] = useState('');
    const [filterDate, setFilterDate] = useState('');

    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const tonMuatTercatat = Number(formData.ton_muat || 0);

    // ================= FILTER DATA =================
    const filteredLaporan = useMemo(() => {
        let filtered = laporan;

        if (filterUnitId) {
            filtered = filtered.filter(item => item.id_unit.toString() === filterUnitId);
        }

        if (filterDate) {
            filtered = filtered.filter(item => item.tanggal.split('T')[0] === filterDate);
        }

        return filtered;
    }, [laporan, filterUnitId, filterDate]);

    // ================= CSV EXPORT (AMAN TIMEZONE) =================
    const exportToCSV = () => {
        if (filteredLaporan.length === 0) {
            return alert("Tidak ada data untuk diekspor.");
        }

        const headers = [
            "Tanggal", "Unit Kerja", "Ton Muat", "Target Harian", "Target RKAP"
        ];

        const csvRows = filteredLaporan.map(item => {
            const formattedDate = item.tanggal
                .split('T')[0]
                .split('-')
                .reverse()
                .join('/');

            return [
                `"${formattedDate}"`,
                `"${getUnitName(item.id_unit)}"`,
                item.ton_muat,
                item.target,
                item.target_rkp
            ].join(',');
        });

        const csvContent = [
            headers.join(','),
            ...csvRows
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `Laporan_${PAGE_GROUP_NAME}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ================= HANDLER INPUT =================
    const handleChange = (e) => {
        const { name, value } = e.target;
        const val = (name === 'ton_muat' || name === 'target' || name === 'target_rkp') 
            ? Number(value) || 0 
            : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    // ================= EDIT =================
    const handleEdit = (laporanData) => {
        setFormData({ 
            ...laporanData,
            tanggal: laporanData.tanggal.split('T')[0],
            id_unit: laporanData.id_unit.toString(),
        });
        setIsEditMode(true);
        setSuccessMessage(null);
        setError(null);
        window.scrollTo(0, 0);
    };

    const handleCancelEdit = () => {
        setFormData(initialFormData);
        setIsEditMode(false);
    };

    // ================= FETCH DATA =================
    const fetchMasterData = async () => {
        try {
            const unitsRes = await axios.get(`${API_URL}/api/units`);
            const filteredUnits = unitsRes.data.filter(
                unit => unit.group_name === PAGE_GROUP_NAME
            );
            setUnits(filteredUnits);
        } catch {
            setError('Gagal memuat unit kerja.');
        }
    };

    const fetchLaporan = async () => {
        if (!isAdmin) { setIsLoading(false); return; }
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/${REPORT_API}/all`);
            setLaporan(res.data);
            setIsLoading(false);
        } catch {
            setError('Gagal memuat laporan.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMasterData();
        if (user) fetchLaporan();
        else setIsLoading(false);
    }, [user, isAdmin]);

    // ================= SUBMIT =================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!formData.id_unit) return setError("Unit belum dipilih.");

        const dataToSend = {
            tanggal: formData.tanggal,
            id_unit: formData.id_unit,
            ton_muat: Number(formData.ton_muat) || 0,
            target: Number(formData.target) || 0,
            target_rkp: Number(formData.target_rkp) || 0,
        };

        try {
            if (isEditMode) {
                await axios.put(
                    `${API_URL}/api/${REPORT_API}/${formData.id_laporan}`,
                    dataToSend
                );

                setLaporan(prev =>
                    prev.map(item =>
                        item.id_laporan === formData.id_laporan
                            ? { ...item, ...dataToSend }
                            : item
                    )
                );

                setSuccessMessage('Laporan diperbarui!');
            } else {
                const res = await axios.post(
                    `${API_URL}/api/${REPORT_API}`,
                    dataToSend
                );

                setLaporan(prev => [...prev, res.data]);
                setSuccessMessage('Laporan ditambahkan!');
            }

            setFormData(initialFormData);
            setIsEditMode(false);

        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan data.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin hapus data ini?')) return;

        try {
            await axios.delete(`${API_URL}/api/${REPORT_API}/${id}`);
            setLaporan(prev => prev.filter(item => item.id_laporan !== id));
            setSuccessMessage('Laporan dihapus!');
        } catch {
            setError('Gagal menghapus laporan.');
        }
    };

    const getUnitName = (id) =>
        units.find(u => u.id_unit.toString() === id.toString())?.nama_unit || 'N/A';

    // ================= INPUT COMPONENT =================
    const renderInput = useCallback((name, label, type = 'number', disabled = false) => (
        <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">{label}</label>
            <input
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                disabled={disabled}
                min="0"
                className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                required
            />
        </div>
    ), [formData]);

    // ================= RENDER =================
    return (
        <div className="p-6 md:p-10 bg-gray-100 min-h-screen">

            {/* ✅ HEADER */}
            <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Packing Plant
            </h1>
            <p className="text-sm text-gray-500">Input & Monitoring Produksi</p>
            </div>

            {/* ✅ ALERT */}
            {successMessage && (
            <div className="mb-4 p-3 rounded bg-green-100 text-green-700 text-sm">
                {successMessage}
            </div>
            )}
            {error && (
            <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">
                {error}
            </div>
            )}

            {/* ✅ CARD FORM */}
            <div className="bg-white shadow rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">
                {isEditMode ? "Edit Laporan" : "Tambah Laporan"}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* TANGGAL */}
                <div>
                <label className="text-sm font-medium">Tanggal</label>
                <input
                    type="date"
                    name="tanggal"
                    value={formData.tanggal}
                    onChange={handleChange}
                    disabled={isEditMode}
                    className="w-full border rounded px-3 py-2 mt-1"
                />
                </div>

                {/* UNIT */}
                <div>
                <label className="text-sm font-medium">Unit</label>
                <select
                    name="id_unit"
                    value={formData.id_unit}
                    onChange={handleChange}
                    disabled={isEditMode}
                    className="w-full border rounded px-3 py-2 mt-1"
                >
                    <option value="">-- Pilih Unit --</option>
                    {units.map(u => (
                    <option key={u.id_unit} value={u.id_unit}>
                        {u.nama_unit}
                    </option>
                    ))}
                </select>
                </div>

                {/* TON MUAT */}
                <div>
                <label className="text-sm font-medium">Ton Muat</label>
                <input
                    type="number"
                    name="ton_muat"
                    value={formData.ton_muat}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 mt-1"
                />
                </div>

                {/* TARGET */}
                <div>
                <label className="text-sm font-medium">Target Harian</label>
                <input
                    type="number"
                    name="target"
                    value={formData.target}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 mt-1"
                />
                </div>

                {/* RKAP */}
                <div>
                <label className="text-sm font-medium">Target RKAP</label>
                <input
                    type="number"
                    name="target_rkp"
                    value={formData.target_rkp}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 mt-1"
                />
                </div>

                {/* ✅ BUTTON */}
                <div className="md:col-span-4 flex justify-end gap-3 mt-4">
                {isEditMode && (
                    <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-5 py-2 rounded bg-gray-500 text-white"
                    >
                    Batal
                    </button>
                )}

                <button
                    type="submit"
                    className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                    {isEditMode ? "Simpan" : "Tambah"}
                </button>
                </div>

            </form>
            </div>

            {/* ✅ CARD TABEL */}
            <div className="bg-white shadow rounded-xl p-6">

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Data Packing Plant</h2>

                <button
                onClick={exportToCSV}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                Download CSV
                </button>
            </div>

            {isLoading ? (
                <p className="text-sm text-gray-500">Memuat data...</p>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="border px-3 py-2">Tanggal</th>
                        <th className="border px-3 py-2">Unit</th>
                        <th className="border px-3 py-2">Ton</th>
                        <th className="border px-3 py-2">Target</th>
                        <th className="border px-3 py-2">RKAP</th>
                        <th className="border px-3 py-2">Aksi</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredLaporan.map(item => (
                        <tr key={item.id_laporan} className="hover:bg-gray-50">
                        <td className="border px-3 py-2">
                            {item.tanggal.split('T')[0]}
                        </td>
                        <td className="border px-3 py-2">
                            {getUnitName(item.id_unit)}
                        </td>
                        <td className="border px-3 py-2">{item.ton_muat}</td>
                        <td className="border px-3 py-2">{item.target}</td>
                        <td className="border px-3 py-2">{item.target_rkp}</td>
                        <td className="border px-3 py-2 space-x-2">
                            <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:underline"
                            >
                            Edit
                            </button>
                            <button
                            onClick={() => handleDelete(item.id_laporan)}
                            className="text-red-600 hover:underline"
                            >
                            Hapus
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            )}

            </div>
        </div>
    );
};

export default PackingPlantCrud;
