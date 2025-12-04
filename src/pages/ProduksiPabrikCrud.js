// src/pages/ProduksiPabrikCrud.js

import React from 'react';
import CrudPage from './CrudPage';

/**
 * Wrapper component untuk Input/CRUD Produksi Pabrik.
 * Menginjeksi filter 'pabrik' ke komponen CrudPage.
 */
const ProduksiPabrikCrud = () => {
    return (
        <CrudPage unitGroup="pabrik" />
    );
};

export default ProduksiPabrikCrud;