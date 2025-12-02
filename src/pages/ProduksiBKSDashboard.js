// src/pages/ProduksiBKSDashboard.js

import React from 'react';
import DashboardPage from './DashboardPage';

// UnitGroup 'bks' didefinisikan di App.js dan akan difilter di DashboardPage
const ProduksiBKSDashboard = () => {
    return (
        <DashboardPage unitGroup="bks" />
    );
};

export default ProduksiBKSDashboard;