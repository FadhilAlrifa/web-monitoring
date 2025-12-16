// src/contexts/AuthContext.js

import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Mengambil URL API dari Environment Variable
const API_URL = process.env.REACT_APP_API_URL;

// Waktu maksimum user boleh idle sebelum logout (20 menit dalam milidetik)
const IDLE_TIMEOUT_MS = 20 * 60 * 1000; 

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); 
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    // Menggunakan useRef untuk menyimpan ID timer, menghindari re-render
    const activityTimerRef = useRef(null);

    // =========================================================
    // FUNGSI LOGOUT (DIBUNGKUS useCallback)
    // =========================================================
    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
        
        // Hentikan timer saat logout
        if (activityTimerRef.current) {
            clearTimeout(activityTimerRef.current);
            activityTimerRef.current = null;
        }
    }, []); // Dependency kosong karena tidak bergantung pada state yang berubah

    // =========================================================
    // FUNGSI RESET TIMER (DIBUNGKUS useCallback)
    // =========================================================
    const resetTimer = useCallback(() => {
        // 1. Hapus timer lama jika ada
        if (activityTimerRef.current) {
            clearTimeout(activityTimerRef.current);
        }

        // 2. Set timer baru hanya jika user sedang login (token tersedia)
        if (token) {
            activityTimerRef.current = setTimeout(() => {
                console.log("User idle, logging out automatically...");
                // Panggil fungsi logout setelah batas waktu tercapai
                handleLogout(); 
                alert("Sesi Anda telah berakhir karena tidak ada aktivitas (Idle Timeout). Silakan login kembali."); 
            }, IDLE_TIMEOUT_MS);
        }
    }, [token, handleLogout]); 
    
    // =========================================================
    // LOGIC AUTO-LOGOUT / SESSION TIMEOUT EFFECT
    // =========================================================
    
    useEffect(() => {
        // Daftarkan event yang dianggap sebagai aktivitas
        const events = ['mousemove', 'mousedown', 'click', 'scroll', 'keypress'];

        const handleActivity = () => {
            resetTimer();
        };

        // Pasang event listeners jika user sedang login
        if (token) {
            events.forEach(event => {
                window.addEventListener(event, handleActivity);
            });
            // Mulai timer saat token terdeteksi
            resetTimer(); 
        } else {
             // Bersihkan timer jika token hilang
             if (activityTimerRef.current) {
                clearTimeout(activityTimerRef.current);
                activityTimerRef.current = null;
             }
        }
        
        // Cleanup function: Hapus event listeners dan timer saat unmount/state berubah
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            // Cleanup final, memastikan timer tidak berjalan setelah unmount
            if (activityTimerRef.current) {
                clearTimeout(activityTimerRef.current);
            }
        };
    }, [token, resetTimer]); 
    
    // =========================================================
    // LOAD STATE DARI TOKEN SAAT APLIKASI DIMULAI
    // =========================================================
    
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            try {
                // Ambil payload dari JWT
                const payload = JSON.parse(atob(token.split('.')[1]));
                
                // Cek masa kedaluwarsa token
                if (payload.exp * 1000 < Date.now()) {
                    console.log("Token expired during load.");
                    handleLogout();
                } else {
                    // Set user jika token masih valid
                    setUser({ 
                        id: payload.id, 
                        username: payload.username, 
                        role: payload.role,
                        allowed_groups: payload.allowed_groups 
                    });
                }
            } catch (error) {
                console.error("Token decode error:", error);
                handleLogout(); 
            }
        }
        setIsLoading(false);
    }, [token, handleLogout]); 

    // =========================================================
    // FUNGSI LOGIN
    // =========================================================
    
    const handleLogin = async (username, password) => {
        try {
            // Memastikan API_URL terpasang
            const response = await axios.post(`${API_URL}/api/auth/login`, { username, password }); 
            
            const newToken = response.data.token;
            const userData = response.data.user;

            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(userData);
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

            // PENTING: Mulai timer setelah login berhasil
            resetTimer(); 

            return { success: true };
        } catch (error) {
            console.error("Login Error:", error);
            return { success: false, message: error.response?.data?.message || 'Login gagal. Periksa koneksi API.' };
        }
    };

    const value = {
        user,
        token,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        isAdmin: user && (user.role === 'superuser' || user.role === 'admin' || user.role === 'entry_admin') 
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};