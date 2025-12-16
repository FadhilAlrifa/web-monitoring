import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; 

const API_URL = process.env.REACT_APP_API_URL;
const REPORT_API = 'laporan'; 

const initialFormData = {
    tanggal: new Date().toISOString().split('T')[0],
    id_unit: '',
    produksi_s1: '', // Gunakan string agar mendukung input koma
    produksi_s2: '',
    produksi_s3: '',
    produksi_ton: 0, 
    jam_operasi: '',
    h_proses: '', h_listrik: '', h_mekanik: '', h_operator: '',
    h_hujan: '', h_kapal: '', h_pmc: '',
    id_laporan: null,
};

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

    const allowedGroupName = unitGroup === 'pabrik' ? 'Pabrik' : unitGroup === 'bks' ? 'BKS' : undefined;

    // --- HELPER: Konversi string lokal (koma) ke angka sistem (titik) ---
    const parseValue = (val) => {
        if (!val) return 0;
        const cleaned = val.toString().replace(',', '.');
        return parseFloat(cleaned) || 0;
    };

    const totalHambatan = 
        parseValue(formData.h_proses) + parseValue(formData.h_listrik) +
        parseValue(formData.h_mekanik) + parseValue(formData.h_operator) +
        parseValue(formData.h_hujan) + parseValue(formData.h_kapal) +
        parseValue(formData.h_pmc);

    const totalProduksi = 
        parseValue(formData.produksi_s1) +
        parseValue(formData.produksi_s2) +
        parseValue(formData.produksi_s3);

    useEffect(() => {
        setFormData(prev => ({ ...prev, produksi_ton: totalProduksi }));
    }, [formData.produksi_s1, formData.produksi_s2, formData.produksi_s3, totalProduksi]);

    const filteredLaporan = useMemo(() => {
        if (!laporan) return [];
        let filtered = laporan;
        const validUnitIds = new Set(units.map(u => u.id_unit.toString()));
        filtered = filtered.filter(item => validUnitIds.has(item.id_unit.toString()));
        if (filterUnitId) filtered = filtered.filter(item => item.id_unit.toString() === filterUnitId);
        if (filterDate) filtered = filtered.filter(item => item.tanggal.split('T')[0] === filterDate);
        return filtered;
    }, [laporan, filterUnitId, filterDate, units]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        
        // Logika Input: Jika bukan tanggal/select, perlakukan sebagai input teks yang mendukung koma
        if (type !== 'date' && name !== 'id_unit') {
            // Hanya izinkan angka, koma, dan titik
            const regex = /^[0-9.,]*$/;
            if (value === '' || regex.test(value)) {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleEdit = (laporanData) => {
        setFormData({ 
            ...laporanData,
            tanggal: formatDateInput(laporanData.tanggal),
            id_laporan: laporanData.id_laporan,
            id_unit: laporanData.id_unit.toString(),
            // Ubah titik dari database menjadi koma untuk kenyamanan user
            produksi_s1: (laporanData.produksi_s1 || 0).toString().replace('.', ','),
            produksi_s2: (laporanData.produksi_s2 || 0).toString().replace('.', ','),
            produksi_s3: (laporanData.produksi_s3 || 0).toString().replace('.', ','),
            jam_operasi: (laporanData.jam_operasi || 0).toString().replace('.', ','),
            h_proses: (laporanData.h_proses || 0).toString().replace('.', ','),
            h_listrik: (laporanData.h_listrik || 0).toString().replace('.', ','),
            h_mekanik: (laporanData.h_mekanik || 0).toString().replace('.', ','),
            h_operator: (laporanData.h_operator || 0).toString().replace('.', ','),
            h_hujan: (laporanData.h_hujan || 0).toString().replace('.', ','),
            h_kapal: (laporanData.h_kapal || 0).toString().replace('.', ','),
            h_pmc: (laporanData.h_pmc || 0).toString().replace('.', ','),
        });
        setIsEditMode(true);
        window.scrollTo(0, 0);
    };

    const fetchMasterData = async () => {
        try {
            const unitsRes = await axios.get(`${API_URL}/api/units`);
            let filteredUnits = unitsRes.data;
            if (allowedGroupName) filteredUnits = filteredUnits.filter(unit => unit.group_name === allowedGroupName);
            setUnits(filteredUnits); 
        } catch (error) { setError('Gagal memuat unit kerja.'); }
    };

    const fetchLaporan = async () => {
        if (!isAdmin) { setIsLoading(false); return; }
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/${REPORT_API}/all`); 
            setLaporan(res.data);
        } catch (error) { setError('Gagal memuat daftar laporan.'); }
        finally { setIsLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        // KONVERSI SEMUA INPUT TEKS (KOMA) KE NUMBER (TITIK) SEBELUM KIRIM KE BACKEND
        const dataToSend = {
            tanggal: formData.tanggal,
            id_unit: formData.id_unit,
            produksi_s1: parseValue(formData.produksi_s1),
            produksi_s2: parseValue(formData.produksi_s2),
            produksi_s3: parseValue(formData.produksi_s3),
            produksi_ton: totalProduksi,
            jam_operasi: parseValue(formData.jam_operasi),
            h_proses: parseValue(formData.h_proses),
            h_listrik: parseValue(formData.h_listrik),
            h_mekanik: parseValue(formData.h_mekanik),
            h_operator: parseValue(formData.h_operator),
            h_hujan: parseValue(formData.h_hujan),
            h_kapal: parseValue(formData.h_kapal),
            h_pmc: parseValue(formData.h_pmc),
        };

        try {
            if (isEditMode) {
                await axios.put(`${API_URL}/api/${REPORT_API}/${formData.id_laporan}`, dataToSend);
            } else {
                await axios.post(`${API_URL}/api/${REPORT_API}`, dataToSend);
            }
            setSuccessMessage('Laporan berhasil disimpan!');
            setFormData(initialFormData);
            setIsEditMode(false);
            fetchLaporan();
        } catch (error) {
            setError(error.response?.data?.message || 'Gagal menyimpan laporan.');
        }
    };

    const handleDelete = async (id_laporan) => {
        if (window.confirm('Hapus laporan ini?')) {
            try {
                await axios.delete(`${API_URL}/api/${REPORT_API}/${id_laporan}`);
                setSuccessMessage('Laporan dihapus.');
                fetchLaporan();
            } catch (error) { setError('Gagal menghapus laporan.'); }
        }
    };

    useEffect(() => {
        fetchMasterData();
        if (user) fetchLaporan();
    }, [user, isAdmin]);

    const getUnitName = (id) => units.find(u => u.id_unit.toString() === id.toString())?.nama_unit || 'N/A';

    // MODIFIKASI RENDER INPUT: Gunakan type="text" & inputMode="decimal"
    const renderInput = (label, name, type = 'text', disabled = false) => (
        <div className="flex flex-col">
            <label className="text-sm mb-1 font-medium text-gray-700">{label}</label>
            <input
                type={type}
                inputMode={type === 'text' ? 'decimal' : undefined}
                name={name}
                value={formData[name]} 
                onChange={handleChange}
                className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
                disabled={disabled}
                required={name === 'tanggal' || name === 'id_unit'}
                placeholder={type === 'text' ? "0,00" : ""}
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl mb-6 border">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
                        <h2 className="text-2xl font-extrabold text-gray-800">
                            {isEditMode ? "✏️ Edit Laporan Produksi" : "➕ Input Produksi Harian"}
                        </h2>
                        <span className="px-4 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                            {allowedGroupName || "Global"}
                        </span>
                    </div>

                    {successMessage && <div className="bg-green-100 border-green-400 text-green-700 px-4 py-3 rounded relative">{successMessage}</div>}
                    {error && <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded relative">{error}</div>}

                    <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
                        {renderInput("Tanggal Produksi", "tanggal", "date", isEditMode)}
                        <div className="flex flex-col">
                            <label className="text-sm mb-1 font-medium">Unit Kerja</label>
                            <select name="id_unit" value={formData.id_unit} onChange={handleChange} className="p-3 border rounded-lg" disabled={isEditMode} required>
                                <option value="">-- Pilih Unit --</option>
                                {units.map(u => <option key={u.id_unit} value={u.id_unit}>{u.nama_unit}</option>)}
                            </select>
                        </div>
                        {renderInput("Jam Operasi", "jam_operasi")}
                    </div>

                    <div>
                        <h3 className="font-bold text-lg text-blue-700 mb-3">Produksi per Shift (TON)</h3>
                        <div className="grid md:grid-cols-3 gap-5">
                            {renderInput("Shift 1", "produksi_s1")}
                            {renderInput("Shift 2", "produksi_s2")}
                            {renderInput("Shift 3", "produksi_s3")}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-green-600 to-emerald-500 text-white p-6 rounded-xl shadow-lg">
                            <p className="text-sm uppercase opacity-90">Total Produksi</p>
                            <p className="text-xl font-extrabold mt-2">{totalProduksi.toLocaleString('id-ID')} TON</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white p-6 rounded-xl shadow-lg">
                            <p className="text-sm uppercase opacity-90">Total Jam Hambatan</p>
                            <p className="text-xl font-extrabold mt-2">{totalHambatan.toLocaleString('id-ID')} Jam</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg text-blue-700 mb-3">Jam Hambatan</h3>
                        <div className="grid lg:grid-cols-7 md:grid-cols-3 gap-4">
                            {renderInput("Proses", "h_proses")}
                            {renderInput("Listrik", "h_listrik")}
                            {renderInput("Mekanik", "h_mekanik")}
                            {renderInput("Operator", "h_operator")}
                            {renderInput("Hujan", "h_hujan")}
                            {renderInput("Kapal", "h_kapal")}
                            {renderInput("PMC", "h_pmc")}
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition">
                            {isEditMode ? "💾 Perbarui Data" : "✅ Simpan Laporan"}
                        </button>
                        {isEditMode && (
                            <button type="button" onClick={() => { setIsEditMode(false); setFormData(initialFormData); }} className="bg-gray-300 hover:bg-gray-400 px-8 py-3 rounded-xl font-semibold transition">
                                ❌ Batal
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* TABEL LISTING */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Daftar Laporan Harian</h2>
                <div className="flex flex-col sm:flex-row gap-4 mb-4 p-4 border rounded-md bg-gray-50">
                    <select value={filterUnitId} onChange={(e) => setFilterUnitId(e.target.value)} className="p-2 border rounded-md flex-1">
                        <option value="">-- Semua Unit --</option>
                        {units.map(unit => <option key={unit.id_unit} value={unit.id_unit}>{unit.nama_unit}</option>)}
                    </select>
                    <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="p-2 border rounded-md flex-1" />
                </div>

                {isLoading ? <p className="text-center p-8">Memuat data...</p> : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left">Tanggal</th>
                                    <th className="px-6 py-3 text-left">Unit</th>
                                    <th className="px-6 py-3 text-left">Produksi (TON)</th>
                                    <th className="px-6 py-3 text-left">Jam Ops</th>
                                    <th className="px-6 py-3 text-left text-red-500">Hambatan</th>
                                    <th className="px-6 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredLaporan.map((l) => (
                                    <tr key={l.id_laporan} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">{new Date(l.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td className="px-6 py-4 font-medium">{getUnitName(l.id_unit)}</td>
                                        <td className="px-6 py-4">{parseFloat(l.produksi_ton).toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4">{parseFloat(l.jam_operasi).toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 text-red-500 font-semibold">{parseFloat(l.total_hambatan).toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 text-center space-x-2">
                                            <button onClick={() => handleEdit(l)} className="text-blue-600 bg-blue-50 px-3 py-1 rounded">Edit</button>
                                            <button onClick={() => handleDelete(l.id_laporan)} className="text-red-600 bg-red-50 px-3 py-1 rounded">Hapus</button>
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