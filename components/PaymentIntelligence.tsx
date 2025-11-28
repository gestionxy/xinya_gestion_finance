import React, { useState, useMemo } from 'react';
import { PurchaseRecord, PredictedPayment, Language } from '../types';
import { translations } from '../services/translations';
import { SearchableSelect } from './ui/SearchableSelect';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface Props {
    forecastData: PredictedPayment[]; // All predictions (unpaid records enriched)
    historyData: PurchaseRecord[]; // Processed history data (for paid search)
    lang: Language;
    standalone?: boolean;
}

type TopLevelView = 'DEPT_SUMMARY' | 'DEPT_COMPANY_DETAILS' | 'PREDICTED_DETAILS';
type DetailViewMode = 'PREDICTED' | 'ALL_UNPAID' | 'PAID_HISTORY' | 'CHECK_SEARCH';

export const PaymentIntelligence: React.FC<Props> = ({ forecastData, historyData, lang, standalone = false }) => {
    const t = translations[lang];
    const [expanded, setExpanded] = useState(standalone);
    const [topLevelView, setTopLevelView] = useState<TopLevelView>('DEPT_SUMMARY');
    const [selectedDept, setSelectedDept] = useState<string>('');
    const [detailViewMode, setDetailViewMode] = useState<DetailViewMode>('PREDICTED');
    const [filterValue, setFilterValue] = useState<string>(''); // Company or Check Number
    const [isExpanderOpen, setIsExpanderOpen] = useState(false);

    // -------------------------
    // Aggregations
    // -------------------------
    const { dueThisWeek, totalDue, byDept, byDeptCompany } = useMemo(() => {
        const due = forecastData.filter(r => r.isDueThisWeek);
        const total = due.reduce((sum, r) => sum + r.unpaidAmount, 0);

        // By Dept
        const deptMap: Record<string, number> = {};
        due.forEach(r => {
            deptMap[r.department] = (deptMap[r.department] || 0) + r.unpaidAmount;
        });
        const deptData = Object.entries(deptMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // By Dept -> Company
        const deptCompMap: Record<string, Record<string, number>> = {};
        due.forEach(r => {
            if (!deptCompMap[r.department]) deptCompMap[r.department] = {};
            deptCompMap[r.department][r.companyName] = (deptCompMap[r.department][r.companyName] || 0) + r.unpaidAmount;
        });

        return { dueThisWeek: due, totalDue: total, byDept: deptData, byDeptCompany: deptCompMap };
    }, [forecastData]);

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

    // 1. Dept Summary Chart
    const renderDeptSummary = () => (
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDept} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
                    <XAxis dataKey="name" stroke="#888" angle={-30} textAnchor="end" interval={0} height={60} />
                    <YAxis stroke="#888" />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                        cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                    />
                    <Bar
                        dataKey="value"
                        name={t.labels.unpaid}
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        onClick={(data) => {
                            if (data && data.name) {
                                setSelectedDept(data.name);
                                setTopLevelView('DEPT_COMPANY_DETAILS');
                            }
                        }}
                        cursor="pointer"
                    >
                        {byDept.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${210 + index * 10}, 70%, 50%)`} cursor="pointer" />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );

    // 2. Dept Company Details
    const renderDeptCompany = () => {
        const depts = Object.keys(byDeptCompany).sort();
        const currentDept = selectedDept || depts[0];

        // Prepare data with latest payment info
        const companyData = useMemo(() => {
            if (!currentDept || !byDeptCompany[currentDept]) return [];

            return Object.entries(byDeptCompany[currentDept])
                .map(([name, value]) => {
                    // Find latest payment info for this company in this dept
                    // Sort by Invoice Date desc, then Check Date desc
                    const companyHistory = historyData
                        .filter(r => r.department === currentDept && r.companyName === name && r.checkDate)
                        .sort((a, b) => {
                            const dateA = a.invoiceDate + (a.checkDate || '');
                            const dateB = b.invoiceDate + (b.checkDate || '');
                            return dateB.localeCompare(dateA);
                        });

                    const latest = companyHistory[0];

                    return {
                        name,
                        value,
                        latestInvoiceDate: latest?.invoiceDate,
                        latestCheckDate: latest?.checkDate,
                        latestCheckNumber: latest?.checkNumber,
                        latestCheckTotal: latest?.checkTotalAmount
                    };
                })
                .sort((a, b) => b.value - a.value);
        }, [currentDept, byDeptCompany, historyData]);

        const CustomTooltip = ({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                    <div className="bg-[#1a1a1a] border border-[#333] p-3 rounded shadow-xl text-xs">
                        <p className="font-bold text-white mb-2">{label}</p>
                        <p className="text-scifi-warning mb-2">
                            {t.labels.unpaid}: <span className="font-mono">${data.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </p>
                        {data.latestCheckDate ? (
                            <div className="space-y-1 text-gray-400 border-t border-gray-700 pt-2 mt-2">
                                <p>{t.labels.invoiceDate}: <span className="text-white font-mono">{data.latestInvoiceDate?.slice(0, 10)}</span></p>
                                <p>{t.labels.checkDate}: <span className="text-white font-mono">{data.latestCheckDate?.slice(0, 10)}</span></p>
                                <p>{t.labels.checkNo}: <span className="text-scifi-primary font-mono">{data.latestCheckNumber}</span></p>
                                <p>{t.labels.checkTotal}: <span className="text-scifi-success font-mono">${(data.latestCheckTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                            </div>
                        ) : (
                            <p className="text-gray-500 italic mt-2 border-t border-gray-700 pt-2">No payment history</p>
                        )}
                    </div>
                );
            }
            return null;
        };

        return (
            <div className="space-y-4">
                <div className="w-full md:w-1/3">
                    <SearchableSelect
                        label={t.control.deptSelect}
                        options={depts}
                        value={currentDept}
                        onChange={(val) => setSelectedDept(val)}
                        placeholder="Select Department..."
                    />
                </div>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={companyData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
                            <XAxis dataKey="name" stroke="#888" angle={-30} textAnchor="end" interval={0} height={80} />
                            <YAxis stroke="#888" />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                            <Bar dataKey="value" name={t.labels.unpaid} fill="#f97316" radius={[4, 4, 0, 0]}>
                                {companyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`hsl(${30 + index * 10}, 90%, 50%)`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    // 3. Predicted Details (Total + Chart + Expander)
    const renderPredictedDetails = () => {
        // Prepare data for chart (All companies due this week)
        const companyMap: Record<string, number> = {};
        dueThisWeek.forEach(r => {
            companyMap[r.companyName] = (companyMap[r.companyName] || 0) + r.unpaidAmount;
        });
        const chartData = Object.entries(companyMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return (
            <div className="space-y-8">
                {/* Total Card */}
                <div className="bg-blue-50/10 border border-blue-500/30 p-6 rounded-xl flex items-center justify-between">
                    <div>
                        <h4 className="text-blue-400 text-lg font-medium mb-1">{t.headers.forecastTotal}</h4>
                        <div className="text-3xl font-bold text-white">${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="text-right text-sm text-gray-400 max-w-md">
                        {t.alerts.forecastInfo}
                    </div>
                </div>

                {/* Chart */}
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
                            <XAxis dataKey="name" stroke="#888" angle={-30} textAnchor="end" interval={0} height={80} />
                            <YAxis stroke="#888" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                            />
                            <Bar dataKey="value" name={t.labels.unpaid} fill="#f97316" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Expander */}
                <div className="border border-scifi-border rounded-xl overflow-hidden">
                    <button
                        onClick={() => setIsExpanderOpen(!isExpanderOpen)}
                        className="w-full px-6 py-4 bg-scifi-card hover:bg-white/5 flex items-center justify-between transition-colors"
                    >
                        <span className="font-medium text-white flex items-center gap-2">
                            <Search className="w-4 h-4 text-scifi-primary" />
                            {t.table.expand}
                        </span>
                        {isExpanderOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </button>

                    {isExpanderOpen && (
                        <div className="p-6 bg-black/20 border-t border-scifi-border space-y-6">
                            {/* Mode Selection */}
                            <div className="flex flex-wrap gap-2">
                                {(['PREDICTED', 'ALL_UNPAID', 'PAID_HISTORY', 'CHECK_SEARCH'] as const).map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => { setDetailViewMode(m); setFilterValue(''); }}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${detailViewMode === m
                                            ? 'bg-scifi-primary text-black shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                                            : 'bg-scifi-card border border-scifi-border text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        {m === 'PREDICTED' && t.table.mode1}
                                        {m === 'ALL_UNPAID' && t.table.mode2}
                                        {m === 'PAID_HISTORY' && t.table.mode3}
                                        {m === 'CHECK_SEARCH' && t.table.mode4}
                                    </button>
                                ))}
                            </div>

                            {/* Content */}
                            <div className="animate-in fade-in duration-300">
                                {detailViewMode === 'PREDICTED' && renderPredicted()}
                                {detailViewMode === 'ALL_UNPAID' && renderAllUnpaid()}
                                {detailViewMode === 'PAID_HISTORY' && renderPaidHistory()}
                                {detailViewMode === 'CHECK_SEARCH' && renderCheckSearch()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Helper functions for tables (reused from before)
    const renderPredicted = () => {
        const unpaid = forecastData.filter(r => (r.unpaidAmount || 0) > 0.01);
        const companies = Array.from(new Set(unpaid.map(r => r.companyName))).sort();
        const filtered = unpaid
            .filter(r => filterValue ? r.companyName === filterValue : false)
            .sort((a, b) => a.invoiceDate.localeCompare(b.invoiceDate));

        const totalRow = filtered.length > 0 ? {
            companyName: t.labels.total,
            invoiceAmount: filtered.reduce((s, r) => s + r.invoiceAmount, 0),
            unpaidAmount: filtered.reduce((s, r) => s + r.unpaidAmount, 0),
        } : null;

        return (
            <div className="space-y-4">
                <div className="w-full md:w-1/3">
                    <SearchableSelect label={t.table.searchCompany} options={companies} value={filterValue} onChange={setFilterValue} placeholder="Type to search..." />
                </div>
                {filterValue && (
                    <div className="overflow-x-auto border border-scifi-border rounded-lg">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-scifi-accent uppercase bg-scifi-card border-b border-scifi-border">
                                <tr>
                                    <th className="px-4 py-3">{t.labels.company}</th>
                                    <th className="px-4 py-3">{t.labels.invoiceNo}</th>
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
                                        <td className="px-4 py-2 font-mono">{row.invoiceNumber}</td>
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
        );
    };

    const renderAllUnpaid = () => {
        const unpaid = forecastData.filter(r => (r.unpaidAmount || 0) > 0.01);
        const companies = Array.from(new Set(unpaid.map(r => r.companyName))).sort();
        const filtered = unpaid
            .filter(r => filterValue ? r.companyName === filterValue : false)
            .sort((a, b) => a.invoiceDate.localeCompare(b.invoiceDate));

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
                    <SearchableSelect label={t.table.searchCompany} options={companies} value={filterValue} onChange={setFilterValue} placeholder="Type to search..." />
                </div>
                {filterValue && (
                    <div className="overflow-x-auto border border-scifi-border rounded-lg">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-scifi-accent uppercase bg-scifi-card border-b border-scifi-border">
                                <tr>
                                    <th className="px-4 py-3">{t.labels.company}</th>
                                    <th className="px-4 py-3">{t.labels.invoiceNo}</th>
                                    <th className="px-4 py-3">{t.labels.invoiceDate}</th>
                                    <th className="px-4 py-3 text-right">{t.labels.amount}</th>
                                    <th className="px-4 py-3 text-right">{t.labels.unpaid}</th>
                                    <th className="px-4 py-3 text-right">{t.labels.cumDiff}</th>
                                    <th className="px-4 py-3">{t.labels.predictedDate}</th>
                                    <th className="px-4 py-3 text-center">{t.labels.medianDays}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWithCum.map((row, idx) => (
                                    <tr key={idx} className="border-b border-scifi-border/50 hover:bg-white/5">
                                        <td className="px-4 py-2 font-medium text-white">{row.companyName}</td>
                                        <td className="px-4 py-2 font-mono">{row.invoiceNumber}</td>
                                        <td className="px-4 py-2 font-mono">{row.invoiceDate.slice(0, 10)}</td>
                                        <td className="px-4 py-2 text-right font-mono text-white">{row.invoiceAmount.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right font-mono text-scifi-warning">{row.unpaidAmount.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right font-mono text-gray-300">{row.cumulative.toFixed(2)}</td>
                                        <td className="px-4 py-2 font-mono text-scifi-primary">{row.predictedDate.slice(0, 10)}</td>
                                        <td className="px-4 py-2 text-center font-mono">{row.medianDays?.toFixed(0)}</td>
                                    </tr>
                                ))}
                                {totalRow && (
                                    <tr className="bg-scifi-primary/10 font-bold text-white">
                                        <td className="px-4 py-3">{totalRow.companyName}</td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3 text-right">{totalRow.invoiceAmount.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right">{totalRow.unpaidAmount.toFixed(2)}</td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3"></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    const renderPaidHistory = () => {
        const paid = historyData.filter(r => r.checkDate);
        const companies = Array.from(new Set(paid.map(r => r.companyName))).sort();
        const filtered = paid
            .filter(r => filterValue ? r.companyName === filterValue : false)
            .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));

        const rowsWithDiff = filtered.map(r => ({
            ...r,
            diff: (r.invoiceAmount || 0) - (r.actualPaidAmount || 0)
        }));

        let running = 0;
        const rowsWithCum = [];
        for (let i = rowsWithDiff.length - 1; i >= 0; i--) {
            running += rowsWithDiff[i].diff;
            rowsWithCum.unshift({ ...rowsWithDiff[i], cumulative: running });
        }
        const totalDiff = rowsWithDiff.reduce((s, r) => s + r.diff, 0);

        return (
            <div className="space-y-4">
                <div className="w-full md:w-1/3">
                    <SearchableSelect label={t.table.searchCompany} options={companies} value={filterValue} onChange={setFilterValue} placeholder="Type to search..." />
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
                                        <th className="px-4 py-3">{t.labels.invoiceNo}</th>
                                        <th className="px-4 py-3">{t.labels.invoiceDate}</th>
                                        <th className="px-4 py-3 text-right">{t.labels.amount}</th>
                                        <th className="px-4 py-3">{t.labels.checkNo}</th>
                                        <th className="px-4 py-3 text-right">{t.labels.paidAmount}</th>
                                        <th className="px-4 py-3 text-right">{t.labels.checkTotal}</th>
                                        <th className="px-4 py-3 text-right">{t.labels.diff}</th>
                                        <th className="px-4 py-3 text-right">{t.labels.cumDiff}</th>
                                        <th className="px-4 py-3">{t.labels.checkDate}</th>
                                        <th className="px-4 py-3">{t.labels.bankDate}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rowsWithCum.map((row, idx) => (
                                        <tr key={idx} className="border-b border-scifi-border/50 hover:bg-white/5">
                                            <td className="px-4 py-2 font-medium text-white">{row.companyName}</td>
                                            <td className="px-4 py-2 font-mono">{row.invoiceNumber}</td>
                                            <td className="px-4 py-2 font-mono">{row.invoiceDate.slice(0, 10)}</td>
                                            <td className="px-4 py-2 text-right font-mono text-white">{row.invoiceAmount.toFixed(2)}</td>
                                            <td className="px-4 py-2 font-mono text-scifi-primary">{row.checkNumber}</td>
                                            <td className="px-4 py-2 text-right font-mono text-scifi-success">{(row.actualPaidAmount || 0).toFixed(2)}</td>
                                            <td className="px-4 py-2 text-right font-mono text-gray-400">{(row.checkTotalAmount || 0).toFixed(2)}</td>
                                            <td className={`px-4 py-2 text-right font-mono ${row.diff !== 0 ? 'text-scifi-warning' : 'text-gray-600'}`}>{row.diff.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-right font-mono text-gray-300 font-bold">{row.cumulative.toFixed(2)}</td>
                                            <td className="px-4 py-2 font-mono">{row.checkDate?.slice(0, 10)}</td>
                                            <td className="px-4 py-2 font-mono">{row.bankReconciliationDate?.slice(0, 10)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const renderCheckSearch = () => {
        const checks = Array.from(new Set(historyData.filter(r => r.checkNumber).map(r => r.checkNumber!))).sort();
        const filtered = historyData.filter(r => r.checkNumber === filterValue);

        return (
            <div className="space-y-4">
                <div className="w-full md:w-1/3">
                    <SearchableSelect label={t.table.searchCheck} options={checks} value={filterValue} onChange={setFilterValue} placeholder="Type to search..." />
                </div>
                {filterValue && filtered.length > 0 && (
                    <div className="overflow-x-auto border border-scifi-border rounded-lg">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-scifi-accent uppercase bg-scifi-card border-b border-scifi-border">
                                <tr>
                                    <th className="px-4 py-3">{t.labels.company}</th>
                                    <th className="px-4 py-3">{t.labels.invoiceNo}</th>
                                    <th className="px-4 py-3">{t.labels.invoiceDate}</th>
                                    <th className="px-4 py-3 text-right">{t.labels.amount}</th>
                                    <th className="px-4 py-3">{t.labels.checkNo}</th>
                                    <th className="px-4 py-3 text-right">{t.labels.paidAmount}</th>
                                    <th className="px-4 py-3 text-right">{t.labels.checkTotal}</th>
                                    <th className="px-4 py-3 text-right">{t.labels.diff}</th>
                                    <th className="px-4 py-3">{t.labels.checkDate}</th>
                                    <th className="px-4 py-3">{t.labels.bankDate}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((row, idx) => {
                                    const diff = (row.invoiceAmount || 0) - (row.actualPaidAmount || 0);
                                    return (
                                        <tr key={idx} className="border-b border-scifi-border/50 hover:bg-white/5">
                                            <td className="px-4 py-2 font-medium text-white">{row.companyName}</td>
                                            <td className="px-4 py-2 font-mono">{row.invoiceNumber}</td>
                                            <td className="px-4 py-2 font-mono">{row.invoiceDate.slice(0, 10)}</td>
                                            <td className="px-4 py-2 text-right font-mono text-white">{row.invoiceAmount.toFixed(2)}</td>
                                            <td className="px-4 py-2 font-mono text-scifi-primary">{row.checkNumber}</td>
                                            <td className="px-4 py-2 text-right font-mono text-scifi-success">{(row.actualPaidAmount || 0).toFixed(2)}</td>
                                            <td className="px-4 py-2 text-right font-mono text-gray-400">{(row.checkTotalAmount || 0).toFixed(2)}</td>
                                            <td className={`px-4 py-2 text-right font-mono ${diff !== 0 ? 'text-scifi-warning' : 'text-gray-600'}`}>{diff.toFixed(2)}</td>
                                            <td className="px-4 py-2 font-mono">{row.checkDate?.slice(0, 10)}</td>
                                            <td className="px-4 py-2 font-mono">{row.bankReconciliationDate?.slice(0, 10)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mt-8 bg-scifi-card/50 border border-scifi-border rounded-xl p-6 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-scifi-primary/10 rounded-lg">
                        <Search className="w-5 h-5 text-scifi-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-wide">{t.headers.forecastTitle}</h3>
                </div>
                {/* Top Level View Switcher */}
                <div className="flex bg-scifi-card border border-scifi-border rounded-lg p-1">
                    {(['DEPT_SUMMARY', 'DEPT_COMPANY_DETAILS', 'PREDICTED_DETAILS'] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => { setTopLevelView(v); setFilterValue(''); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${topLevelView === v
                                ? 'bg-scifi-primary text-black shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {v === 'DEPT_SUMMARY' && t.views.unpaidDept}
                            {v === 'DEPT_COMPANY_DETAILS' && t.views.unpaidComp}
                            {v === 'PREDICTED_DETAILS' && t.views.cycleForecast}
                        </button>
                    ))}
                </div>
            </div>

            <div className="animate-in fade-in duration-300">
                {topLevelView === 'DEPT_SUMMARY' && renderDeptSummary()}
                {topLevelView === 'DEPT_COMPANY_DETAILS' && renderDeptCompany()}
                {topLevelView === 'PREDICTED_DETAILS' && renderPredictedDetails()}
            </div>
        </div>
    );
};
