"use client";

import { useState, useEffect } from "react";

const PAYMENT_LABELS = {
  cash: "💵 Cash",
  gpay: "📱 Google Pay",
  phonepe: "📱 PhonePe",
  upi_other: "📱 Other UPI",
};

export default function ReportsPage() {
  const [reportType, setReportType] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function fetchReport() {
    setLoading(true);
    try {
      const params =
        reportType === "daily"
          ? `type=daily&date=${selectedDate}`
          : `type=monthly&month=${selectedMonth}`;
      const res = await fetch(`/api/reports?${params}`);
      const data = await res.json();

      if (data.success) {
        setReport(data.data);
      } else {
        setToast({ type: "error", message: data.error || "Failed to load report" });
      }
    } catch (err) {
      setToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function downloadPDF() {
    if (!report) return;

    const jsPDFModule = await import("jspdf");
    const jsPDF = jsPDFModule.default;
    const { applyPlugin } = await import("jspdf-autotable");
    applyPlugin(jsPDF);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Egg Shop Report", pageWidth / 2, 20, { align: "center" });

    // Period
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    const periodLabel =
      report.type === "daily"
        ? `Daily Report - ${formatDate(report.period)}`
        : `Monthly Report - ${formatMonth(report.period)}`;
    doc.text(periodLabel, pageWidth / 2, 30, { align: "center" });

    // Summary table
    let y = 45;

    const summaryData = [
      ["Boxes Purchased", (report.totalBoxesPurchased || 0).toString()],
      ["Crates Purchased", report.totalCratesPurchased.toString()],
      ["Total Eggs Purchased", report.totalEggsPurchased.toString()],
      ["Purchase Cost", `Rs. ${report.totalPurchaseCost.toFixed(2)}`],
      ["Avg. Cost per Egg", `Rs. ${report.avgPurchasePricePerEgg.toFixed(2)}`],
      ["Boxes Sold", (report.totalBoxesSold || 0).toString()],
      ["Crates Sold", report.totalCratesSold.toString()],
      ["Total Eggs Sold", report.totalEggsSold.toString()],
      ["Sales Revenue", `Rs. ${report.totalSalesRevenue.toFixed(2)}`],
      ["Avg. Sale Price per Egg", `Rs. ${report.avgSalePricePerEgg.toFixed(2)}`],
      ["Profit (Boxes)", `Rs. ${(report.profitBreakdown?.box || 0).toFixed(2)}`],
      ["Profit (Crates)", `Rs. ${(report.profitBreakdown?.crate || 0).toFixed(2)}`],
      ["Profit (Individual Eggs)", `Rs. ${(report.profitBreakdown?.loose || 0).toFixed(2)}`],
      ["Total Profit", `Rs. ${report.profit.toFixed(2)}`],
      ["Current Stock (Eggs)", report.currentStockEggs.toString()],
    ];

    doc.autoTable({
      startY: y,
      head: [["Metric", "Value"]],
      body: summaryData,
      theme: "grid",
      headStyles: { fillColor: [245, 158, 11], textColor: [20, 20, 20], fontStyle: "bold" },
      styles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: "bold" } },
    });

    y = doc.lastAutoTable.finalY + 15;

    // Purchases table
    if (report.purchases.length > 0) {
      doc.setFontSize(13);
      doc.text("Purchases", 14, y);
      y += 5;

      doc.autoTable({
        startY: y,
        head: [["Date", "Boxes", "Crates", "Total Eggs", "Per Egg", "Total"]],
        body: report.purchases.map((p) => {
          const epc = p.eggsPerCrate || 30;
          const cpb = p.cratesPerBox || 7;
          const pb = p.boxesGot || 0;
          const pc = p.cratesGot || 0;
          const totalEggs = (pb * cpb * epc) + (pc * epc);
          const totalCost = (pb * (p.boxPrice || 0)) + (pc * (p.cratePrice || 0));
          const perEgg = totalEggs > 0 ? totalCost / totalEggs : 0;
          return [
            formatDate(p.date),
            pb > 0 ? `${pb} (@ Rs.${p.boxPrice} . ${cpb}cr/box)` : "-",
            pc > 0 ? `${pc} (@ Rs.${Number(p.cratePrice).toFixed(2)})` : "-",
            totalEggs.toString(),
            `Rs. ${perEgg.toFixed(2)}`,
            `Rs. ${totalCost.toFixed(2)}`,
          ];
        }),
        theme: "striped",
        headStyles: { fillColor: [245, 158, 11], textColor: [20, 20, 20], fontStyle: "bold" },
        styles: { fontSize: 8 },
      });

      y = doc.lastAutoTable.finalY + 15;
    }

    // Sales table
    if (report.sales.length > 0) {
      doc.setFontSize(13);
      doc.text("Sales", 14, y);
      y += 5;

      doc.autoTable({
        startY: y,
        head: [["Date", "Boxes", "Crates", "Loose", "Total Eggs", "Revenue", "Payment"]],
        body: report.sales.map((s) => {
          const epc = s.eggsPerCrate || 30;
          const cpb = s.cratesPerBox || 7;
          const sb = s.boxesSold || 0;
          const sc = s.cratesSold || 0;
          const sl = s.individualEggs || 0;
          const boxRev = sb * (s.boxSalePrice || 0);
          const crateRev = sc * (s.crateSalePrice || 0);
          const looseRev = sl * (s.eggSalePrice || 0);
          const totalRev = boxRev + crateRev + looseRev;
          const totalEggs = (sb * cpb * epc) + (sc * epc) + sl;
          const pm = s.paymentMethod || "cash";
          const payLabels = { cash: "Cash", gpay: "Google Pay", phonepe: "PhonePe", upi_other: "Other UPI" };

          return [
            formatDate(s.date),
            sb > 0 ? `${sb} (@ Rs.${s.boxSalePrice})` : "-",
            sc > 0 ? `${sc} (@ Rs.${s.crateSalePrice})` : "-",
            sl > 0 ? `${sl} (@ Rs.${s.eggSalePrice})` : "-",
            totalEggs.toString(),
            `Rs. ${totalRev.toFixed(2)}`,
            payLabels[pm] || "Cash",
          ];
        }),
        theme: "striped",
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 8 },
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generated on ${new Date().toLocaleString("en-IN")} | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    const filename = `egg-report-${report.period}.pdf`;
    doc.save(filename);
    setToast({ type: "success", message: "PDF downloaded!" });
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatMonth(monthStr) {
    const [year, month] = monthStr.split("-");
    const date = new Date(year, month - 1);
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }

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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-300 via-purple-400 to-violet-300 bg-clip-text text-transparent tracking-tight">
          📊 Reports
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Generate daily and monthly business reports
        </p>
      </div>

      {/* Controls */}
      <div className="w-full max-w-lg mb-8">
        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/20">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 pointer-events-none" />

          <div className="space-y-5 relative">
            {/* Report Type Toggle */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Report Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReportType("daily")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    reportType === "daily"
                      ? "bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-inner shadow-violet-500/10"
                      : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  📅 Daily
                </button>
                <button
                  type="button"
                  onClick={() => setReportType("monthly")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    reportType === "monthly"
                      ? "bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-inner shadow-violet-500/10"
                      : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  🗓️ Monthly
                </button>
              </div>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                {reportType === "daily" ? "Select Date" : "Select Month"}
              </label>
              <input
                type={reportType === "daily" ? "date" : "month"}
                value={reportType === "daily" ? selectedDate : selectedMonth}
                onChange={(e) =>
                  reportType === "daily"
                    ? setSelectedDate(e.target.value)
                    : setSelectedMonth(e.target.value)
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200 [color-scheme:dark]"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={fetchReport}
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white font-semibold py-3 rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </span>
              ) : (
                "Generate Report"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Results */}
      {report && (
        <div className="w-full max-w-4xl space-y-6">
          {/* Report Title + Download */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white/90">
              {report.type === "daily"
                ? `Report for ${formatDate(report.period)}`
                : `Report for ${formatMonth(report.period)}`}
            </h2>
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-slate-300 hover:text-white transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
          </div>

          {/* Profit Breakdown Cards (NEW) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
             <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
               <span className="text-xs text-emerald-400 uppercase tracking-wider block">Box Profit</span>
               <span className="text-lg font-bold text-emerald-300">₹{(report.profitBreakdown?.box || 0).toFixed(2)}</span>
             </div>
             <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
               <span className="text-xs text-emerald-400 uppercase tracking-wider block">Crate Profit</span>
               <span className="text-lg font-bold text-emerald-300">₹{(report.profitBreakdown?.crate || 0).toFixed(2)}</span>
             </div>
             <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
               <span className="text-xs text-emerald-400 uppercase tracking-wider block">Profit (Individual Eggs)</span>
               <span className="text-lg font-bold text-emerald-300">₹{(report.profitBreakdown?.loose || 0).toFixed(2)}</span>
             </div>
             <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/50 rounded-lg p-3">
               <span className="text-xs text-emerald-300 uppercase tracking-wider block font-bold">Total Profit</span>
               <span className="text-xl font-black text-white">₹{report.profit.toFixed(2)}</span>
             </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { label: "Boxes Purchased", value: report.totalBoxesPurchased || 0, icon: "📦", color: "amber" },
              { label: "Crates Purchased", value: report.totalCratesPurchased, icon: "🗃️", color: "amber" },
              { label: "Eggs Purchased", value: report.totalEggsPurchased, icon: "🥚", color: "amber" },
              { label: "Purchase Cost", value: `₹${report.totalPurchaseCost.toFixed(2)}`, icon: "💸", color: "amber" },
              { label: "Avg Cost/Egg", value: `₹${report.avgPurchasePricePerEgg.toFixed(2)}`, icon: "🏷️", color: "orange" },
              { label: "Boxes Sold", value: report.totalBoxesSold || 0, icon: "📦", color: "amber" },
              { label: "Crates Sold", value: report.totalCratesSold, icon: "🛒", color: "emerald" },
              { label: "Eggs Sold", value: report.totalEggsSold, icon: "🥚", color: "emerald" },
              { label: "Revenue", value: `₹${report.totalSalesRevenue.toFixed(2)}`, icon: "💰", color: "emerald" },
              { label: "Avg Sale/Egg", value: `₹${report.avgSalePricePerEgg.toFixed(2)}`, icon: "🏷️", color: "teal" },
              // Removed old Profit/Loss card to avoid duplication with new section above
              { label: "Current Stock", value: `${report.currentStockEggs} eggs`, icon: "🥚", color: "violet" },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-lg"
              >
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span>{card.icon}</span> {card.label}
                </p>
                <p
                  className={`text-lg font-bold ${
                    card.color === "amber"
                      ? "text-amber-400"
                      : card.color === "orange"
                      ? "text-orange-400"
                      : card.color === "emerald"
                      ? "text-emerald-400"
                      : card.color === "teal"
                      ? "text-teal-400"
                      : card.color === "red"
                      ? "text-red-400"
                      : "text-violet-400"
                  }`}
                >
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Purchases Table */}
          {report.purchases.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wider">
                Purchases
              </h3>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/20 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Date</th>
                      <th className="text-left text-xs font-medium text-amber-400 uppercase tracking-wider px-4 py-3">Boxes</th>
                      <th className="text-left text-xs font-medium text-orange-400 uppercase tracking-wider px-4 py-3">Crates</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Total Eggs</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Per Egg</th>
                      <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.purchases.map((p, i) => {
                      const epc = p.eggsPerCrate || 30;
                      const cpb = p.cratesPerBox || 7;
                      const pb = p.boxesGot || 0;
                      const pc = p.cratesGot || 0;
                      const boxEggs = pb * cpb * epc;
                      const crateEggs = pc * epc;
                      const totalEggs = boxEggs + crateEggs;
                      const boxCost = pb * (p.boxPrice || 0);
                      const crateCost = pc * (p.cratePrice || 0);
                      const totalCost = boxCost + crateCost;
                      const perEgg = totalEggs > 0 ? totalCost / totalEggs : 0;
                      return (
                        <tr key={p._id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                          <td className="px-4 py-3 text-sm text-slate-300">{formatDate(p.date)}</td>
                          <td className="px-4 py-3 text-sm text-amber-300">
                            {pb > 0 ? <span>{pb} <span className="text-slate-500 text-xs">(@ ₹{p.boxPrice} · {cpb}cr/box)</span></span> : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-orange-300">
                            {pc > 0 ? <span>{pc} <span className="text-slate-500 text-xs">(@ ₹{Number(p.cratePrice).toFixed(2)})</span></span> : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-300">{totalEggs}</td>
                          <td className="px-4 py-3 text-sm text-orange-400 font-medium">₹{perEgg.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-amber-400 font-medium text-right">₹{totalCost.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sales Table */}
          {report.sales.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wider">
                Sales
              </h3>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/20 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Date</th>
                      <th className="text-left text-xs font-medium text-amber-400 uppercase tracking-wider px-4 py-3">Boxes</th>
                      <th className="text-left text-xs font-medium text-emerald-400 uppercase tracking-wider px-4 py-3">Crates</th>
                      <th className="text-left text-xs font-medium text-teal-400 uppercase tracking-wider px-4 py-3">Loose</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Total Eggs</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Payment</th>
                      <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.sales.map((s, i) => {
                      const epc = s.eggsPerCrate || 30;
                      const cpb = s.cratesPerBox || 7;
                      const sb = s.boxesSold || 0;
                      const sc = s.cratesSold || 0;
                      const sl = s.individualEggs || 0;
                      const boxRev = sb * (s.boxSalePrice || 0);
                      const crateRev = sc * (s.crateSalePrice || 0);
                      const looseRev = sl * (s.eggSalePrice || 0);
                      const totalRev = boxRev + crateRev + looseRev;
                      const totalEggs = (sb * cpb * epc) + (sc * epc) + sl;

                      return (
                        <tr key={s._id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                          <td className="px-4 py-3 text-sm text-slate-300">{formatDate(s.date)}</td>
                          <td className="px-4 py-3 text-sm text-amber-300">
                            {sb > 0 ? <span>{sb} <span className="text-slate-500 text-xs">(@ ₹{s.boxSalePrice})</span></span> : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-emerald-300">
                            {sc > 0 ? <span>{sc} <span className="text-slate-500 text-xs">(@ ₹{s.crateSalePrice})</span></span> : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-teal-300">
                            {sl > 0 ? <span>{sl} <span className="text-slate-500 text-xs">(@ ₹{s.eggSalePrice})</span></span> : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-300">{totalEggs}</td>
                          <td className="px-4 py-3 text-sm text-slate-300">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-xs font-medium">
                              {PAYMENT_LABELS[s.paymentMethod] || "💵 Cash"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-emerald-400 font-bold text-right">₹{totalRev.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty state */}
          {report.purchases.length === 0 && report.sales.length === 0 && (
            <div className="text-center py-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
              <p className="text-slate-500 text-sm">No data found for this period.</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
