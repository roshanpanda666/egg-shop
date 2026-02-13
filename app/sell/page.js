"use client";

import { useState, useEffect } from "react";

export default function SellPage() {
  const [sales, setSales] = useState([]);
  const [currentStockEggs, setCurrentStockEggs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [defaultEggsPerCrate, setDefaultEggsPerCrate] = useState(30);
  const [form, setForm] = useState({
    cratesSold: "",
    crateSalePrice: "",
    individualEggs: "",
    eggSalePrice: "",
    eggsPerCrate: "30",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchSales();
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
        setForm((f) => ({ ...f, eggsPerCrate: String(data.data.eggsPerCrate) }));
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  }

  async function fetchSales() {
    try {
      const res = await fetch("/api/sell");
      const data = await res.json();
      if (data.success) {
        setSales(data.data);
        setCurrentStockEggs(data.currentStockEggs);
      }
    } catch (err) {
      console.error("Failed to fetch sales:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        setToast({ type: "success", message: `Sale recorded successfully!` });
        setForm({
          cratesSold: "",
          crateSalePrice: "",
          individualEggs: "",
          eggSalePrice: "",
          eggsPerCrate: String(defaultEggsPerCrate),
          date: new Date().toISOString().split("T")[0],
        });
        fetchSales();
      } else {
        setToast({ type: "error", message: data.error || "Something went wrong" });
      }
    } catch (err) {
      setToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
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
  const stockCrates = Math.floor(currentStockEggs / epc);
  
  // Calculate preview
  const crates = Number(form.cratesSold) || 0;
  const looseEggs = Number(form.individualEggs) || 0;
  
  const totalEggsToSell = (crates * epc) + looseEggs;
  
  const crateRevenue = crates * (Number(form.crateSalePrice) || 0);
  const looseEggRevenue = looseEggs * (Number(form.eggSalePrice) || 0);
  const totalRevenue = crateRevenue + looseEggRevenue;

  const effectivePricePerEgg = totalEggsToSell > 0 ? totalRevenue / totalEggsToSell : 0;

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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-300 via-teal-400 to-emerald-300 bg-clip-text text-transparent tracking-tight">
          💰 Sell Eggs
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Record crate and individual egg sales
        </p>
      </div>

      {/* Stock Indicator */}
      <div className="w-full max-w-lg mb-8">
        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/20 overflow-hidden">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                Current Stock
              </p>
              <p className="text-3xl font-bold text-white">
                {loading ? "..." : `${currentStockEggs} eggs`}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {loading ? "" : `≈ ${stockCrates} crates (at ${epc} eggs/crate)`}
              </p>
            </div>
            <div className={`text-5xl ${currentStockEggs > 100 ? "opacity-100" : currentStockEggs > 30 ? "opacity-70" : "opacity-40"}`}>
              🥚
            </div>
          </div>
          {!loading && currentStockEggs <= 30 && currentStockEggs > 0 && (
            <p className="relative text-xs text-amber-400 mt-3 flex items-center gap-1">
              ⚠️ Stock is running low!
            </p>
          )}
          {!loading && currentStockEggs === 0 && (
            <p className="relative text-xs text-red-400 mt-3 flex items-center gap-1">
              ✕ No stock available
            </p>
          )}
        </div>
      </div>

      {/* Sell Form */}
      <div className="w-full max-w-lg mb-12">
        <form
          onSubmit={handleSubmit}
          className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/20"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none" />

          <h2 className="text-lg font-semibold text-white/90 mb-6 relative">
            Record Sale
          </h2>

          <div className="space-y-5 relative">
            
            {/* Crate Sales Section */}
            <div className="space-y-4 pb-4 border-b border-white/10">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Crate Sales</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Crates to Sell */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                    Crates
                  </label>
                  <input
                    type="number"
                    min="0"
                    
                    value={form.cratesSold}
                    onChange={(e) => setForm({ ...form, cratesSold: e.target.value })}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                  />
                </div>

                {/* Sale Price per Crate */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                    Price / Crate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    
                    value={form.crateSalePrice}
                    onChange={(e) => setForm({ ...form, crateSalePrice: e.target.value })}
                    placeholder="210.00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Individual Eggs Sales Section */}
            <div className="space-y-4 pb-4 border-b border-white/10">
              <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Individual Eggs</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Loose Eggs */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                    Loose Eggs
                  </label>
                  <input
                    type="number"
                    min="0"
                    
                    value={form.individualEggs}
                    onChange={(e) => setForm({ ...form, individualEggs: e.target.value })}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-200"
                  />
                </div>

                {/* Price per Egg */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                    Price / Egg (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    
                    value={form.eggSalePrice}
                    onChange={(e) => setForm({ ...form, eggSalePrice: e.target.value })}
                    placeholder="7.00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Eggs per Crate Config */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Eggs Per Crate Config
              </label>
              <input
                type="number"
                min="1"
                required
                value={form.eggsPerCrate}
                onChange={(e) => setForm({ ...form, eggsPerCrate: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
              />
            </div>

            {/* Live Calculation Preview */}
            {(crates > 0 || looseEggs > 0) && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-4 space-y-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Sale Preview</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Total Eggs</p>
                    <p className="text-lg font-bold text-emerald-400">{totalEggsToSell}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Avg / Egg</p>
                    <p className="text-lg font-bold text-emerald-400">₹{effectivePricePerEgg.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total Revenue</p>
                    <p className="text-lg font-bold text-emerald-400">₹{totalRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Date
              </label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 [color-scheme:dark]"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || currentStockEggs <= 0 || (crates === 0 && looseEggs === 0)}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold py-3 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                "Record Sale"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Sales History */}
      <div className="w-full max-w-5xl">
        <h2 className="text-lg font-semibold text-white/90 mb-4">
          Sales History
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-6 w-6 text-emerald-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
            <p className="text-slate-500 text-sm">No sales yet. Record your first sale above!</p>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/20 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-4">Date</th>
                  <th className="text-left text-xs font-medium text-emerald-400 uppercase tracking-wider px-4 py-4">Crates</th>
                  <th className="text-left text-xs font-medium text-teal-400 uppercase tracking-wider px-4 py-4">Loose Eggs</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-4">Total Quantity</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-4">Avg Price/Egg</th>
                  <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-4">Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, i) => {
                  const sepc = sale.eggsPerCrate || 30;
                  const crates = sale.cratesSold || 0;
                  const loose = sale.individualEggs || 0;
                  
                  const crateRev = crates * (sale.crateSalePrice || 0);
                  const looseRev = loose * (sale.eggSalePrice || 0);
                  const totalRev = crateRev + looseRev;
                  
                  const totalEggsCount = (crates * sepc) + loose;
                  const avgPrice = totalEggsCount > 0 ? totalRev / totalEggsCount : 0;
                  
                  return (
                    <tr
                      key={sale._id}
                      className={`border-b border-white/10 hover:bg-white/5 transition-colors duration-150 ${
                        i % 2 === 0 ? "bg-white/[0.02]" : ""
                      }`}
                    >
                      <td className="px-4 py-4 text-sm text-slate-300">{formatDate(sale.date)}</td>
                      <td className="px-4 py-4 text-sm text-emerald-300">
                        {crates > 0 ? (
                          <span>
                            {crates} <span className="text-slate-500 text-xs">(@ ₹{sale.crateSalePrice})</span>
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-teal-300">
                         {loose > 0 ? (
                          <span>
                            {loose} <span className="text-slate-500 text-xs">(@ ₹{sale.eggSalePrice})</span>
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-300">{totalEggsCount} eggs</td>
                      <td className="px-4 py-4 text-sm text-slate-400 font-medium">₹{avgPrice.toFixed(2)}</td>
                      <td className="px-4 py-4 text-sm text-emerald-400 font-bold text-right">₹{totalRev.toFixed(2)}</td>
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
