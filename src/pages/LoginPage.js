import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react'; // Import ikon mata

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // State untuk mengontrol visibilitas password
    const [loginError, setLoginError] = useState(null); // State untuk menampilkan error di UI
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginError(null); // Reset error
        
        const result = await login(username, password);
        
        if (result.success) {
            navigate('/');
        } else {
            // Gunakan state untuk menampilkan error di bawah form, bukan alert()
            setLoginError(result.message || 'Login gagal. Periksa koneksi API.');
        }
    };

    return (
        <div className="fixed top-0 left-0 h-screen w-screen grid grid-cols-1 md:grid-cols-2 overflow-hidden bg-gray-50">

            {/* LEFT LOGIN FORM */}
            <div className="flex flex-col justify-center items-center px-8 md:px-20 bg-white h-full">

                <img src="/logo-perusahaan.png" className="w-20 mb-3" alt="PT. Biringkassiraya" />

                <h1 className="text-3xl font-bold text-gray-900 text-center leading-tight">
                    Login Dashboard <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-red-600">
                        PT. Biringkassiraya
                    </span>
                </h1>

                <p className="text-gray-500 text-xs md:text-sm mt-1 mb-4 text-center">
                    Masukkan Username & Password untuk mengakses sistem.
                </p>

                <form onSubmit={handleSubmit} className="w-full max-w-sm mt-2 space-y-4">
                    {/* Username Field */}
                    <div>
                        <label className="text-sm font-semibold">Username</label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={(e)=>setUsername(e.target.value)}
                            placeholder="Masukkan Username..."
                            className="mt-1 w-full p-3 border rounded-md text-sm focus:ring-2 focus:ring-blue-600 transition"
                        />
                    </div>

                    {/* Password Field with Toggle */}
                    <div>
                        <label className="text-sm font-semibold">Password</label>
                        <div className="relative mt-1">
                            <input
                                // Tipe input berubah berdasarkan state showPassword
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e)=>setPassword(e.target.value)}
                                placeholder="********"
                                className="w-full p-3 border rounded-md text-sm pr-10 focus:ring-2 focus:ring-red-600 transition"
                            />
                            {/* Tombol Toggle Mata */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>
                    </div>
                    
                    {/* Error Message Display */}
                    {loginError && (
                        <div className="p-2 text-xs text-red-700 bg-red-100 border border-red-300 rounded-md">
                            {loginError}
                        </div>
                    )}

                    <div className="flex justify-between text-xs md:text-sm">
                        <label className="flex items-center gap-1 text-gray-600">
                            <input type="checkbox"/> Ingat saya
                        </label>
                        <span className="text-blue-600 hover:underline cursor-pointer">Lupa Password?</span>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 text-white font-semibold rounded-md
                        bg-gradient-to-r from-blue-600 to-red-600 shadow-lg hover:opacity-95 transition"
                    >
                        LOGIN
                    </button>
                </form>
            </div>

            {/* RIGHT PANEL (FULL & NO SCROLL) */}
            <div className="hidden md:flex items-center justify-center h-full 
                            bg-gradient-to-r from-blue-700 to-red-600 text-white shadow-inner">

                <div className="text-center px-8 max-w-md">
                    <h1 className="text-4xl font-extrabold">Selamat Datang</h1>
                    <h2 className="text-4xl font-black mt-1">PT. Biringkassi Raya</h2>
                    <p className="text-sm mt-4 opacity-90 leading-relaxed">
                        Sistem monitoring dan kontrol performa kerja berbasis digital
                        yang cepat, efektif, dan realtime.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default LoginPage;
