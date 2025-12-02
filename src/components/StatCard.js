import React from 'react';

const StatCard = ({ title, value, unit, icon }) => {
    
    // 1. Coba parse nilai menjadi float
    const numericValue = parseFloat(value);

    // 2. Jika nilai adalah NaN (atau null/undefined yang di-parse menjadi NaN), gunakan 0
    const finalValue = isNaN(numericValue) ? 0 : numericValue;

    // 3. Format nilai angka ribuan
    const formattedValue = finalValue.toLocaleString(undefined, {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
    });

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-600 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
                <h2 className="text-3xl font-bold text-gray-900 mt-1">
                    {formattedValue} 
                    <span className="text-lg font-normal text-gray-500 ml-1">{unit}</span>
                </h2>
            </div>
            <div className="text-blue-600 text-4xl">
                {icon}
            </div>
        </div>
    );
};

export default StatCard;