import React, { useState, useMemo } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { PredictedPayment, PurchaseRecord, Language } from '../types';
import { translations } from '../services/translations';
import { SearchableSelect } from './ui/SearchableSelect';

interface Props {
    forecastData: PredictedPayment[]; // All predictions (unpaid records enriched)
    historyData: PurchaseRecord[]; // Processed history data (for paid search)
    lang: Language;
    standalone?: boolean;
}

type DetailViewMode = 'PREDICTED' | 'ALL_UNPAID' | 'PAID_HISTORY' | 'CHECK_SEARCH';

export const PaymentIntelligence: React.FC<Props> = ({ forecastData, historyData, lang }) => {
    const t = translations[lang];
    const [detailViewMode, setDetailViewMode] = useState<DetailViewMode>('PREDICTED');
    const [filterValue, setFilterValue] = useState<string>(''); // Company or Check Number

    // --- Data Processing for Detailed Tables ---

    // 1. Predicted Unpaid (Filtered by due this week)
    const predictedList = useMemo(() => {
        let data = forecastData.filter(r => r.isDueThisWeek);
        if (filterValue) {
            data = data.filter(r => r.companyName.toLowerCase().includes(filterValue.toLowerCase()));
        }
        return data.sort((a, b) => b.unpaidAmount - a.unpaidAmount);
    }, [forecastData, filterValue]);

    // 2. All Unpaid (All records with unpaid > 0)
    const allUnpaidList = useMemo(() => {
        // forecastData contains all unpaid records enriched
        let data = forecastData.filter(r => (r.unpaidAmount || 0) > 0.01); // Ensure unpaid amount is positive
        if (filterValue) {
            data = data.filter(r => r.companyName.toLowerCase().includes(filterValue.toLowerCase()));
        }
        // Sort by Company then Invoice Date
        return data.sort((a, b) => {
            if (a.companyName === b.companyName) {
                return a.invoiceDate.localeCompare(b.invoiceDate);
            }
            return a.companyName.localeCompare(b.companyName);
        });
    }, [forecastData, filterValue]);

    // 3. Paid History (From historyData)
    const paidHistoryList = useMemo(() => {
        // Filter by company name and only paid records
        let data = historyData.filter(r => r.actualPaidAmount > 0);
        if (filterValue) {
            data = data.filter(r => r.companyName.toLowerCase().includes(filterValue.toLowerCase()));
        }
        // Sort by Check Date desc
        return data.sort((a, b) => (b.checkDate || '').localeCompare(a.checkDate || ''));
    }, [historyData, filterValue]);

    // 4. Check Search
    const checkSearchList = useMemo(() => {
        if (!filterValue) return [];
        return historyData.filter(r =>
            (r.checkNumber || '').toLowerCase().includes(filterValue.toLowerCase()) ||
            (r.remarks || '').toLowerCase().includes(filterValue.toLowerCase())
        ).sort((a, b) => (b.checkDate || '').localeCompare(a.checkDate || ''));
    }, [historyData, filterValue]);

    // --- Render Helpers ---

    const renderPredicted = () => (
        <div className="overflow-x-auto">
            <div className="mb-4 w-full md:w-1/3">
                <SearchableSelect
                    label={t.table.searchCompany}
                    options={Array.from(new Set(forecastData.map(r => r.companyName))).sort()}
                    value={filterValue}
                    onChange={setFilterValue}
                    placeholder={t.table.searchCompany}
                    onClear={() => setFilterValue('')}
                />
            </div>
            {!filterValue ? (
                <div className="text-center py-12 text-gray-500 italic border border-dashed border-gray-800 rounded-lg">
                    {t.alerts.noData}
                </div>
            ) : (
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-[#1a1a1a]">
                        <tr>
                            <th className="px-4 py-3">{t.labels.company}</th>
                            <th className="px-4 py-3">{t.labels.invoiceNo}</th>
                            <th className="px-4 py-3">{t.labels.invoiceDate}</th>
                            <th className="px-4 py-3 text-right">{t.labels.medianDays}</th>
                            <th className="px-4 py-3 text-right">{t.labels.predictedDate}</th>
                            <th className="px-4 py-3 text-right">{t.labels.unpaid}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {predictedList.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-800 hover:bg-white/5">
                                <td className="px-4 py-3 font-medium text-white">{item.companyName}</td>
                                <td className="px-4 py-3 font-mono text-gray-400">{item.invoiceNumber}</td>
                                <td className="px-4 py-3 font-mono">{item.invoiceDate.slice(0, 10)}</td>
                                <td className="px-4 py-3 text-right font-mono text-scifi-primary">{item.medianDays?.toFixed(0) || '-'}</td>
                                <td className="px-4 py-3 text-right font-mono text-scifi-warning">{item.predictedDate.slice(0, 10)}</td>
                                <td className="px-4 py-3 text-right font-mono text-white">${item.unpaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                        {predictedList.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 italic">{t.alerts.noData}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );

    const renderAllUnpaid = () => {
        // Calculate cumulative unpaid for the filtered list
        let cumulative = 0;
        return (
            <div className="overflow-x-auto">
                <div className="mb-4 w-full md:w-1/3">
                    <SearchableSelect
                        label={t.table.searchCompany}
                        options={Array.from(new Set(forecastData.map(r => r.companyName))).sort()}
                        value={filterValue}
                        onChange={setFilterValue}
                        placeholder={t.table.searchCompany}
                        onClear={() => setFilterValue('')}
                    />
                </div>
                {!filterValue ? (
                    <div className="text-center py-12 text-gray-500 italic border border-dashed border-gray-800 rounded-lg">
                        {t.alerts.noData}
                    </div>
                ) : (
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-[#1a1a1a]">
                            <tr>
                                <th className="px-4 py-3">{t.labels.company}</th>
                                <th className="px-4 py-3">{t.labels.invoiceNo}</th>
                                <th className="px-4 py-3">{t.labels.invoiceDate}</th>
                                <th className="px-4 py-3 text-right">{t.labels.medianDays}</th>
                                <th className="px-4 py-3 text-right">{t.labels.predictedDate}</th>
                                <th className="px-4 py-3 text-right">{t.labels.unpaid}</th>
                                <th className="px-4 py-3 text-right text-gray-500">Cumulative</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allUnpaidList.map((item, idx) => {
                                cumulative += item.unpaidAmount;
                                return (
                                    <tr key={idx} className="border-b border-gray-800 hover:bg-white/5">
                                        <td className="px-4 py-3 font-medium text-white">{item.companyName}</td>
                                        <td className="px-4 py-3 font-mono text-gray-400">{item.invoiceNumber}</td>
                                        <td className="px-4 py-3 font-mono">{item.invoiceDate.slice(0, 10)}</td>
                                        <td className="px-4 py-3 text-right font-mono text-scifi-primary">{item.medianDays?.toFixed(0) || '-'}</td>
                                        <td className="px-4 py-3 text-right font-mono text-gray-400">{item.predictedDate.slice(0, 10)}</td>
                                        <td className="px-4 py-3 text-right font-mono text-white">${item.unpaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-right font-mono text-gray-500">${cumulative.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                );
                            })}
                            {allUnpaidList.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 italic">{t.alerts.noData}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        );
    };

    const renderPaidHistory = () => {
        let cumDiff = 0;
        const totalDiff = paidHistoryList.reduce((sum, item) => sum + (item.difference || 0), 0);

        return (
            <div className="overflow-x-auto">
                <div className="mb-4 w-full md:w-1/3">
                    <SearchableSelect
                        label={t.table.searchCompany}
                        options={Array.from(new Set(historyData.map(r => r.companyName))).sort()}
                        value={filterValue}
                        onChange={setFilterValue}
                        placeholder={t.table.searchCompany}
                        onClear={() => setFilterValue('')}
                    />
                </div>

                {!filterValue ? (
                    <div className="text-center py-12 text-gray-500 italic border border-dashed border-gray-800 rounded-lg">
                        {t.alerts.noData}
                    </div>
                ) : (
                    <>
                        {filterValue && (
                            <div className={`mb-4 p-3 rounded border ${totalDiff > 0 ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-green-900/20 border-green-700 text-green-400'} flex items-center gap-2`}>
                                <AlertCircle className="w-4 h-4" />
                                <span className="font-bold">{t.labels.total} {t.labels.diff}: ${totalDiff.toLocaleString()}</span>
                                <span className="text-xs opacity-75 ml-2">({t.alerts.diffInfo})</span>
                            </div>
                        )}

                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-400 uppercase bg-[#1a1a1a]">
                                <tr>
                                    <th className="px-4 py-3">{t.labels.company}</th>
                                    <th className="px-4 py-3">{t.labels.invoiceNo}</th>
                                    <th className="px-4 py-3">{t.labels.checkTotal}</th>
                                    <th className="px-4 py-3">{t.labels.bankDate}</th>
                                    <th className="px-4 py-3 text-right">{t.labels.paidAmount}</th>
                                    <th className="px-4 py-3 text-right">{t.labels.diff}</th>
                                    <th className="px-4 py-3 text-right">{t.labels.cumDiff}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paidHistoryList.map((item, idx) => {
                                    cumDiff += (item.difference || 0);
                                    return (
                                        <tr key={idx} className="border-b border-gray-800 hover:bg-white/5">
                                            <td className="px-4 py-3 font-medium text-white">{item.companyName}</td>
                                            <td className="px-4 py-3 font-mono text-gray-400">{item.invoiceNumber}</td>
                                            <td className="px-4 py-3 font-mono text-scifi-success">${(item.checkTotalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 font-mono">{item.bankReconciliationDate?.slice(0, 10)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-white">${item.actualPaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className={`px-4 py-3 text-right font-mono ${(item.difference || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                ${(item.difference || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-gray-400">${cumDiff.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    );
                                })}
                                {paidHistoryList.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500 italic">
                                            {t.alerts.noData}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        );
    };

    const renderCheckSearch = () => (
        <div className="overflow-x-auto">
            <div className="mb-4 w-full md:w-1/3">
                <SearchableSelect
                    label={t.table.searchCheck}
                    options={Array.from(new Set(historyData.filter(r => r.checkNumber).map(r => r.checkNumber!))).sort()}
                    value={filterValue}
                    onChange={setFilterValue}
                    placeholder={t.table.searchCheck}
                    onClear={() => setFilterValue('')}
                />
            </div>
            {!filterValue ? (
                <div className="text-center py-12 text-gray-500 italic border border-dashed border-gray-800 rounded-lg">
                    {t.alerts.noData}
                </div>
            ) : (
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-[#1a1a1a]">
                        <tr>
                            <th className="px-4 py-3">{t.labels.company}</th>
                            <th className="px-4 py-3">{t.labels.checkNo}</th>
                            <th className="px-4 py-3">{t.labels.checkTotal}</th>
                            <th className="px-4 py-3">{t.labels.checkDate}</th>
                            <th className="px-4 py-3">{t.labels.bankDate}</th>
                            <th className="px-4 py-3 text-right">{t.labels.diff}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {checkSearchList.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-800 hover:bg-white/5">
                                <td className="px-4 py-3 font-medium text-white">{item.companyName}</td>
                                <td className="px-4 py-3 font-mono text-scifi-primary">{item.checkNumber}</td>
                                <td className="px-4 py-3 font-mono text-scifi-success">${(item.checkTotalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="px-4 py-3 font-mono">{item.checkDate?.slice(0, 10)}</td>
                                <td className="px-4 py-3 font-mono">{item.bankReconciliationDate?.slice(0, 10)}</td>
                                <td className={`px-4 py-3 text-right font-mono ${(item.difference || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    ${(item.difference || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))}
                        {checkSearchList.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 italic">
                                    {t.alerts.noData}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Detailed Tables Container (No Expander) */}
            <div className="border border-scifi-border rounded-xl overflow-hidden bg-[#0f172a]/50">
                <div className="p-4 animate-in slide-in-from-top-2">
                    {/* View Switcher */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {[
                            { id: 'PREDICTED', label: t.table.mode1 },
                            { id: 'ALL_UNPAID', label: t.table.mode2 },
                            { id: 'PAID_HISTORY', label: t.table.mode3 },
                            { id: 'CHECK_SEARCH', label: t.table.mode4 },
                        ].map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => {
                                    setDetailViewMode(mode.id as DetailViewMode);
                                    setFilterValue(''); // Reset filter on mode change
                                }}
                                className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${detailViewMode === mode.id
                                    ? 'bg-scifi-primary text-black font-bold'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="min-h-[300px]">
                        {detailViewMode === 'PREDICTED' && renderPredicted()}
                        {detailViewMode === 'ALL_UNPAID' && renderAllUnpaid()}
                        {detailViewMode === 'PAID_HISTORY' && renderPaidHistory()}
                        {detailViewMode === 'CHECK_SEARCH' && renderCheckSearch()}
                    </div>
                </div>
            </div>
        </div>
    );
};
