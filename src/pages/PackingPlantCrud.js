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
        <div className="min-h-screen bg-gray-50 p-8">

            <h1 className="text-3xl font-bold mb-6 text-center">
                {isEditMode ? "Edit Laporan Packing Plant" : "Input Laporan Packing Plant"}
            </h1>

            {successMessage && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{successMessage}</div>}
            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

            {/* FORM */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-8 max-w-5xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {renderInput('tanggal', 'Tanggal', 'date', isEditMode)}

                        <div className="flex flex-col">
                            <label className="text-sm font-semibold mb-1">Unit Kerja</label>
                            <select
                                name="id_unit"
                                value={formData.id_unit}
                                onChange={handleChange}
                                disabled={isEditMode}
                                className="p-2 border rounded-md"
                                required
                            >
                                <option value="">-- Pilih Unit --</option>
                                {units.map(u => (
                                    <option key={u.id_unit} value={u.id_unit}>{u.nama_unit}</option>
                                ))}
                            </select>
                        </div>

                        {renderInput('ton_muat', 'Ton Muat')}
                        {renderInput('target', 'Target Harian')}
                    </div>

                    {renderInput('target_rkp', 'Target RKAP Bulanan')}

                    <div className="flex justify-between bg-blue-50 p-4 rounded">
                        <span>Ton Tercatat</span>
                        <span className="font-bold">{tonMuatTercatat} TON</span>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button className="bg-blue-600 text-white px-6 py-2 rounded">
                            {isEditMode ? "Simpan" : "Tambah"}
                        </button>

                        {isEditMode && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="bg-gray-400 text-white px-6 py-2 rounded"
                            >
                                Batal
                            </button>
                        )}
                    </div>

                </form>
            </div>

            {/* TABEL */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-between mb-4">
                    <h2 className="text-xl font-bold">Data Packing Plant</h2>
                    <button onClick={exportToCSV} className="bg-green-600 text-white px-4 py-2 rounded">
                        Download CSV
                    </button>
                </div>

                {isLoading ? (
                    <p>Memuat data...</p>
                ) : (
                    <table className="w-full border">
                        <thead className="bg-gray-100">
                            <tr>
                                <th>Tanggal</th>
                                <th>Unit</th>
                                <th>Ton Muat</th>
                                <th>Target</th>
                                <th>RKAP</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLaporan.map(item => (
                                <tr key={item.id_laporan} className="border-t text-center">
                                    <td>{item.tanggal.split('T')[0]}</td>
                                    <td>{getUnitName(item.id_unit)}</td>
                                    <td>{item.ton_muat}</td>
                                    <td>{item.target}</td>
                                    <td>{item.target_rkp}</td>
                                    <td className="space-x-2">
                                        <button onClick={() => handleEdit(item)} className="text-blue-600">Edit</button>
                                        <button onClick={() => handleDelete(item.id_laporan)} className="text-red-600">Hapus</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

        </div>
    );
};

export default PackingPlantCrud;
