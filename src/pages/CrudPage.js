import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; 

// const API_URL = 'http://localhost:5000/api';
const API_URL = process.env.REACT_APP_API_URL;

// Panggilan API di frontend:
fetch(`${API_URL}/api`)
const REPORT_API = 'laporan'; 

// --- STATE AWAL ---
const initialFormData = {
    tanggal: new Date().toISOString().split('T')[0],
    id_unit: '',

    // PRODUKSI SHIFT ➕ DITAMBAHKAN
    produksi_s1: 0,
    produksi_s2: 0,
    produksi_s3: 0,

    produksi_ton: 0, // sekarang otomatis (total shift)

    jam_operasi: 0,
    h_proses: 0, h_listrik: 0, h_mekanik: 0, h_operator: 0,
    h_hujan: 0, h_kapal: 0, h_pmc: 0,
    id_laporan: null,
};

// --- FIX TANGGAL ---
const formatDateInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`; 
};


const CrudPage = ({ unitGroup }) => { 
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

    const allowedGroupName = unitGroup === 'pabrik' ? 'Pabrik' : 
                             unitGroup === 'bks' ? 'BKS' : undefined;

    const totalHambatan = 
        parseFloat(formData.h_proses || 0) +
        parseFloat(formData.h_listrik || 0) +
        parseFloat(formData.h_mekanik || 0) +
        parseFloat(formData.h_operator || 0) +
        parseFloat(formData.h_hujan || 0) +
        parseFloat(formData.h_kapal || 0) +
        parseFloat(formData.h_pmc || 0);

    const totalWaktu = parseFloat(formData.jam_operasi || 0) + totalHambatan;

    // ➕ TOTAL PRODUKSI DARI SHIFT
    const totalProduksi = 
        parseFloat(formData.produksi_s1 || 0) +
        parseFloat(formData.produksi_s2 || 0) +
        parseFloat(formData.produksi_s3 || 0);

    // Update otomatis ke produksi_ton
    useEffect(() => {
        setFormData(prev => ({ ...prev, produksi_ton: totalProduksi }));
    }, [
        formData.produksi_s1,
        formData.produksi_s2,
        formData.produksi_s3
    ]);

    // FILTER DATA
    const filteredLaporan = useMemo(() => {
        if (!laporan) return [];
        let filtered = laporan;
        const validUnitIds = new Set(units.map(u => u.id_unit.toString()));
        filtered = filtered.filter(item => validUnitIds.has(item.id_unit.toString()));
        if (filterUnitId) filtered = filtered.filter(item => item.id_unit.toString() === filterUnitId);
        if (filterDate) filtered = filtered.filter(item => item.tanggal.split('T')[0] === filterDate);
        return filtered;
    }, [laporan, filterUnitId, filterDate, units]);
    
    const exportToCSV = () => {
        if (filteredLaporan.length === 0) {
            return alert("Tidak ada data untuk diekspor.");
        }
        
        const headers = [
            "Tanggal", "Unit Kerja", "Produksi (Ton)", "Jam Operasi", "Total Hambatan",
            "Hambatan Proses", "Hambatan Listrik", "Hambatan Mekanik", "Hambatan Operator", 
            "Hambatan Hujan", "Hambatan Kapal", "Hambatan PMC"
        ];
        
        const csvRows = filteredLaporan.map(item => {
            const unitName = getUnitName(item.id_unit); 
            
            // Format Tanggal untuk CSV (Tambahkan 12 jam offset untuk mengoreksi Timezone Bug)
            const dateFromDB = new Date(item.tanggal);
            const correctedDate = new Date(dateFromDB.getTime() + (12 * 60 * 60 * 1000));
            const formattedDate = correctedDate.toLocaleDateString('en-GB'); 

            return [
                `"${formattedDate}"`,
                `"${unitName}"`,
                item.produksi_ton,
                item.jam_operasi,
                item.total_hambatan,
                item.h_proses,
                item.h_listrik,
                item.h_mekanik,
                item.h_operator,
                item.h_hujan,
                item.h_kapal,
                item.h_pmc
            ].join(',');
        });

        const csvContent = [
            headers.join(','),
            ...csvRows
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `Laporan_Produksi_${allowedGroupName || 'Global'}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    // HANDLER INPUT
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const val = (type === 'number' || name.startsWith('produksi_s') ) 
            ? parseFloat(value) || 0 
            : value;

        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleEdit = (laporanData) => {
        setFormData({ 
            ...laporanData,
            tanggal: formatDateInput(laporanData.tanggal),
            id_laporan: laporanData.id_laporan,
            id_unit: laporanData.id_unit.toString(),

            // pastikan shift ikut terisi
            produksi_s1: laporanData.produksi_s1 || 0,
            produksi_s2: laporanData.produksi_s2 || 0,
            produksi_s3: laporanData.produksi_s3 || 0,
        });
        setIsEditMode(true);
        setSuccessMessage(null);
        setError(null);
    };

    // FETCH
    const fetchMasterData = async () => {
        try {
            const unitsRes = await axios.get(`${API_URL}/units`);
            let filteredUnits = unitsRes.data;
            if (allowedGroupName) 
                filteredUnits = filteredUnits.filter(unit => unit.group_name === allowedGroupName);

            setUnits(filteredUnits); 
        } catch (error) {
            console.error(error);
            setError('Gagal memuat unit kerja.'); 
        }
    };

    const fetchLaporan = async () => {
        if (!isAdmin) { setIsLoading(false); return; }
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_URL}/${REPORT_API}/all`); 
            setLaporan(res.data);
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            setError('Gagal memuat daftar laporan.');
            setIsLoading(false);
        }
    };

    const handleDelete = async (id_laporan) => {
        if (window.confirm('Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.')) {
            setError(null);
            setSuccessMessage(null);
            try {
                await axios.delete(`${API_URL}/${REPORT_API}/${id_laporan}`);
                setSuccessMessage('Laporan berhasil dihapus.');
                fetchLaporan();
            } catch (error) {
                console.error('Error deleting report:', error.response?.data);
                setError('Gagal menghapus laporan.');
            }
        }
    };

    useEffect(() => {
        fetchMasterData();
        if (user) fetchLaporan();
        else setIsLoading(false);
    }, [user, isAdmin]);

    // SUBMIT
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        const dataToSend = {
            tanggal: formData.tanggal,
            id_unit: formData.id_unit,
            id_laporan: formData.id_laporan,

            produksi_s1: parseFloat(formData.produksi_s1),
            produksi_s2: parseFloat(formData.produksi_s2),
            produksi_s3: parseFloat(formData.produksi_s3),

            produksi_ton: totalProduksi,
            jam_operasi: parseFloat(formData.jam_operasi),

            h_proses: parseFloat(formData.h_proses),
            h_listrik: parseFloat(formData.h_listrik),
            h_mekanik: parseFloat(formData.h_mekanik),
            h_operator: parseFloat(formData.h_operator),
            h_hujan: parseFloat(formData.h_hujan),
            h_kapal: parseFloat(formData.h_kapal),
            h_pmc: parseFloat(formData.h_pmc),
        };

        try {
            if (isEditMode) {
                await axios.put(`${API_URL}/${REPORT_API}/${formData.id_laporan}`, dataToSend);
            } else {
                await axios.post(`${API_URL}/${REPORT_API}`, dataToSend);
            }

            // window.alert("Laporan berhasil disimpan!"); // ⬅️ ALERT BERHASIL
            setSuccessMessage('Laporan berhasil disimpan!');
            setFormData(initialFormData);
            setIsEditMode(false);
            fetchLaporan();

        } catch (error) {
            console.error(error);
            // window.alert("Gagal menyimpan laporan!"); // ⬅️ ALERT GAGAL
            setError('Gagal menyimpan laporan.');
        }
    };


    const getUnitName = (id) => units.find(u => u.id_unit.toString() === id.toString())?.nama_unit || 'N/A';

    // RENDER INPUT
    const renderInput = (label, name, type = 'number', step = '0.01', disabled = false) => (
        <div className="flex flex-col">
            <label className="text-sm mb-1">{label}</label>
            <input
                id={name}
                type={type}
                name={name}
                value={formData[name]?.toString() || ''} 
                onChange={handleChange}
                className="p-2 border rounded"
                min={type === 'number' ? "0" : undefined}
                step={step}
                disabled={disabled}
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-3xl font-bold mb-6">
                {isEditMode ? "Edit Laporan Harian" : "➕ Input Data Harian Produksi"}
            </h1>
            {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{successMessage}</div>}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
            {/* FORM */}
            <div className="bg-white p-6 rounded shadow-md mb-10">
                <form onSubmit={handleSubmit}>

                    {/* HEADER */}
                    <div className="grid md:grid-cols-4 gap-4 mb-6">
                        {renderInput("Tanggal", "tanggal", "date", null, isEditMode)}

                        <div className="flex flex-col">
                            <label className="text-sm mb-1">Unit Kerja</label>
                            <select 
                                name="id_unit"
                                value={formData.id_unit}
                                onChange={handleChange}
                                className="p-2 border rounded"
                                disabled={isEditMode}
                            >
                                <option value="">-- Pilih Unit --</option>
                                {units.map(u => (
                                    <option key={u.id_unit} value={u.id_unit}>{u.nama_unit}</option>
                                ))}
                            </select>
                        </div>

                        {renderInput("Jam Operasi", "jam_operasi")}
                    </div>

                    {/* PRODUKSI SHIFT */}
                    <h3 className="font-bold text-lg text-blue-600 mb-3">Produksi per Shift (TON)</h3>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                        {renderInput("Produksi Shift 1", "produksi_s1")}
                        {renderInput("Produksi Shift 2", "produksi_s2")}
                        {renderInput("Produksi Shift 3", "produksi_s3")}
                    </div>

                    {/* TOTAL PRODUKSI */}
                    <div className="p-4 bg-gray-100 border-l-4 border-green-600 mb-6">
                        <p className="font-semibold">Total Produksi Hari Ini:</p>
                        <p className="text-xl font-bold text-green-800">{totalProduksi.toFixed(2)} TON</p>
                    </div>

                    {/* HAMBATAN */}
                    <h3 className="font-bold text-lg text-blue-600 mb-3">Jam Hambatan</h3>

                    <div className="grid md:grid-cols-7 gap-4 mb-4">
                        {renderInput("Proses", "h_proses")}
                        {renderInput("Listrik", "h_listrik")}
                        {renderInput("Mekanik", "h_mekanik")}
                        {renderInput("Operator", "h_operator")}
                        {renderInput("Hujan", "h_hujan")}
                        {renderInput("Kapal", "h_kapal")}
                        {renderInput("PMC", "h_pmc")}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                            {isEditMode ? "Perbarui Data" : "Tambah Laporan"}
                        </button>

                        {isEditMode && (
                            <button 
                                type="button" 
                                onClick={() => { setIsEditMode(false); setFormData(initialFormData); }}
                                className="bg-gray-300 px-6 py-2 rounded"
                            >
                                Batal
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* TABEL LISTING */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-0 mt-0">Daftar Laporan Harian Tersimpan</h2>
                    
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
                    <p className="text-center p-8">Memuat data laporan...</p>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produksi (TON)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Operasi</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hambatan</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredLaporan.map((l) => (
                                    <tr key={l.id_laporan} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {new Date(l.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getUnitName(l.id_unit)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parseFloat(l.produksi_ton).toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parseFloat(l.jam_operasi).toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500 font-semibold">{parseFloat(l.total_hambatan).toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                            <button onClick={() => handleEdit(l)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                            <button onClick={() => handleDelete(l.id_laporan)} className="text-red-600 hover:text-red-900">Hapus</button>
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

export default CrudPage;

