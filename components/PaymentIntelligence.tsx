import React, { useState, useMemo } from 'react';
import { PurchaseRecord, PredictedPayment, Language } from '../types';
import { translations } from '../services/translations';
import { SearchableSelect } from './ui/SearchableSelect';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
    forecastData: PredictedPayment[]; // All predictions (unpaid records enriched)
    historyData: PurchaseRecord[]; // Processed history data (for paid search)
    lang: Language;
    standalone?: boolean;
}

type Mode = 'PREDICTED' | 'ALL_UNPAID' | 'PAID_HISTORY' | 'CHECK_SEARCH';

export const PaymentIntelligence: React.FC<Props> = ({ forecastData, historyData, lang, standalone = false }) => {
    const t = translations[lang];
    const [expanded, setExpanded] = useState(standalone);
    const [mode, setMode] = useState<Mode>('PREDICTED');
    const [filterValue, setFilterValue] = useState<string>(''); // Company or Check Number

    // Toggle Panel (Only if not standalone)
    if (!expanded && !standalone) {
        return (
            <button
                onClick={() => setExpanded(true)}
                className="w-full py-4 bg-scifi-card border border-scifi-border hover:border-scifi-primary/50 text-scifi-primary rounded-xl flex items-center justify-center gap-2 transition-all font-mono text-sm uppercase tracking-wider"
            >
                <Search className="w-4 h-4" />
                {t.table.expand}
                <ChevronDown className="w-4 h-4" />
            </button>
        )
    }

    // -------------------------
    // Render Logic
    // -------------------------

    // Mode 1: Predicted Unpaid (Grouped by Company, Filtered by Due This Week in Python? No, User selects company)
    // Python logic: "Predicted Unpaid" -> Select Company -> Show Details + Total Row
    const renderPredicted = () => {
        // Only items that are unpaid
        const unpaid = forecastData.filter(r => (r.unpaidAmount || 0) > 0.01);
        const companies = Array.from(new Set(unpaid.map(r => r.companyName))).sort();

        const filtered = unpaid
            .filter(r => filterValue ? r.companyName === filterValue : false)
            .sort((a, b) => a.invoiceDate.localeCompare(b.invoiceDate));

        // Calculate total if filtered
        const totalRow = filtered.length > 0 ? {
            companyName: t.labels.total,
            invoiceAmount: filtered.reduce((s, r) => s + r.invoiceAmount, 0),
            unpaidAmount: filtered.reduce((s, r) => s + r.unpaidAmount, 0),
        } : null;

        return (
            <div className="space-y-4">
                <div className="w-full md:w-1/3">
                    <SearchableSelect
                        label={t.table.searchCompany}
                        options={companies}
                        value={filterValue}
                        onChange={(val) => setFilterValue(val)}
                        placeholder="Type to search company..."
                    />
                </div>

                {filterValue && (
                    <div className="overflow-x-auto border border-scifi-border rounded-lg">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-scifi-accent uppercase bg-scifi-card border-b border-scifi-border">
                                <tr>
                                    <th className="px-4 py-3">{t.labels.company}</th>
                                    <th className="px-4 py-3">{t.labels.invoiceDate}</th>
                                    <th className="px-4 py-3 text-right">{t.labels.amount}</th>
                                    <th className="px-4 py-3 text-right">{t.labels.unpaid}</th>
                                    <th className="px-4 py-3 text-center">{t.labels.medianDays}</th>
                                    <th className="px-4 py-3">{t.labels.predictedDate}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((row, idx) => (
                                    <tr key={idx} className="border-b border-scifi-border/50 hover:bg-white/5">
                                        <td className="px-4 py-2 font-medium text-white">{row.companyName}</td>
                                        <td className="px-4 py-2 font-mono">{row.invoiceDate.slice(0, 10)}</td>
                                        <td className="px-4 py-2 text-right font-mono text-white">{row.invoiceAmount.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right font-mono text-scifi-warning">{row.unpaidAmount.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-center font-mono">{row.medianDays?.toFixed(0)}</td>
                                        <td className="px-4 py-2 font-mono text-scifi-primary">{row.predictedDate.slice(0, 10)}</td>
                                    </tr>
                                ))}
                                {totalRow && (
                                    <tr className="bg-scifi-primary/10 font-bold text-white">
                                        <td className="px-4 py-3">{totalRow.companyName}</td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3 text-right">{totalRow.invoiceAmount.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right">{totalRow.unpaidAmount.toFixed(2)}</td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3"></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        )
    };


    // Mode 2: All Unpaid (Similar to 1 but includes cumulative)
    const renderAllUnpaid = () => {
        const unpaid = forecastData.filter(r => (r.unpaidAmount || 0) > 0.01);
        const companies = Array.from(new Set(unpaid.map(r => r.companyName))).sort();

        const filtered = unpaid
            .filter(r => filterValue ? r.companyName === filterValue : false)
            .sort((a, b) => a.invoiceDate.localeCompare(b.invoiceDate));

        // Compute Cumulative
        let runningTotal = 0;
        const filteredWithCum = filtered.map(r => {
            runningTotal += r.unpaidAmount;
            return { ...r, cumulative: runningTotal };
        });

        const totalRow = filtered.length > 0 ? {
            companyName: t.labels.total,
            invoiceAmount: filtered.reduce((s, r) => s + r.invoiceAmount, 0),
            unpaidAmount: filtered.reduce((s, r) => s + r.unpaidAmount, 0),
        } : null;

        return (
            <div className="space-y-4">
                <div className="w-full md:w-1/3">
                    <SearchableSelect
                        label={t.table.searchCompany}
                        options={companies}
                        value={filterValue}
                        onChange={(val) => setFilterValue(val)}
                        placeholder="Type to search company..."
                    />
                </div>

                {filterValue && (
                    <div className="overflow-x-auto border border-scifi-border rounded-lg">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-scifi-accent uppercase bg-scifi-card border-b border-scifi-border">
                                <tr>
                                    <th className="px-4 py-3">{t.labels.company}</th>
                                    <th className="px-4 py-3">{t.labels.invoiceDate}</th>
                                    <th className="px-4 py-3 text-right">{t.labels.amount}</th>
                                    <th className="px-4 py-3 text-right">{t.labels.unpaid}</th>
                                    <th className="px-4 py-3 text-right">{t.labels.cumDiff}</th>
                                    <th className="px-4 py-3">{t.labels.predictedDate}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWithCum.map((row, idx) => (
                                    <tr key={idx} className="border-b border-scifi-border/50 hover:bg-white/5">
                                        <td className="px-4 py-2 font-medium text-white">{row.companyName}</td>
                                        <td className="px-4 py-2 font-mono">{row.invoiceDate.slice(0, 10)}</td>
                                        <td className="px-4 py-2 text-right font-mono text-white">{row.invoiceAmount.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right font-mono text-scifi-warning">{row.unpaidAmount.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right font-mono text-gray-300">{row.cumulative.toFixed(2)}</td>
                                        <td className="px-4 py-2 font-mono text-scifi-primary">{row.predictedDate.slice(0, 10)}</td>
                                    </tr>
                                ))}
                                {totalRow && (
                                    <tr className="bg-scifi-primary/10 font-bold text-white">
                                        <td className="px-4 py-3">{totalRow.companyName}</td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3 text-right">{totalRow.invoiceAmount.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right">{totalRow.unpaidAmount.toFixed(2)}</td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3"></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        )
    };

    // Mode 3: Paid History (With Reverse Cumulative Logic)
    const renderPaidHistory = () => {
        // Filter for PAID records
        const paid = historyData.filter(r => r.checkDate);
        const companies = Array.from(new Set(paid.map(r => r.companyName))).sort();

        const filtered = paid
            .filter(r => filterValue ? r.companyName === filterValue : false)
            // Sort Date Descending
            .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));

        // Calculate diff and reverse cumulative
        // Python: diff = invoice - actualPaid
        // Reverse Cumulative: Start from bottom (oldest) and accumulate upwards
        const rowsWithDiff = filtered.map(r => ({
            ...r,
            diff: (r.invoiceAmount || 0) - (r.actualPaidAmount || 0)
        }));

        // Calculate cumulative on reversed array then flip back
        // Or just standard loop from end to start
        let running = 0;
        const rowsWithCum = [];
        for (let i = rowsWithDiff.length - 1; i >= 0; i--) {
            running += rowsWithDiff[i].diff;
            rowsWithCum.unshift({ ...rowsWithDiff[i], cumulative: running });
        }
        // Result: The most recent row (index 0) has the total cumulative of all time

        const totalDiff = rowsWithDiff.reduce((s, r) => s + r.diff, 0);

        return (
            <div className="space-y-4">
                <div className="w-full md:w-1/3">
                    <SearchableSelect
                        label={t.table.searchCompany}
                        options={companies}
                        value={filterValue}
                        onChange={(val) => setFilterValue(val)}
                        placeholder="Type to search company..."
                    />
                </div>

                {filterValue && (
                    <>
                        <div className="p-3 bg-scifi-card border border-scifi-primary/30 rounded text-sm text-center">
                            <span className="text-gray-400">{t.alerts.diffInfo}</span>
                            <div className="text-lg font-bold text-white mt-1">
                                Total Diff: <span className={totalDiff > 0 ? 'text-scifi-warning' : 'text-scifi-success'}>{totalDiff.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-scifi-border rounded-lg max-h-[600px]">
                            <table className="w-full text-sm text-left text-gray-400">
                                <thead className="text-xs text-scifi-accent uppercase bg-scifi-card border-b border-scifi-border sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3">{t.labels.company}</th>
                                        <th className="px-4 py-3">{t.labels.invoiceDate}</th>
                                        <th className="px-4 py-3 text-right">{t.labels.amount}</th>
                                        <th className="px-4 py-3 text-right">{t.labels.paidAmount}</th>
                                        <th className="px-4 py-3 text-right">{t.labels.diff}</th>
                                        <th className="px-4 py-3 text-right">{t.labels.cumDiff}</th>
                                        <th className="px-4 py-3">{t.labels.checkDate}</th>
                                        <th className="px-4 py-3">{t.labels.checkNo}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rowsWithCum.map((row, idx) => (
                                        <tr key={idx} className="border-b border-scifi-border/50 hover:bg-white/5">
                                            <td className="px-4 py-2 font-medium text-white">{row.companyName}</td>
                                            <td className="px-4 py-2 font-mono">{row.invoiceDate.slice(0, 10)}</td>
                                            <td className="px-4 py-2 text-right font-mono text-white">{row.invoiceAmount.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-right font-mono text-scifi-success">{(row.actualPaidAmount || 0).toFixed(2)}</td>
                                            <td className={`px-4 py-2 text-right font-mono ${row.diff !== 0 ? 'text-scifi-warning' : 'text-gray-600'}`}>{row.diff.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-right font-mono text-gray-300 font-bold">{row.cumulative.toFixed(2)}</td>
                                            <td className="px-4 py-2 font-mono">{row.checkDate?.slice(0, 10)}</td>
                                            <td className="px-4 py-2 font-mono">{row.checkNumber}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        )
    };

    // Mode 4: Check Search
    const renderCheckSearch = () => {
        // Collect all checks
        const checks = Array.from(new Set(historyData.filter(r => r.checkNumber).map(r => r.checkNumber!))).sort();

        const filtered = historyData.filter(r => r.checkNumber === filterValue);

        return (
            <div className="space-y-4">
                <div className="w-full md:w-1/3">
                    <SearchableSelect
                        label={t.table.searchCheck}
                        options={checks}
                        value={filterValue}
                        onChange={(val) => setFilterValue(val)}
                        placeholder="Type to search check number..."
                    />
                </div>

                {filterValue && filtered.length > 0 && (
                    <div className="overflow-x-auto border border-scifi-border rounded-lg">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-scifi-accent uppercase bg-scifi-card border-b border-scifi-border">
                                <tr>
                                    <th className="px-4 py-3">{t.labels.company}</th>
                                    <th className="px-4 py-3">{t.labels.invoiceDate}</th>
                                    <th className="px-4 py-3 text-right">{t.labels.amount}</th>
                                    <th className="px-4 py-3 text-right">{t.labels.paidAmount}</th>
                                    <th className="px-4 py-3">{t.labels.checkDate}</th>
                                    <th className="px-4 py-3">{t.labels.checkNo}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((row, idx) => (
                                    <tr key={idx} className="border-b border-scifi-border/50 hover:bg-white/5">
                                        <td className="px-4 py-2 font-medium text-white">{row.companyName}</td>
                                        <td className="px-4 py-2 font-mono">{row.invoiceDate.slice(0, 10)}</td>
                                        <td className="px-4 py-2 text-right font-mono text-white">{row.invoiceAmount.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right font-mono text-scifi-success">{(row.actualPaidAmount || 0).toFixed(2)}</td>
                                        <td className="px-4 py-2 font-mono">{row.checkDate?.slice(0, 10)}</td>
                                        <td className="px-4 py-2 font-mono text-scifi-primary">{row.checkNumber}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        )
    };

    return (
        <div className="mt-8 bg-scifi-card/50 border border-scifi-border rounded-xl p-6 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-scifi-primary" />
                    Payment Intelligence Node
                </h3>
                <button onClick={() => setExpanded(false)} className="text-gray-400 hover:text-white">
                    <ChevronUp className="w-5 h-5" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-scifi-border pb-4">
                <button onClick={() => { setMode('PREDICTED'); setFilterValue(''); }} className={`px-4 py-2 text-xs font-bold rounded uppercase tracking-wide transition-all ${mode === 'PREDICTED' ? 'bg-scifi-primary text-white' : 'text-gray-500 hover:text-gray-300'}`}>{t.table.mode1}</button>
                <button onClick={() => { setMode('ALL_UNPAID'); setFilterValue(''); }} className={`px-4 py-2 text-xs font-bold rounded uppercase tracking-wide transition-all ${mode === 'ALL_UNPAID' ? 'bg-scifi-warning text-white' : 'text-gray-500 hover:text-gray-300'}`}>{t.table.mode2}</button>
                <button onClick={() => { setMode('PAID_HISTORY'); setFilterValue(''); }} className={`px-4 py-2 text-xs font-bold rounded uppercase tracking-wide transition-all ${mode === 'PAID_HISTORY' ? 'bg-scifi-success text-white' : 'text-gray-500 hover:text-gray-300'}`}>{t.table.mode3}</button>
                <button onClick={() => { setMode('CHECK_SEARCH'); setFilterValue(''); }} className={`px-4 py-2 text-xs font-bold rounded uppercase tracking-wide transition-all ${mode === 'CHECK_SEARCH' ? 'bg-scifi-accent text-white' : 'text-gray-500 hover:text-gray-300'}`}>{t.table.mode4}</button>
            </div>

            {mode === 'PREDICTED' && renderPredicted()}
            {mode === 'ALL_UNPAID' && renderAllUnpaid()}
            {mode === 'PAID_HISTORY' && renderPaidHistory()}
            {mode === 'CHECK_SEARCH' && renderCheckSearch()}
        </div>
    );
};
