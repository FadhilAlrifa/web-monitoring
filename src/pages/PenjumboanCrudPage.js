import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL;
const PAGE_GROUP_NAME = 'Penjumboan';
const REPORT_API = 'penjumboan/laporan';

const initialFormData = {
    tanggal: new Date().toISOString().split('T')[0],
    id_unit: '',
    shift_1_ton: '', 
    shift_2_ton: '', 
    shift_3_ton: '', 
    total_ton: '',   
    target: '650',
    id_laporan: null,
};

const PenjumboanCrudPage = () => {
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

    const parseValue = (val) => {
        if (!val) return 0;
        const cleaned = val.toString().replace(',', '.');
        return parseFloat(cleaned) || 0;
    };

    const selectedUnitName = useMemo(() => {
        return units.find(u => u.id_unit.toString() === formData.id_unit.toString())?.nama_unit || '';
    }, [formData.id_unit, units]);
    
    const isTotalPolysling = selectedUnitName === 'Total Polysling';

    const totalProduksiDisplay = useMemo(() => {
        if (isTotalPolysling) {
            return parseValue(formData.total_ton);
        } else {
            return parseValue(formData.shift_1_ton) +
                   parseValue(formData.shift_2_ton) +
                   parseValue(formData.shift_3_ton);
        }
    }, [formData, isTotalPolysling]);

    const filteredLaporan = useMemo(() => {
        if (!laporan || units.length === 0) return [];
        
        let filtered = [...laporan];
        
        const validUnitIds = new Set(units.map(u => u.id_unit.toString()));
        filtered = filtered.filter(item => validUnitIds.has(item.id_unit.toString()));

        if (filterUnitId) {
            filtered = filtered.filter(item => item.id_unit.toString() === filterUnitId.toString());
        }
        if (filterDate) {
            filtered = filtered.filter(item => item.tanggal.split('T')[0] === filterDate);
        }
        return filtered;
    }, [laporan, filterUnitId, filterDate, units]);

    const exportToCSV = () => {
        if (filteredLaporan.length === 0) return alert("Tidak ada data untuk diekspor.");
        
        const headers = ["Tanggal", "Unit Kerja", "Target (Ton)", "S1", "S2", "S3", "Total Produksi"];
        const csvRows = filteredLaporan.map(item => {
            const unitName = units.find(u => u.id_unit.toString() === item.id_unit.toString())?.nama_unit || 'N/A';
            const isTotalType = unitName === 'Total Polysling';

            return [
                `"${new Date(item.tanggal).toLocaleDateString('en-GB')}"`,
                `"${unitName}"`,
                item.target,
                isTotalType ? 0 : item.shift_1_ton,
                isTotalType ? 0 : item.shift_2_ton,
                isTotalType ? 0 : item.shift_3_ton,
                item.total_produksi
            ].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `Laporan_Penjumboan_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.endsWith('_ton') || name === 'target' || name === 'total_ton') {
            const regex = /^[0-9.,]*$/;
            if (value === '' || regex.test(value)) {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!formData.id_unit) return setError("Silakan pilih Unit Kerja.");

        // PERBAIKAN LOGIKA PAYLOAD:
        // Jika Total Polysling, kita masukkan nilainya ke shift_1_ton agar tersimpan di DB
        const payload = {
            tanggal: formData.tanggal,
            id_unit: formData.id_unit,
            target: parseValue(formData.target),
            shift_1_ton: isTotalPolysling ? parseValue(formData.total_ton) : parseValue(formData.shift_1_ton),
            shift_2_ton: isTotalPolysling ? 0 : parseValue(formData.shift_2_ton),
            shift_3_ton: isTotalPolysling ? 0 : parseValue(formData.shift_3_ton),
            // Tetap kirim total_produksi sebagai cadangan jika backend sudah diupdate
            total_produksi: totalProduksiDisplay, 
        };

        try {
            if (isEditMode) {
                await axios.put(`${API_URL}/api/${REPORT_API}/${formData.id_laporan}`, payload);
                setSuccessMessage('Laporan diperbarui!');
            } else {
                await axios.post(`${API_URL}/api/${REPORT_API}`, payload);
                setSuccessMessage('Laporan ditambahkan!');
            }
            setFormData(initialFormData);
            setIsEditMode(false);
            fetchLaporan();
        } catch (error) {
            setError(error.response?.data?.message || 'Gagal menyimpan laporan.');
        }
    };

    const handleEdit = (item) => {
        const uName = getUnitName(item.id_unit);
        const isTotal = uName === 'Total Polysling';

        setFormData({
            ...item,
            tanggal: item.tanggal.split('T')[0],
            id_unit: item.id_unit.toString(),
            shift_1_ton: isTotal ? '' : item.shift_1_ton.toString().replace('.', ','),
            shift_2_ton: isTotal ? '' : item.shift_2_ton.toString().replace('.', ','),
            shift_3_ton: isTotal ? '' : item.shift_3_ton.toString().replace('.', ','),
            // Ambil nilai dari shift_1_ton atau total_produksi untuk dimasukkan ke field input manual
            total_ton: isTotal ? (item.total_produksi || item.shift_1_ton).toString().replace('.', ',') : '',
            target: item.target.toString().replace('.', ','),
        });
        setIsEditMode(true);
        window.scrollTo(0, 0);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Hapus laporan ini?')) {
            try {
                await axios.delete(`${API_URL}/api/${REPORT_API}/${id}`);
                setSuccessMessage('Laporan dihapus.');
                fetchLaporan();
            } catch (err) { setError('Gagal menghapus.'); }
        }
    };

    const getUnitName = (id) => units.find(u => u.id_unit.toString() === id.toString())?.nama_unit || 'N/A';

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-2">
                {isEditMode ? '🛠️ Edit Laporan Penjumboan' : `➕ Input Harian ${PAGE_GROUP_NAME}`}
            </h1>

            {successMessage && <div className="bg-green-100 border-green-400 text-green-700 px-4 py-3 rounded mb-4">{successMessage}</div>}
            {error && <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

            <div className="bg-white p-6 rounded-xl shadow-lg mb-10 border border-gray-200">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                            <input type="date" name="tanggal" value={formData.tanggal} onChange={handleChange} required className="p-2 border rounded-md" disabled={isEditMode} />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Unit Kerja</label>
                            <select name="id_unit" value={formData.id_unit.toString()} onChange={handleChange} required className="p-2 border rounded-md" disabled={isEditMode}>
                                <option value="" disabled>Pilih Unit</option>
                                {units.map(u => <option key={u.id_unit} value={u.id_unit.toString()}>{u.nama_unit}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Target Harian (Ton)</label>
                            <input type="text" inputMode="decimal" name="target" value={formData.target} onChange={handleChange} placeholder="0,00" className="p-2 border rounded-md" required />
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold text-blue-700 mb-4 border-t pt-4">
                        {isTotalPolysling ? 'Input Total Produksi Langsung' : 'Input Produksi Per Shift'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {isTotalPolysling ? (
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-1">Total Produksi (Ton)</label>
                                <input type="text" inputMode="decimal" name="total_ton" value={formData.total_ton} onChange={handleChange} placeholder="0,00" className="p-2 border rounded-md focus:ring-blue-500" required />
                            </div>
                        ) : (
                            ['1','2','3'].map(num => (
                                <div key={num} className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700 mb-1">Shift {num} (Ton)</label>
                                    <input type="text" inputMode="decimal" name={`shift_${num}_ton`} value={formData[`shift_${num}_ton`]} onChange={handleChange} placeholder="0,00" className="p-2 border rounded-md focus:ring-blue-500" />
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 mb-6">
                        <p className="font-semibold text-gray-700">Total Produksi Tercatat:</p>
                        <p className={`text-2xl font-bold ${totalProduksiDisplay >= parseValue(formData.target) ? 'text-green-800' : 'text-red-800'}`}>
                            {totalProduksiDisplay.toLocaleString('id-ID')} TON
                        </p>
                    </div>

                    <div className="flex space-x-4 justify-end">
                        {isEditMode ? (
                            <>
                                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Simpan Perubahan</button>
                                <button type="button" onClick={() => {setFormData(initialFormData); setIsEditMode(false);}} className="bg-gray-400 text-white px-6 py-2 rounded-lg">Batal</button>
                            </>
                        ) : (
                            <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">Tambah Laporan</button>
                        )}
                    </div>
                </form>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <select value={filterUnitId} onChange={(e) => setFilterUnitId(e.target.value)} className="p-2 border rounded-md flex-1">
                        <option value="">-- Semua Unit --</option>
                        {units.map(unit => <option key={unit.id_unit} value={unit.id_unit.toString()}>{unit.nama_unit}</option>)}
                    </select>
                    <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="p-2 border rounded-md flex-1" />
                    <button onClick={exportToCSV} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center justify-center">
                        Download Document
                    </button>
                </div>

                {isLoading ? <p className="text-center text-blue-600">Memuat data...</p> : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">S1</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">S2</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">S3</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredLaporan.map((item) => {
                                    const uName = getUnitName(item.id_unit);
                                    const isTotalType = uName === 'Total Polysling';
                                    return (
                                        <tr key={item.id_laporan} className="hover:bg-gray-50 text-sm">
                                            <td className="px-4 py-4">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            <td className="px-4 py-4 font-medium text-blue-700">{uName}</td>
                                            <td className="px-4 py-4 text-center text-gray-500">{isTotalType ? '-' : parseFloat(item.shift_1_ton).toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-4 text-center text-gray-500">{isTotalType ? '-' : parseFloat(item.shift_2_ton).toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-4 text-center text-gray-500">{isTotalType ? '-' : parseFloat(item.shift_3_ton).toLocaleString('id-ID')}</td>
                                            <td className={`px-4 py-4 text-center font-bold ${parseFloat(item.total_produksi) >= parseFloat(item.target) ? 'text-green-600' : 'text-red-600'}`}>
                                                {parseFloat(item.total_produksi).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-4 text-center space-x-2">
                                                <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline">Edit</button>
                                                <button onClick={() => handleDelete(item.id_laporan)} className="text-red-600 hover:underline">Hapus</button>
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