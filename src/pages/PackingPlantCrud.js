import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; 

const API_URL = process.env.REACT_APP_API_URL;
const PAGE_GROUP_NAME = 'Packing Plant'; 
const REPORT_API = 'packing-plant/laporan';

const initialFormData = {
    tanggal: new Date().toISOString().split('T')[0],
    id_unit: '',
    ton_muat: '', // Gunakan string untuk mendukung input koma
    target: '150', 
    target_rkp: '5000',
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

    // --- HELPER: Konversi string lokal (koma) ke angka sistem (titik) ---
    const parseValue = (val) => {
        if (!val) return 0;
        const cleaned = val.toString().replace(',', '.');
        return parseFloat(cleaned) || 0;
    };

    const tonMuatTercatat = parseValue(formData.ton_muat);

    // --- LOGIKA FILTERING TABEL ---
    const filteredLaporan = useMemo(() => {
        if (!laporan) return [];
        let filtered = laporan;
        const validUnitIds = new Set(units.map(u => u.id_unit.toString()));
        filtered = filtered.filter(item => validUnitIds.has(item.id_unit.toString()));
        if (filterUnitId) filtered = filtered.filter(item => item.id_unit.toString() === filterUnitId);
        if (filterDate) filtered = filtered.filter(item => item.tanggal.split('T')[0] === filterDate);
        return filtered;
    }, [laporan, filterUnitId, filterDate, units]);

    // --- HANDLERS ---
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        
        // Filter input angka (izinkan angka, koma, dan titik)
        if (name === 'ton_muat' || name === 'target' || name === 'target_rkp') {
            const regex = /^[0-9.,]*$/;
            if (value === '' || regex.test(value)) {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleEdit = (laporanData) => {
        const toComma = (val) => (val || 0).toString().replace('.', ',');
        setFormData({ 
            ...laporanData,
            tanggal: laporanData.tanggal.split('T')[0],
            id_laporan: laporanData.id_laporan,
            id_unit: laporanData.id_unit.toString(),
            ton_muat: toComma(laporanData.ton_muat),
            target: toComma(laporanData.target),
            target_rkp: toComma(laporanData.target_rkp),
        });
        setIsEditMode(true);
        window.scrollTo(0, 0);
    };

    const handleCancelEdit = () => {
        setFormData(initialFormData);
        setIsEditMode(false);
    };

    // --- FETCH DATA ---
    const fetchMasterData = async () => {
        try {
            const unitsRes = await axios.get(`${API_URL}/api/units`);
            let filteredUnits = unitsRes.data.filter(unit => unit.group_name === PAGE_GROUP_NAME);
            setUnits(filteredUnits); 
            if (filteredUnits.length > 0 && !formData.id_unit) {
                setFormData(prev => ({ ...prev, id_unit: filteredUnits[0].id_unit.toString() }));
            }
        } catch (error) {
            setError('Gagal memuat unit kerja.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const fetchLaporan = async () => {
        if (!isAdmin) { setIsLoading(false); return; }
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/${REPORT_API}/all`);
            setLaporan(res.data);
        } catch (error) {
            setError('Gagal memuat daftar laporan.'); 
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMasterData();
        if (user) fetchLaporan();
    }, [user, isAdmin]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        
        if (!formData.id_unit) return setError("Silakan pilih Unit Kerja.");

        // KONVERSI DATA KE FORMAT ANGKA SISTEM SEBELUM SUBMIT
        const dataToSend = {
            tanggal: formData.tanggal,
            id_unit: formData.id_unit,
            id_laporan: formData.id_laporan,
            ton_muat: parseValue(formData.ton_muat),
            target: parseValue(formData.target),
            target_rkp: parseValue(formData.target_rkp),
        };

        try {
            if (isEditMode) { 
                await axios.put(`${API_URL}/api/${REPORT_API}/${formData.id_laporan}`, dataToSend);
                setSuccessMessage('Laporan berhasil diperbarui!');
            } else { 
                await axios.post(`${API_URL}/api/${REPORT_API}`, dataToSend);
                setSuccessMessage('Laporan berhasil ditambahkan!');
            }
            setFormData(initialFormData);
            setIsEditMode(false);
            fetchLaporan(); 
        } catch (error) {
            setError(error.response?.data?.message || 'Gagal menyimpan laporan.');
        }
    };

    const handleDelete = async (id_laporan) => {
        if (window.confirm('Anda yakin ingin menghapus laporan ini?')) {
            try {
                await axios.delete(`${API_URL}/api/${REPORT_API}/${id_laporan}`);
                setSuccessMessage('Laporan berhasil dihapus.');
                fetchLaporan();
            } catch (error) {
                setError('Gagal menghapus laporan.');
            }
        }
    };

    const getUnitName = (id) => units.find(u => u.id_unit.toString() === id.toString())?.nama_unit || 'N/A';

    // Komponen Input Reusable mendukung Koma
    const renderInput = (name, label, type = 'text', disabled = false) => (
        <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input 
                type={type} 
                inputMode={type === 'text' ? 'decimal' : undefined}
                name={name} 
                value={formData[name]} 
                onChange={handleChange} 
                className="p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" 
                required
                disabled={disabled}
                placeholder={type === 'text' ? "0,00" : ""}
            />
        </div>
    );
    
    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-2">
                {isEditMode ? '🛠️ Edit Laporan Packing Plant' : `➕ Input Harian ${PAGE_GROUP_NAME}`}
            </h1>
            
            {successMessage && <div className="bg-green-100 border-green-400 text-green-700 px-4 py-3 rounded mb-4">{successMessage}</div>}
            {error && <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

            <div className="bg-white p-6 rounded-xl shadow-lg mb-10 border border-gray-200">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {renderInput('tanggal', 'Tanggal', 'date', isEditMode)}
                        
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
                        
                        {renderInput('ton_muat', 'Ton Muat (Ton)')}
                        {renderInput('target', 'Target Harian (Ton)')}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-blue-700 mb-4 border-t pt-4">Target RKAP</h3>
                    <div className="grid grid-cols-1 md:w-1/4 gap-4 mb-6">
                        {renderInput('target_rkp', 'Target RKAP Bulanan (Ton)')}
                    </div>

                    <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 mb-6">
                        <p className="font-semibold text-gray-700">Pratinjau Angka:</p>
                        <p className="text-2xl font-bold text-blue-800">{tonMuatTercatat.toLocaleString('id-ID')} TON</p>
                    </div>

                    <div className="flex space-x-4 justify-end">
                        {isEditMode ? (
                            <>
                                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">Simpan Perubahan</button>
                                <button type="button" onClick={handleCancelEdit} className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition">Batal Edit</button>
                            </>
                        ) : (
                            <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">Tambah Laporan</button>
                        )}
                    </div>
                </form>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Daftar Laporan Packing Plant</h2>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-4 p-4 border rounded-md bg-gray-50">
                    <select value={filterUnitId} onChange={(e) => setFilterUnitId(e.target.value)} className="p-2 border rounded-md flex-1">
                        <option value="">-- Semua Unit --</option>
                        {units.map(unit => <option key={unit.id_unit} value={unit.id_unit}>{unit.nama_unit}</option>)}
                    </select>
                    <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="p-2 border rounded-md flex-1" />
                    <button onClick={exportToCSV} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center justify-center">
                        CSV ⬇️
                    </button>
                </div>

                {isLoading ? <p>Memuat...</p> : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-6 py-3 text-left">Tanggal</th>
                                    <th className="px-6 py-3 text-left">Unit Kerja</th>
                                    <th className="px-6 py-3 text-center">Target Harian</th>
                                    <th className="px-6 py-3 text-center">Ton Muat</th>
                                    <th className="px-6 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                {filteredLaporan.map((item) => (
                                    <tr key={item.id_laporan} className="hover:bg-yellow-50/50">
                                        <td className="px-6 py-4">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td className="px-6 py-4 font-medium">{getUnitName(item.id_unit)}</td>
                                        <td className="px-6 py-4 text-center">{parseFloat(item.target).toLocaleString('id-ID')}</td>
                                        <td className={`px-6 py-4 text-center font-bold ${parseFloat(item.ton_muat) >= parseFloat(item.target) ? 'text-green-600' : 'text-red-600'}`}>
                                            {parseFloat(item.ton_muat).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-center space-x-2">
                                            <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline">Edit</button>
                                            <button onClick={() => handleDelete(item.id_laporan)} className="text-red-600 hover:underline">Hapus</button>
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