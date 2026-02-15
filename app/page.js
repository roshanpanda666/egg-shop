"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [defaultEggsPerCrate, setDefaultEggsPerCrate] = useState(30);
  const [defaultCratesPerBox, setDefaultCratesPerBox] = useState(7);
  const [form, setForm] = useState({
    boxesGot: "",
    boxPrice: "",
    cratesPerBox: "7",
    cratePrice: "",
    cratesGot: "",
    eggsPerCrate: "30",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchEntries();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success) {
        setDefaultEggsPerCrate(data.data.eggsPerCrate);
        setDefaultCratesPerBox(data.data.cratesPerBox);
        setForm((f) => ({
          ...f,
          eggsPerCrate: String(data.data.eggsPerCrate),
          cratesPerBox: String(data.data.cratesPerBox),
        }));
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  }

  async function fetchEntries() {
    try {
      const res = await fetch("/api/eggs");
      const data = await res.json();
      if (data.success) setEntries(data.data);
    } catch (err) {
      console.error("Failed to fetch entries:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/eggs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        setToast({ type: "success", message: "Entry added successfully!" });
        setForm({
          boxesGot: "",
          boxPrice: "",
          cratesPerBox: String(defaultCratesPerBox),
          cratePrice: "",
          cratesGot: "",
          eggsPerCrate: String(defaultEggsPerCrate),
          date: new Date().toISOString().split("T")[0],
        });
        fetchEntries();
      } else {
        setToast({ type: "error", message: data.error || "Something went wrong" });
      }
    } catch (err) {
      setToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      const res = await fetch(`/api/eggs?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setToast({ type: "success", message: "Entry deleted!" });
        fetchEntries();
      } else {
        setToast({ type: "error", message: data.error || "Failed to delete" });
      }
    } catch (err) {
      setToast({ type: "error", message: "Network error" });
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const epc = Number(form.eggsPerCrate) || 1;
  const cpb = Number(form.cratesPerBox) || 1;

  // Box calculations
  const numBoxes = Number(form.boxesGot) || 0;
  const boxCrates = numBoxes * cpb;
  const boxEggs = boxCrates * epc;
  const boxTotalCost = numBoxes * (Number(form.boxPrice) || 0);

  // Crate calculations
  const numCrates = Number(form.cratesGot) || 0;
  const crateEggs = numCrates * epc;
  const crateTotalCost = numCrates * (Number(form.cratePrice) || 0);

  // Combined totals
  const totalEggs = boxEggs + crateEggs;
  const totalCost = boxTotalCost + crateTotalCost;
  const pricePerEgg = totalEggs > 0 ? totalCost / totalEggs : 0;

  const hasBoxInput = form.boxesGot && form.boxPrice;
  const hasCrateInput = form.cratePrice && form.cratesGot;
  const showPreview = hasBoxInput || hasCrateInput;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center px-4 py-10">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl transition-all duration-300 animate-slide-in ${
            toast.type === "success"
              ? "bg-emerald-500/90 text-white border border-emerald-400/30"
              : "bg-red-500/90 text-white border border-red-400/30"
          }`}
        >
          {toast.type === "success" ? "✓" : "✕"} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300 bg-clip-text text-transparent tracking-tight">
          📦 Stock Management
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Track your egg box and crate purchases
        </p>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-lg mb-12">
        <form
          onSubmit={handleSubmit}
          className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/20"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />

          <h2 className="text-lg font-semibold text-white/90 mb-6 relative">
            Add New Stock Entry
          </h2>

          <div className="space-y-5 relative">

            {/* Box Purchases */}
            <div className="space-y-4 pb-4 border-b border-white/10">
              <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">📦 Box Purchases</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                    Boxes Got
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.boxesGot}
                    onChange={(e) => setForm({ ...form, boxesGot: e.target.value })}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                    Box Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.boxPrice}
                    onChange={(e) => setForm({ ...form, boxPrice: e.target.value })}
                    placeholder="e.g. 1400.00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                  Crates Per Box
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.cratesPerBox}
                  onChange={(e) => setForm({ ...form, cratesPerBox: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200"
                />
                <p className="text-xs text-slate-500 mt-1">1 box = {cpb} crates × {epc} eggs = {cpb * epc} eggs</p>
              </div>
            </div>

            {/* Crate Purchases */}
            <div className="space-y-4 pb-4 border-b border-white/10">
              <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider">🗃️ Crate Purchases</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                    Crates Got
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.cratesGot}
                    onChange={(e) => setForm({ ...form, cratesGot: e.target.value })}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                    Crate Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.cratePrice}
                    onChange={(e) => setForm({ ...form, cratePrice: e.target.value })}
                    placeholder="e.g. 195.00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Eggs per Crate */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Eggs Per Crate
              </label>
              <input
                type="number"
                min="1"
                required
                value={form.eggsPerCrate}
                onChange={(e) => setForm({ ...form, eggsPerCrate: e.target.value })}
                placeholder="e.g. 30"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200"
              />
            </div>

            {/* Live Calculation Preview */}
            {showPreview && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-4 space-y-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Calculation Preview</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Total Eggs</p>
                    <p className="text-lg font-bold text-amber-400">{totalEggs}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Per Egg</p>
                    <p className="text-lg font-bold text-amber-400">₹{pricePerEgg.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total Cost</p>
                    <p className="text-lg font-bold text-amber-400">₹{totalCost.toFixed(2)}</p>
                  </div>
                </div>
                {numBoxes > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    📦 {numBoxes} box{numBoxes > 1 ? "es" : ""} = {boxCrates} crates = {boxEggs} eggs (₹{boxTotalCost.toFixed(2)})
                  </p>
                )}
                {numCrates > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    🗃️ {numCrates} crate{numCrates > 1 ? "s" : ""} = {crateEggs} eggs (₹{crateTotalCost.toFixed(2)})
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Date
              </label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200 [color-scheme:dark]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-semibold py-3 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                "Add Entry"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Entries Table */}
      <div className="w-full max-w-5xl">
        <h2 className="text-lg font-semibold text-white/90 mb-4">
          Recent Entries
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-6 w-6 text-amber-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
            <p className="text-slate-500 text-sm">No entries yet. Add your first one above!</p>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/20 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-4">Date</th>
                  <th className="text-left text-xs font-medium text-amber-400 uppercase tracking-wider px-4 py-4">Boxes</th>
                  <th className="text-left text-xs font-medium text-orange-400 uppercase tracking-wider px-4 py-4">Crates</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-4">Eggs/Crate</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-4">Total Eggs</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-4">Per Egg</th>
                  <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-4">Total</th>
                  <th className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const entryEpc = entry.eggsPerCrate || 30;
                  const entryCpb = entry.cratesPerBox || 7;
                  const entryBoxes = entry.boxesGot || 0;
                  const entryCrates = entry.cratesGot || 0;
                  const boxEggsRow = entryBoxes * entryCpb * entryEpc;
                  const crateEggsRow = entryCrates * entryEpc;
                  const totalEggsRow = boxEggsRow + crateEggsRow;
                  const boxCostRow = entryBoxes * (entry.boxPrice || 0);
                  const crateCostRow = entryCrates * (entry.cratePrice || 0);
                  const totalCostRow = boxCostRow + crateCostRow;
                  const perEggRow = totalEggsRow > 0 ? totalCostRow / totalEggsRow : 0;

                  return (
                    <tr
                      key={entry._id}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors duration-150 ${
                        i % 2 === 0 ? "bg-white/[0.02]" : ""
                      }`}
                    >
                      <td className="px-4 py-4 text-sm text-slate-300">{formatDate(entry.date)}</td>
                      <td className="px-4 py-4 text-sm text-amber-300">
                        {entryBoxes > 0 ? <span>{entryBoxes} <span className="text-slate-500 text-xs">(@ ₹{entry.boxPrice} · {entryCpb}cr/box)</span></span> : "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-orange-300">
                        {entryCrates > 0 ? <span>{entryCrates} <span className="text-slate-500 text-xs">(@ ₹{Number(entry.cratePrice).toFixed(2)})</span></span> : "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-300">{entryEpc}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{totalEggsRow}</td>
                      <td className="px-4 py-4 text-sm text-orange-400 font-medium">₹{perEggRow.toFixed(2)}</td>
                      <td className="px-4 py-4 text-sm text-emerald-400 font-medium text-right">₹{totalCostRow.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(entry._id)}
                          className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-all duration-200"
                          title="Delete entry"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
