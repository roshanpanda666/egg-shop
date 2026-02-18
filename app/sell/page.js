"use client";

import { useState, useEffect } from "react";

const PAYMENT_METHODS = [
  { value: "cash", label: "💵 Cash", color: "emerald" },
  { value: "gpay", label: "📱 Google Pay", color: "blue" },
  { value: "phonepe", label: "📱 PhonePe", color: "purple" },
  { value: "upi_other", label: "📱 Other UPI", color: "cyan" },
];

function getPaymentLabel(method) {
  const found = PAYMENT_METHODS.find((m) => m.value === method);
  return found ? found.label : "💵 Cash";
}

export default function SellPage() {
  const [sales, setSales] = useState([]);
  const [totalSalesCount, setTotalSalesCount] = useState(0); // For serial number calculation
  const [currentStockEggs, setCurrentStockEggs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [defaultEggsPerCrate, setDefaultEggsPerCrate] = useState(30);
  const [defaultCratesPerBox, setDefaultCratesPerBox] = useState(7);
  const [form, setForm] = useState({
    boxesSold: "",
    boxSalePrice: "",
    cratesPerBox: "7",
    cratesSold: "",
    crateSalePrice: "",
    individualEggs: "",
    eggSalePrice: "",
    eggsPerCrate: "30",
    paymentMethod: "cash",
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

  async function fetchSales(dateToFetch = form.date) {
    try {
      const res = await fetch(`/api/sell?date=${dateToFetch}`);
      const data = await res.json();
      if (data.success) {
        setSales(data.data);
        if (data.totalSalesCount !== undefined) {
          setTotalSalesCount(data.totalSalesCount);
        } else {
        // Fallback for backward compatibility or if backend doesn't send it yet
        setTotalSalesCount(data.data.length); 
        }
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
          boxesSold: "",
          boxSalePrice: "",
          cratesPerBox: String(defaultCratesPerBox),
          cratesSold: "",
          crateSalePrice: "",
          individualEggs: "",
          eggSalePrice: "",
          eggsPerCrate: String(defaultEggsPerCrate),
          paymentMethod: "cash",
          date: new Date().toISOString().split("T")[0],
        });
        fetchSales(form.date);
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
    if (!confirm("Are you sure you want to delete this sale?")) return;

    try {
      const res = await fetch(`/api/sell?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setToast({ type: "success", message: "Sale deleted!" });
        fetchSales();
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
  const stockCrates = Math.floor(currentStockEggs / epc);
  const stockBoxes = Math.floor(stockCrates / cpb);

  const boxes = Number(form.boxesSold) || 0;
  const crates = Number(form.cratesSold) || 0;
  const looseEggs = Number(form.individualEggs) || 0;
  const boxEggs = boxes * cpb * epc;
  const crateEggs = crates * epc;
  const totalEggsToSell = boxEggs + crateEggs + looseEggs;
  const boxRevenue = boxes * (Number(form.boxSalePrice) || 0);
  const crateRevenue = crates * (Number(form.crateSalePrice) || 0);
  const looseEggRevenue = looseEggs * (Number(form.eggSalePrice) || 0);
  const totalRevenue = boxRevenue + crateRevenue + looseEggRevenue;
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
          Record box, crate, and individual egg sales
        </p>
      </div>

      {/* Stock Indicator */}
      <div className="w-full max-w-lg mb-8">
        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/20 overflow-hidden">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Current Stock</p>
              <p className="text-3xl font-bold text-white">{loading ? "..." : `${currentStockEggs} eggs`}</p>
              <p className="text-sm text-slate-400 mt-1">
                {loading ? "" : `≈ ${stockBoxes} boxes · ${stockCrates} crates (${cpb} crates/box · ${epc} eggs/crate)`}
              </p>
            </div>
            <div className={`text-5xl ${currentStockEggs > 100 ? "opacity-100" : currentStockEggs > 30 ? "opacity-70" : "opacity-40"}`}>🥚</div>
          </div>
          {!loading && currentStockEggs <= 30 && currentStockEggs > 0 && (
            <p className="relative text-xs text-amber-400 mt-3">⚠️ Stock is running low!</p>
          )}
          {!loading && currentStockEggs === 0 && (
            <p className="relative text-xs text-red-400 mt-3">✕ No stock available</p>
          )}
        </div>
      </div>

      {/* Sell Form */}
      <div className="w-full max-w-lg mb-12">
        <form onSubmit={handleSubmit} className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/20">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none" />
          <h2 className="text-lg font-semibold text-white/90 mb-6 relative">Record Sale</h2>
          <div className="space-y-5 relative">

            {/* Box Sales */}
            <div className="space-y-4 pb-4 border-b border-white/10">
              <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">📦 Box Sales</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Boxes</label>
                  <input type="number" min="0" value={form.boxesSold} onChange={(e) => setForm({ ...form, boxesSold: e.target.value })} placeholder="0" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Price / Box (₹)</label>
                  <input type="number" step="0.01" min="0" value={form.boxSalePrice} onChange={(e) => setForm({ ...form, boxSalePrice: e.target.value })} placeholder="1500.00" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Crates Per Box</label>
                <input type="number" min="1" value={form.cratesPerBox} onChange={(e) => setForm({ ...form, cratesPerBox: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200" />
                <p className="text-xs text-slate-500 mt-1">1 box = {cpb} crates × {epc} eggs = {cpb * epc} eggs</p>
              </div>
            </div>

            {/* Crate Sales */}
            <div className="space-y-4 pb-4 border-b border-white/10">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Crate Sales</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Crates</label>
                  <input type="number" min="0" value={form.cratesSold} onChange={(e) => setForm({ ...form, cratesSold: e.target.value })} placeholder="0" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Price / Crate (₹)</label>
                  <input type="number" step="0.01" min="0" value={form.crateSalePrice} onChange={(e) => setForm({ ...form, crateSalePrice: e.target.value })} placeholder="210.00" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200" />
                </div>
              </div>
            </div>

            {/* Individual Eggs */}
            <div className="space-y-4 pb-4 border-b border-white/10">
              <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Individual Eggs</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Loose Eggs</label>
                  <input type="number" min="0" value={form.individualEggs} onChange={(e) => setForm({ ...form, individualEggs: e.target.value })} placeholder="0" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all duration-200" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Price / Egg (₹)</label>
                  <input type="number" step="0.01" min="0" value={form.eggSalePrice} onChange={(e) => setForm({ ...form, eggSalePrice: e.target.value })} placeholder="7.00" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all duration-200" />
                </div>
              </div>
            </div>

            {/* Eggs per Crate */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Eggs Per Crate Config</label>
              <input type="number" min="1" required value={form.eggsPerCrate} onChange={(e) => setForm({ ...form, eggsPerCrate: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200" />
            </div>

            {/* Payment Method */}
            <div className="pb-4 border-b border-white/10">
              <label className="block text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethod: pm.value })}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      form.paymentMethod === pm.value
                        ? pm.color === "emerald"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-inner shadow-emerald-500/10"
                          : pm.color === "blue"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-inner shadow-blue-500/10"
                          : pm.color === "purple"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-inner shadow-purple-500/10"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-inner shadow-cyan-500/10"
                        : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {(boxes > 0 || crates > 0 || looseEggs > 0) && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-4">
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
                {boxes > 0 && (
                  <p className="text-xs text-slate-500 mt-2">
                    📦 {boxes} box{boxes > 1 ? "es" : ""} = {boxEggs} eggs (₹{boxRevenue.toFixed(2)})
                  </p>
                )}
                {crates > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    🗃️ {crates} crate{crates > 1 ? "s" : ""} = {crateEggs} eggs (₹{crateRevenue.toFixed(2)})
                  </p>
                )}
                {looseEggs > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    🥚 {looseEggs} loose egg{looseEggs > 1 ? "s" : ""} (₹{looseEggRevenue.toFixed(2)})
                  </p>
                )}
              </div>
            )}

            {/* Date and Filter */}
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Date of Sale</label>
                  <input 
                    type="date" 
                    required 
                    value={form.date} 
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setForm({ ...form, date: newDate });
                      fetchSales(newDate); // Auto-filter when date changes
                    }} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 [color-scheme:dark]" 
                  />
               </div>
               <div className="flex items-end">
                   <button 
                     type="button"
                     onClick={() => {
                        const today = new Date().toISOString().split("T")[0];
                        setForm({...form, date: today});
                        fetchSales(today);
                     }}
                     className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium py-3 rounded-xl transition-all duration-200 text-sm"
                   >
                     Jump to Today
                   </button>
               </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || currentStockEggs <= 0 || (boxes === 0 && crates === 0 && looseEggs === 0)}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold py-3 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Processing...
                </span>
              ) : "Record Sale"}
            </button>
          </div>
        </form>
      </div>

      {/* Sales History */}
      <div className="w-full max-w-6xl">
        <h2 className="text-lg font-semibold text-white/90 mb-4">Sales History</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-6 w-6 text-emerald-400" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
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
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-4">S.No.</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-4">Date & Time</th>
                  <th className="text-left text-xs font-medium text-amber-400 uppercase tracking-wider px-4 py-4">Boxes</th>
                  <th className="text-left text-xs font-medium text-emerald-400 uppercase tracking-wider px-4 py-4">Crates</th>
                  <th className="text-left text-xs font-medium text-teal-400 uppercase tracking-wider px-4 py-4">Loose</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-4">Total Qty</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-4">Avg/Egg</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-4">Payment</th>
                  <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-4">Revenue</th>
                  <th className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, i) => {
                  const sepc = sale.eggsPerCrate || 30;
                  const scpb = sale.cratesPerBox || 7;
                  const sb = sale.boxesSold || 0;
                  const sc = sale.cratesSold || 0;
                  const sl = sale.individualEggs || 0;
                  const boxRev = sb * (sale.boxSalePrice || 0);
                  const crateRev = sc * (sale.crateSalePrice || 0);
                  const looseRev = sl * (sale.eggSalePrice || 0);
                  const totalRev = boxRev + crateRev + looseRev;
                  const totalEggsCount = (sb * scpb * sepc) + (sc * sepc) + sl;
                  const avgPrice = totalEggsCount > 0 ? totalRev / totalEggsCount : 0;
                  
                  // Serial Number Calculation using global total count
                  // Formula: Total - Index (if we were showing all)
                  // But since we are paginating/filtering, we need a better approach.
                  // Actually, better approach: The Serial Number should be persistent or calculated based on global count.
                  // If we assume `sales` contains ONLY the filtered items, we can't just use `sales.length`.
                  // We need to use `totalSalesCount` which should be the count of ALL sales ever.
                  // BUT, if we filter by date, how do we know the offset? 
                  // For now, simpler: Serial Number = Total Count - (Index in specific page)? No that breaks on filter.
                  // Requirement: "exist one after another".
                  // If we filter, we just show the sales for that day.
                  // The user wants a running serial number.
                  // If we rely on createdAt sorting (newest first), the newest sale is always #Total.
                  // So, if we are viewing Today's sales, and there are 100 total sales, and today we made 5.
                  // The first one in the list (newest) should be #100. The next #99...
                  // BUT this only works if we know how many sales exist *after* the ones we are viewing? No, *before*.
                  // Actually, to get true S.No without storage, we probably need the list to be correctly ordered.
                  // If we only fetch today's sales, we don't know the S.No of the first sale of today unless 
                  // we know how many sales were made *before* today? Or *after* today?
                  // Wait, "serial number" usually means 1, 2, 3... (Oldest to Newest). 
                  // Or Newest to Oldest (#100, #99...).
                  // The user said: "i choose boxes and clicked the sale it recorded it recorded in 3 then i loose egg but it recorded in 2 why ??"
                  // This implies they expect INCREMENTING or consistent numbers.
                  // If using "Total - Index", and the list reorders, it flips.
                  // With `createdAt` sort, the order is stable.
                  // If we want S.No corresponding to "Id", it should be 1 for first ever sale, N for Nth sale.
                  // Since we don't store "sno" in DB, we compute it.
                  // If we display newest first, the top row is #Total.
                  // BUT... if we filter, we don't know where these records fall in the global sequence easily without more queries.
                  // Let's assume for now the user treats "Serial Number" as "Daily Token" or global ID?
                  // "exist one after another" implies global sequence.
                  // To support global sequence while filtering, we really should store an incrementing counter or `sku`.
                  // BUT creating a migration for `sku` might be risky/complex blindly.
                  // Alternative: Calculate "rank" dynamically?
                  // If we return `totalSalesCount` (all time), and we know we are viewing the latest ones...
                  // Note: The filtered view makes this tricky. If I filter for "Yesterday", I need to know the S.No of the *last sale of yesterday*.
                  // That requires counting all sales *up to* yesterday.
                  // Complexity: 7/10.
                  // 
                  // REVISED PLAN FOR SERIAL NUMBERS:
                  // The user complaint "recorded in 3 then ... recorded in 2" suggests they saw the order FLIP. 
                  // This was caused by `date` (no time) sorting. Two sales same day = random order.
                  // Fixing sort to `createdAt` fixes the *order* flipping.
                  // Now, what number to display?
                  // If they want a persistent S.No, relying on `index` in a filtered list is wrong (it would always restart 1..N or N..1 for that day).
                  // If they want global S.No, we need to know the offset.
                  // Given the constraints and lack of `pagnation` logic:
                  // I will stick to fixing the FLIPPING first (by sorting).
                  // For the number itself:
                  // If I show "Today", and I have 105 total sales, and 5 today.
                  // I want them to be 105, 104, 103, 102, 101.
                  // To do this effectively without fetching everything, we'd need to know "how many sales after this date?".
                  // Since we don't have that, and the user's main pain is "it recorded in 3 then 2" (instability),
                  // verify if `totalSalesCount - i` is "good enough" if we assume they mostly look at "Today" (which is the top of the stack).
                  // If they look at yesterday, it will show S.No relative to... total? No, that would be wrong.
                  //
                  // Actually, simpler fix for Stability + Filtering:
                  // Display the `_id`? No, ugly.
                  // Display Time? They want "Serial Number".
                  // Let's implement a visual index that is stable for the *view*.
                  // If the user selects "Today", maybe they just want to count today's sales? 1, 2, 3...
                  // "I need serial number to be exist one after another sale...".
                  // If I sell today, it should correspond to "next number".
                  // If I have 100 sales total, and I sell one, it is 101.
                  // So `totalSalesCount` approach is correct for the HEAD (Today).
                  // For past days, `totalSalesCount - index` will be wrong because `index` starts at 0 for that day's list.
                  // It would show #105 for a sale made a year ago if I view that day.
                  //
                  // CORRECT FIX requires fetching the correct offset or storing the ID.
                  // Since I cannot change schema easily to add auto-incrementing ID without race conditions/locking...
                  // I will try to approximate:
                  // If filtering by specific date (not all), maybe just show 1..N for that day?
                  // "Sales for <Date>" -> #1, #2, #3 (of that day).
                  // This is stable and useful.
                  // Let's try: "Daily Serial #" vs "Global Serial #".
                  // The user likely wants to know "How many sold today?".
                  // Let's use Index + 1 (Ascending) or Length - Index (Descending) *for the current view*.
                  // The user example: "recorded in 3 then ... recorded in 2".
                  // If they added a 3rd item, they expect 3. Then added 4th, expect 4.
                  // If they see 3 then 2, it means the list reordered.
                  // So `createdAt` sort fixes the "3 then 2" swap.
                  // Displaying `sales.length - i` (descending) means newest is #N.
                  // If I filter for today, and have 5 sales.
                  // Newest is #5. Oldest is #1.
                  // This seems correct for "Daily Count".
                  // Let's stick to `sales.length - i` based on the *fetched* list.
                  // This effectively gives "Daily Serial Number" if filtered by day.
                  
                  const serialNumber = sales.length - i;
                  
                  const dateObj = new Date(sale.createdAt || sale.date); // Use createdAt if available
                  // Check if date is valid
                  const isValidDate = !isNaN(dateObj.getTime());
                  const formattedDate = isValidDate 
                    ? dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                    : "Invalid Date";
                  const formattedTime = isValidDate
                    ? dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                    : "";

                  return (
                    <tr key={sale._id} className={`border-b border-white/5 hover:bg-white/5 transition-colors duration-150 ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                      <td className="px-4 py-4 text-sm font-medium text-slate-400">#{serialNumber}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">
                        <div className="flex flex-col">
                          <span>{formattedDate}</span>
                          <span className="text-xs text-slate-500">{formattedTime}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-amber-300">
                        {sb > 0 ? <span>{sb} <span className="text-slate-500 text-xs">(@ ₹{sale.boxSalePrice})</span></span> : "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-emerald-300">
                        {sc > 0 ? <span>{sc} <span className="text-slate-500 text-xs">(@ ₹{sale.crateSalePrice})</span></span> : "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-teal-300">
                        {sl > 0 ? <span>{sl} <span className="text-slate-500 text-xs">(@ ₹{sale.eggSalePrice})</span></span> : "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-300">{totalEggsCount} eggs</td>
                      <td className="px-4 py-4 text-sm text-slate-400 font-medium">₹{avgPrice.toFixed(2)}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-xs font-medium">
                          {getPaymentLabel(sale.paymentMethod)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-emerald-400 font-bold text-right">₹{totalRev.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(sale._id)}
                          className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-all duration-200"
                          title="Delete sale"
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
