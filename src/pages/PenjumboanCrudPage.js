import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// const API_URL = 'http://localhost:5000/api';
const API_URL = process.env.REACT_APP_API_URL;

// Hapus: fetch(`${API_URL}/api`)

const PAGE_GROUP_NAME = 'Penjumboan';
const REPORT_API = 'penjumboan/laporan';

const initialFormData = {
    tanggal: new Date().toISOString().split('T')[0],
    id_unit: '',
    shift_1_ton: 0,
    shift_2_ton: 0,
    shift_3_ton: 0,
    target: 650,
    id_laporan: null,
};

const PenjumboanCrudPage = () => {
    const { user, isAdmin } = useAuth();
    const [units, setUnits] = useState([]);
    const [laporan, setLaporan] = useState([]);
    const [formData, setFormData] = useState(initialFormData);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);

    // State Filter BARU
    const [filterUnitId, setFilterUnitId] = useState('');
    const [filterDate, setFilterDate] = useState('');

    // State Notifikasi
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Perhitungan Total
    const totalProduksi = parseFloat(formData.shift_1_ton || 0) +
        parseFloat(formData.shift_2_ton || 0) +
        parseFloat(formData.shift_3_ton || 0);

    // --- LOGIKA FILTERING TABEL (useMemo) ---
    const filteredLaporan = useMemo(() => {
        if (!laporan) return [];

        let filtered = laporan;

        const validUnitIds = new Set(units.map(u => u.id_unit.toString()));
        filtered = filtered.filter(item => validUnitIds.has(item.id_unit.toString()));

        if (filterUnitId) {
            filtered = filtered.filter(item => item.id_unit.toString() === filterUnitId);
        }

        if (filterDate) {
            filtered = filtered.filter(item => item.tanggal.split('T')[0] === filterDate);
        }

        return filtered;
    }, [laporan, filterUnitId, filterDate, units]);


    const exportToCSV = () => {
        if (filteredLaporan.length === 0) {
            return alert("Tidak ada data untuk diekspor.");
        }

        const headers = [
            "Tanggal", "Unit Kerja", "Target (Ton)", "Shift 1 (Ton)", "Shift 2 (Ton)",
            "Shift 3 (Ton)", "Total Produksi"
        ];

        const csvRows = filteredLaporan.map(item => {
            const unitName = getUnitName(item.id_unit);
            const total = parseFloat(item.shift_1_ton) + parseFloat(item.shift_2_ton) + parseFloat(item.shift_3_ton);

            // === Gunakan tanggal asli tanpa +1 hari === //
            const originalDate = new Date(item.tanggal);
            const day = String(originalDate.getDate()).padStart(2, '0');
            const month = String(originalDate.getMonth() + 1).padStart(2, '0');
            const year = originalDate.getFullYear();

            const fixedDate = `${day}-${month}-${year}`; // hasil dd-mm-yyyy

            return [
                `"${fixedDate}"`,
                `"${unitName}"`,
                item.target,
                item.shift_1_ton,
                item.shift_2_ton,
                item.shift_3_ton,
                total
            ].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `Laporan_Penjumboan_${PAGE_GROUP_NAME}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- HANDLERS ---

    const handleChange = (e) => {
        const { name, value } = e.target;
        const val = (name.endsWith('_ton') || name === 'target')
            ? parseFloat(value) || 0
            : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleEdit = (laporanData) => {
        setFormData({
            ...laporanData,
            tanggal: laporanData.tanggal.split('T')[0],
            id_laporan: laporanData.id_laporan,
            id_unit: laporanData.id_unit.toString(),
            shift_1_ton: parseFloat(laporanData.shift_1_ton) || 0,
            shift_2_ton: parseFloat(laporanData.shift_2_ton) || 0,
            shift_3_ton: parseFloat(laporanData.shift_3_ton) || 0,
            target: parseFloat(laporanData.target) || 0,
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

    // --- FETCH DATA ---
    const fetchMasterData = async () => {
        try {
            // PERBAIKAN: Tambahkan /api/ untuk rute units
            const unitsRes = await axios.get(`${API_URL}/api/units`); // <--- PERBAIKAN

            let filteredUnits = unitsRes.data.filter(unit => unit.group_name === PAGE_GROUP_NAME);
            setUnits(filteredUnits);

            if (filteredUnits.length > 0 && !formData.id_unit) {
                setFormData(prev => ({ ...prev, id_unit: filteredUnits[0].id_unit.toString() }));
            }
        } catch (error) {
            console.error('Error fetching master data:', error);
            setError('Gagal memuat unit kerja.');
        } finally {
            // Set loading false di sini setelah fetch master data
            setIsLoading(false);
        }
    };

    const fetchLaporan = async () => {
        if (!isAdmin) { setIsLoading(false); return; }
        setIsLoading(true);
        try {
            // PERBAIKAN: Tambahkan /api/ untuk rute laporan/all
            const res = await axios.get(`${API_URL}/api/${REPORT_API}/all`); // <--- PERBAIKAN
            setLaporan(res.data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching penjumboan reports:', error.response?.data);
            setError('Gagal memuat daftar laporan. (Cek token Admin dan koneksi backend)');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMasterData();
        if (user) { fetchLaporan(); } else { setIsLoading(false); }
    }, [user, isAdmin]);

    // --- CRUD OPERATION HANDLERS ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!formData.id_unit) { return setError("Silakan pilih Unit Kerja."); }

        try {
            if (isEditMode) {
                // PERBAIKAN: Tambahkan /api/ untuk rute PUT
                await axios.put(`${API_URL}/api/${REPORT_API}/${formData.id_laporan}`, formData); // <--- PERBAIKAN
                setSuccessMessage('Laporan diperbarui!');
            } else {
                // PERBAIKAN: Tambahkan /api/ untuk rute POST
                await axios.post(`${API_URL}/api/${REPORT_API}`, formData); // <--- PERBAIKAN
                setSuccessMessage('Laporan ditambahkan!');
            }

            setFormData(initialFormData);
            setIsEditMode(false);
            fetchLaporan();

        } catch (error) {
            console.error('Error submitting report:', error.response?.data);
            setError(error.response?.data?.message || 'Gagal menyimpan laporan. Cek konsol untuk detail.');
        }
    };

    const handleDelete = async (id_laporan) => {
        if (window.confirm('Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.')) {
            setError(null);
            setSuccessMessage(null);
            try {
                // PERBAIKAN: Tambahkan /api/ untuk rute delete
                await axios.delete(`${API_URL}/api/${REPORT_API}/${id_laporan}`); // <--- PERBAIKAN
                setSuccessMessage('Laporan berhasil dihapus.');
                fetchLaporan();
            } catch (error) {
                console.error('Error deleting report:', error.response?.data);
                setError('Gagal menghapus laporan.');
            }
        }
    };

    const getUnitName = (id) => units.find(u => u.id_unit.toString() === id.toString())?.nama_unit || 'N/A';

    // Komponen Input Shift yang Reusable
    const renderShiftInput = (shiftNum, label) => (
        <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">{label} (Ton)</label>
            <input
                type="number"
                name={`shift_${shiftNum}_ton`}
                value={formData[`shift_${shiftNum}_ton`]?.toString() || ''}
                onChange={handleChange}
                className="p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                step="0.01"
                min="0"
            />
        </div>
    );

    // --- RENDER COMPONENT ---
    const pageTitle = isEditMode ? '🛠️ Edit Data Laporan Penjumboan' : `➕ Input Data Harian ${PAGE_GROUP_NAME}`;

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-2">
                {pageTitle}
            </h1>

            {/* Notifikasi */}
            {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{successMessage}</div>}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}

            {/* FORM INPUT */}
            <div className="bg-white p-6 rounded-xl shadow-lg mb-10 border border-gray-200">
                <form onSubmit={handleSubmit}>

                    {/* BAGIAN UMUM */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {/* Tanggal */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                            <input
                                type="date"
                                name="tanggal"
                                value={formData.tanggal}
                                onChange={handleChange}
                                required
                                className="p-2 border rounded-md"
                                disabled={isEditMode}
                            />
                        </div>

                        {/* Dropdown Unit Kerja */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Unit Kerja</label>
                            <select
                                name="id_unit"
                                value={formData.id_unit.toString()}
                                onChange={handleChange}
                                required
                                className="p-2 border rounded-md"
                                disabled={isEditMode}
                            >
                                <option value="" disabled>Pilih Unit</option>
                                {units.map(u => (
                                    <option key={u.id_unit} value={u.id_unit.toString()}>{u.nama_unit}</option>
                                ))}
                            </select>
                        </div>

                        {/* Target Harian */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Target Harian (Ton)</label>
                            <input
                                type="number"
                                name="target"
                                value={formData.target.toString()}
                                onChange={handleChange}
                                className="p-2 border rounded-md"
                                step="1"
                                min="0"
                            />
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold text-blue-700 mb-4 border-t pt-4">Input Produksi Shift (Ton)</h3>

                    {/* BAGIAN SHIFT INPUT */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {renderShiftInput(1, 'Shift 1')}
                        {renderShiftInput(2, 'Shift 2')}
                        {renderShiftInput(3, 'Shift 3')}
                    </div>

                    {/* TOTAL PRODUKSI OTOMATIS */}
                    <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 mb-6">
                        <p className="font-semibold text-gray-700">Total Produksi (Shift 1+2+3):</p>
                        <p className="text-2xl font-bold text-blue-800">{totalProduksi.toFixed(2)} TON</p>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex space-x-4 justify-end">
                        {isEditMode ? (
                            <>
                                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
                                    Simpan Perubahan
                                </button>
                                <button type="button" onClick={handleCancelEdit} className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition">
                                    Batal Edit
                                </button>
                            </>
                        ) : (
                            <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                                Tambah Laporan
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* --- DAFTAR LAPORAN (READ) --- */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-0 mt-0">Daftar Laporan Penjumboan</h2>

                    {/* TOMBOL DOWNLOAD BARU DITEMPATKAN DI SINI */}
                    <button
                        onClick={exportToCSV}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition duration-150 flex items-center space-x-2 disabled:opacity-50"
                        disabled={filteredLaporan.length === 0}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        <span>Download Data (.CSV)</span>
                    </button>
                </div>

                {/* AREA FILTER BARU */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4 p-4 border rounded-md bg-gray-50">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Filter Unit Kerja:</label>
                        <select
                            value={filterUnitId}
                            onChange={(e) => setFilterUnitId(e.target.value)}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                        >
                            <option value="">-- Semua Unit --</option>
                            {units.map(unit => (
                                <option key={unit.id_unit} value={unit.id_unit}>
                                    {unit.nama_unit}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Filter Tanggal:</label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                        />
                    </div>
                </div>
                {/* AKHIR AREA FILTER */}


                {isLoading ? (
                    <p className="text-blue-600">Memuat data laporan...</p>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Kerja</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Target (Ton)</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">S1 (Ton)</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">S2 (Ton)</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">S3 (Ton)</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Prod.</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredLaporan.map((item) => {
                                    const total = parseFloat(item.shift_1_ton) + parseFloat(item.shift_2_ton) + parseFloat(item.shift_3_ton);
                                    const target = parseFloat(item.target);

                                    return (
                                        <tr key={item.id_laporan} className="hover:bg-yellow-50/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {getUnitName(item.id_unit)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                {target.toFixed(0)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{parseFloat(item.shift_1_ton).toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{parseFloat(item.shift_2_ton).toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{parseFloat(item.shift_3_ton).toFixed(2)}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-center ${total >= target ? 'text-green-600' : 'text-red-600'}`}>
                                                {total.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <div className="flex space-x-2 justify-center">
                                                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-md text-xs font-semibold transition">Edit</button>
                                                    <button onClick={() => handleDelete(item.id_laporan)} className="text-red-600 hover:text-red-800 bg-red-50 px-3 py-1 rounded-md text-xs font-semibold transition">Hapus</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};


export default PenjumboanCrudPage;
