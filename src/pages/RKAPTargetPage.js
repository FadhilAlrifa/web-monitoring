import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL;

const RKAPTargetPage = () => {
    // Ambil data user dan status admin dari context
    const { user, isAdmin } = useAuth();
    const [year, setYear] = useState(new Date().getFullYear());
    const [groupName, setGroupName] = useState('Pabrik');
    const [monthlyTargets, setMonthlyTargets] = useState(Array(12).fill(''));
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    // Fetch data target (Bisa diakses siapapun untuk melihat)
    const fetchTargets = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/rkap/${year}/${groupName}`);
            const newTargets = Array(12).fill('');
            res.data.forEach(item => {
                // Ubah titik ke koma untuk tampilan lokal
                newTargets[item.bulan - 1] = item.target_ton.toString().replace('.', ',');
            });
            setMonthlyTargets(newTargets);
        } catch (error) {
            console.error("Gagal mengambil data RKAP", error);
            setMessage({ type: 'error', text: 'Gagal memuat data dari server.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTargets();
    }, [year, groupName]);

    const handleInputChange = (index, value) => {
        // Hanya izinkan angka dan koma
        const regex = /^[0-9,]*$/;
        if (value === '' || regex.test(value)) {
            const updated = [...monthlyTargets];
            updated[index] = value;
            setMonthlyTargets(updated);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isAdmin) return; // Proteksi tambahan di sisi client

        setMessage({ type: '', text: '' });
        setIsLoading(true);
        
        const payload = monthlyTargets.map((val, idx) => ({
            tahun: year,
            bulan: idx + 1,
            group_name: groupName,
            target_ton: parseFloat(val.toString().replace(',', '.')) || 0
        }));

        try {
            // Sertakan token otentikasi dari localStorage/state
            const token = localStorage.getItem('token'); 
            await axios.post(`${API_URL}/api/rkap/bulk-update`, 
                { targets: payload },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage({ type: 'success', text: `Target RKAP ${groupName} Tahun ${year} berhasil diperbarui!` });
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Gagal menyimpan target RKAP.';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border overflow-hidden">
                {/* Header */}
                <div className="bg-blue-600 p-6 text-white text-center relative">
                    <h1 className="text-2xl font-extrabold uppercase tracking-wider">🎯 Target RKAP Bulanan</h1>
                    <p className="text-blue-100 mt-1">Data target untuk perbandingan di grafik dashboard</p>
                    
                    {/* Badge Status Akses */}
                    {!isAdmin && (
                        <div className="absolute top-4 right-4 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded-md shadow-sm animate-pulse">
                            VIEW ONLY
                        </div>
                    )}
                </div>

                <form onSubmit={handleSave} className="p-6 md:p-10 space-y-8">
                    {/* Filter Atas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <div className="flex flex-col">
                            <label className="text-sm font-bold text-blue-800 mb-2 uppercase italic">Pilih Tahun</label>
                            <select 
                                value={year} 
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                className="p-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white transition font-bold"
                            >
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-bold text-blue-800 mb-2 uppercase italic">Kategori Produksi</label>
                            <select 
                                value={groupName} 
                                onChange={(e) => setGroupName(e.target.value)}
                                className="p-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white transition font-bold"
                            >
                                <option value="Pabrik">Pabrik (Global)</option>
                                <option value="BKS">BKS (Global)</option>
                                <option value="Pemuatan">Pemuatan</option>
                                <option value="Packing Plant">Packing Plant</option>
                            </select>
                        </div>
                    </div>

                    {message.text && (
                        <div className={`p-4 rounded-lg text-center font-bold animate-bounce ${
                            message.type === 'success' 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Grid Input Bulanan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {monthNames.map((name, index) => (
                            <div key={index} className={`flex flex-col p-4 border rounded-xl transition bg-white group ${!isAdmin ? 'border-gray-100 opacity-80' : 'hover:shadow-md border-gray-200'}`}>
                                <label className="text-xs font-black text-gray-500 uppercase mb-2 group-hover:text-blue-600">
                                    {name}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={monthlyTargets[index]}
                                        onChange={(e) => handleInputChange(index, e.target.value)}
                                        // LOCK INPUT JIKA BUKAN ADMIN
                                        disabled={!isAdmin} 
                                        className={`w-full p-3 border rounded-lg font-bold text-right pr-12 transition-all ${
                                            !isAdmin 
                                            ? 'bg-gray-100 border-transparent text-gray-400 cursor-not-allowed' 
                                            : 'bg-gray-50 border-gray-300 focus:border-blue-500 focus:bg-white text-gray-800'
                                        }`}
                                        placeholder="0"
                                    />
                                    <span className="absolute right-3 top-3 text-gray-400 font-medium">Ton</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* HANYA TAMPILKAN TOMBOL JIKA ADMIN */}
                    {isAdmin && (
                        <div className="pt-6 border-t border-dashed">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2 text-lg uppercase tracking-widest disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Proses Menyimpan...
                                    </span>
                                ) : "💾 Simpan Perubahan Target"}
                            </button>
                        </div>
                    )}
                </form>
                
                {/* Footer Info */}
                <div className="bg-gray-50 p-4 border-t text-center text-xs text-gray-400 italic">
                    * Perubahan target akan langsung berdampak pada tampilan garis target di dashboard rilis.
                </div>
            </div>
        </div>
    );
};

export default RKAPTargetPage;