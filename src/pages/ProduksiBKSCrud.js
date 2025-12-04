// src/pages/ProduksiBKSCrud.js

import React from 'react';
import CrudPage from './CrudPage';

// UnitGroup 'bks' didefinisikan di App.js dan akan difilter di CrudPage
const ProduksiBKSCrud = () => {
    return (
        <CrudPage unitGroup="bks" />
    );
};

export default ProduksiBKSCrud;