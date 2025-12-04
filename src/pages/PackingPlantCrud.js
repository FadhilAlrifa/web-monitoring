import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const API_URL = process.env.REACT_APP_API_URL;
const REPORT_API = "packing-plant";

const initialFormData = {
  tanggal: new Date().toISOString().split("T")[0],
  id_unit: "",

  produksi_s1: 0,
  produksi_s2: 0,
  produksi_s3: 0,
  produksi_ton: 0,

  jam_operasi: 0,
  h_proses: 0,
  h_listrik: 0,
  h_mekanik: 0,
  h_operator: 0,
  h_hujan: 0,
  h_kapal: 0,
  h_pmc: 0,

  id_laporan: null,
};

const formatDateInput = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return `${date.getUTCFullYear()}-${String(
    date.getUTCMonth() + 1
  ).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
};

const PackingPlantCrud = () => {
  const { user, isAdmin } = useAuth();

  const [units, setUnits] = useState([]);
  const [laporan, setLaporan] = useState([]);
  const [formData, setFormData] = useState(initialFormData);

  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  const [filterUnitId, setFilterUnitId] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // ============================
  // ✅ HITUNGAN OTOMATIS
  // ============================
  const totalHambatan =
    parseFloat(formData.h_proses || 0) +
    parseFloat(formData.h_listrik || 0) +
    parseFloat(formData.h_mekanik || 0) +
    parseFloat(formData.h_operator || 0) +
    parseFloat(formData.h_hujan || 0) +
    parseFloat(formData.h_kapal || 0) +
    parseFloat(formData.h_pmc || 0);

  const totalProduksi =
    parseFloat(formData.produksi_s1 || 0) +
    parseFloat(formData.produksi_s2 || 0) +
    parseFloat(formData.produksi_s3 || 0);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      produksi_ton: totalProduksi,
    }));
  }, [formData.produksi_s1, formData.produksi_s2, formData.produksi_s3]);

  // ============================
  // ✅ FILTER DATA
  // ============================
  const filteredLaporan = useMemo(() => {
    let filtered = laporan;
    if (filterUnitId)
      filtered = filtered.filter(
        (l) => l.id_unit.toString() === filterUnitId
      );
    if (filterDate)
      filtered = filtered.filter(
        (l) => l.tanggal.split("T")[0] === filterDate
      );
    return filtered;
  }, [laporan, filterUnitId, filterDate]);

  // ============================
  // ✅ CSV EXPORT
  // ============================
  const exportToCSV = () => {
    if (filteredLaporan.length === 0) {
      return alert("Tidak ada data untuk diekspor.");
    }

    const headers = [
      "Tanggal",
      "Unit",
      "Produksi (Ton)",
      "Jam Operasi",
      "Total Hambatan",
    ];

    const rows = filteredLaporan.map((item) => {
      const date = new Date(item.tanggal).toLocaleDateString("en-GB");
      return [
        `"${date}"`,
        `"${getUnitName(item.id_unit)}"`,
        item.produksi_ton,
        item.jam_operasi,
        item.total_hambatan,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `PackingPlant_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ============================
  // ✅ HANDLER
  // ============================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: isNaN(value) ? value : parseFloat(value),
    }));
  };

  const handleEdit = (data) => {
    setFormData({
      ...data,
      tanggal: formatDateInput(data.tanggal),
      id_unit: data.id_unit.toString(),
    });
    setIsEditMode(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus data ini?")) return;
    await axios.delete(`${API_URL}/api/${REPORT_API}/${id}`);
    fetchLaporan();
  };

  // ============================
  // ✅ FETCH DATA
  // ============================
  const fetchUnits = async () => {
    const res = await axios.get(`${API_URL}/api/units`);
    const filtered = res.data.filter((u) => u.group_name === "Packing Plant");
    setUnits(filtered);
  };

  const fetchLaporan = async () => {
    const res = await axios.get(`${API_URL}/api/${REPORT_API}/all`);
    setLaporan(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchUnits();
      fetchLaporan();
    }
  }, [user]);

  const getUnitName = (id) =>
    units.find((u) => u.id_unit.toString() === id.toString())?.nama_unit || "-";

  // ============================
  // ✅ RENDER INPUT
  // ============================
  const renderInput = (label, name) => (
    <div className="flex flex-col">
      <label className="text-sm mb-1">{label}</label>
      <input
        type="number"
        name={name}
        value={formData[name]}
        onChange={handleChange}
        className="p-2 border rounded"
        min="0"
      />
    </div>
  );

  // ============================
  // ✅ UI = SAMA DENGAN CRUDPAGE
  // ============================
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {successMessage && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* ✅ FORM */}
      <div className="bg-white p-8 rounded-2xl shadow-xl mb-10">
        <h2 className="text-2xl font-extrabold mb-6">
          {isEditMode
            ? "✏️ Edit Produksi Packing Plant"
            : "➕ Input Produksi Packing Plant"}
        </h2>

        <form className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <input
              type="date"
              name="tanggal"
              value={formData.tanggal}
              onChange={handleChange}
              className="p-2 border rounded"
              disabled={isEditMode}
            />

            <select
              name="id_unit"
              value={formData.id_unit}
              onChange={handleChange}
              className="p-2 border rounded"
              disabled={isEditMode}
            >
              <option value="">-- Pilih Unit --</option>
              {units.map((u) => (
                <option key={u.id_unit} value={u.id_unit}>
                  {u.nama_unit}
                </option>
              ))}
            </select>

            {renderInput("Jam Operasi", "jam_operasi")}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {renderInput("Shift 1", "produksi_s1")}
            {renderInput("Shift 2", "produksi_s2")}
            {renderInput("Shift 3", "produksi_s3")}
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button className="bg-blue-600 text-white px-6 py-2 rounded">
              {isEditMode ? "Update" : "Simpan"}
            </button>
          </div>
        </form>
      </div>

      {/* ✅ TABLE */}
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between mb-4">
          <h2 className="font-bold text-lg">Data Packing Plant</h2>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Download CSV
          </button>
        </div>

        <table className="min-w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Tanggal</th>
              <th className="border p-2">Unit</th>
              <th className="border p-2">Produksi</th>
              <th className="border p-2">Jam Operasi</th>
              <th className="border p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredLaporan.map((l) => (
              <tr key={l.id_laporan}>
                <td className="border p-2">
                  {new Date(l.tanggal).toLocaleDateString("id-ID")}
                </td>
                <td className="border p-2">{getUnitName(l.id_unit)}</td>
                <td className="border p-2">{l.produksi_ton}</td>
                <td className="border p-2">{l.jam_operasi}</td>
                <td className="border p-2 text-center">
                  <button
                    onClick={() => handleEdit(l)}
                    className="text-blue-600 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(l.id_laporan)}
                    className="text-red-600"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PackingPlantCrud;
