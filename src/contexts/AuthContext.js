// src/contexts/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = process.env.REACT_APP_API_URL;

// Hapus baris fetch yang tidak digunakan dan bisa menyebabkan error
// fetch(`${API_URL}/api`) 

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); 
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    // Atur default header Authorization untuk Axios
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            try {
                // Ambil payload dari JWT
                const payload = JSON.parse(atob(token.split('.')[1]));
                
                // Ambil SEMUA data penting (role dan allowed_groups)
                setUser({ 
                    id: payload.id, 
                    username: payload.username, 
                    role: payload.role,
                    allowed_groups: payload.allowed_groups 
                });
            } catch (error) {
                handleLogout(); 
            }
        }
        setIsLoading(false);
    }, [token]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    const handleLogin = async (username, password) => {
        try {
            // PERBAIKAN: Menambahkan awalan '/api' di sini
            const response = await axios.post(`${API_URL}/api/auth/login`, { username, password }); // <--- PERUBAHAN KRITIS
            
            const newToken = response.data.token;
            const userData = response.data.user;

            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(userData);
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

            return { success: true };
        } catch (error) {
            console.error("Login Error:", error);
            // Tangani error jika tidak ada response (misalnya, jaringan mati atau CORS)
            return { success: false, message: error.response?.data?.message || 'Login gagal. Periksa koneksi API.' };
        }
    };

    const value = {
        user,
        token,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        // PERBAIKAN: Memastikan 'entry_admin' diakui sebagai Admin yang bisa melewati AdminRoute
        isAdmin: user && (user.role === 'superuser' || user.role === 'admin' || user.role === 'entry_admin') 
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

};
