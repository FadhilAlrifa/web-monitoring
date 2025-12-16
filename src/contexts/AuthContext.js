// src/contexts/AuthContext.js

import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = process.env.REACT_APP_API_URL;

// Waktu idle timeout (20 menit)
const IDLE_TIMEOUT_MS = 20 * 60 * 1000; 

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); 
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    const activityTimerRef = useRef(null);

    // =========================================================
    // FUNGSI LOGOUT
    // =========================================================
    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        // Hapus header Authorization dari Axios
        delete axios.defaults.headers.common['Authorization'];
        
        if (activityTimerRef.current) {
            clearTimeout(activityTimerRef.current);
            activityTimerRef.current = null;
        }
    }, []);

    // =========================================================
    // FUNGSI RESET TIMER (IDLE TIMEOUT)
    // =========================================================
    const resetTimer = useCallback(() => {
        if (activityTimerRef.current) {
            clearTimeout(activityTimerRef.current);
        }

        if (token) {
            activityTimerRef.current = setTimeout(() => {
                console.log("Sesi berakhir karena idle.");
                handleLogout(); 
                alert("Sesi Anda telah berakhir karena tidak ada aktivitas. Silakan login kembali."); 
            }, IDLE_TIMEOUT_MS);
        }
    }, [token, handleLogout]); 
    
    // =========================================================
    // EFFECT: DETEKSI AKTIVITAS USER
    // =========================================================
    useEffect(() => {
        const events = ['mousemove', 'mousedown', 'click', 'scroll', 'keypress'];

        const handleActivity = () => {
            resetTimer();
        };

        if (token) {
            events.forEach(event => {
                window.addEventListener(event, handleActivity);
            });
            resetTimer(); 
        }
        
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            if (activityTimerRef.current) {
                clearTimeout(activityTimerRef.current);
            }
        };
    }, [token, resetTimer]); 
    
    // =========================================================
    // EFFECT: LOAD USER DARI TOKEN SAAT REFRESH HALAMAN
    // =========================================================
    useEffect(() => {
        const loadStoredUser = () => {
            if (token) {
                // Pasang token ke Axios setiap kali aplikasi dimuat ulang
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    
                    // Cek masa berlaku token (exp dalam hitungan detik)
                    if (payload.exp * 1000 < Date.now()) {
                        handleLogout();
                    } else {
                        setUser({ 
                            id: payload.id, 
                            username: payload.username, 
                            role: payload.role,
                            allowed_groups: payload.allowed_groups 
                        });
                    }
                } catch (error) {
                    console.error("Token invalid:", error);
                    handleLogout(); 
                }
            }
            setIsLoading(false);
        };

        loadStoredUser();
    }, [token, handleLogout]); 

    // =========================================================
    // FUNGSI LOGIN
    // =========================================================
    const handleLogin = async (username, password) => {
        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, { username, password }); 
            
            const newToken = response.data.token;
            const userData = response.data.user;

            // Simpan ke localStorage & state
            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(userData);

            // Inject token ke Axios untuk request berikutnya (seperti simpan RKAP)
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

            resetTimer(); 
            return { success: true };
        } catch (error) {
            console.error("Login Error:", error);
            return { 
                success: false, 
                message: error.response?.data?.message || 'Gagal terhubung ke server.' 
            };
        }
    };

    // Global variable yang bisa diakses di semua komponen
    const value = {
        user,
        token,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        // Cek apakah user memiliki hak akses admin/superuser
        isAdmin: user && (
            user.role === 'superuser' || 
            user.role === 'admin' || 
            user.role === 'entry_admin'
        ) 
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};