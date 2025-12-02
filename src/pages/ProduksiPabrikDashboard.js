// src/pages/ProduksiPabrikDashboard.js

import React from 'react';
import DashboardPage from './DashboardPage';

/**
 * Wrapper component untuk Dashboard Produksi Pabrik.
 * Menginjeksi filter 'pabrik' ke komponen DashboardPage.
 */
const ProduksiPabrikDashboard = () => {
    return (
        <DashboardPage unitGroup="pabrik" />
    );
};

export default ProduksiPabrikDashboard;