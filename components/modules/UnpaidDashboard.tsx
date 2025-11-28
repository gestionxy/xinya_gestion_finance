import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, Database } from 'lucide-react';
import { UnpaidSummary, Language } from '../../types';
import { UnpaidDeptChart, UnpaidCompanyChart } from '../charts/UnpaidCharts';
import { translations } from '../../services/translations';
import { GlassCard } from '../ui/GlassCard';

interface UnpaidDashboardProps {
    unpaidSummary: UnpaidSummary;
    lang: Language;
}

type ViewMode = 'DEPT' | 'COMPANY' | 'DETAILS';

export const UnpaidDashboard: React.FC<UnpaidDashboardProps> = ({ unpaidSummary, lang }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('DEPT');
    const [selectedDept, setSelectedDept] = useState<string>('');
    const [selectedCompany, setSelectedCompany] = useState<string>('');
    const t = translations[lang];

    // Filter data for the detail table
    const detailData = React.useMemo(() => {
        console.log('Filtering Details:', { selectedCompany, selectedDept, totalDetails: unpaidSummary.details?.length });

        if (!selectedCompany || !unpaidSummary.details) return [];

        const filtered = unpaidSummary.details.filter(item =>
            item.companyName === selectedCompany &&
            item.department === selectedDept
        );
        console.log('Filtered Results:', filtered.length);
        return filtered;
    }, [unpaidSummary, selectedCompany, selectedDept]);

    const renderDetailTable = () => (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-scifi-accent uppercase bg-scifi-primary/10 border-b border-scifi-primary/20 font-mono">
                    <tr>
                        <th className="px-6 py-4">公司名称</th>
                        <th className="px-6 py-4">部门</th>
                        <th className="px-6 py-4">发票号</th>
                        <th className="px-6 py-4">发票日期</th>
                        <th className="px-6 py-4 text-right">发票金额</th>
                        <th className="px-6 py-4 text-right">TPS</th>
                        <th className="px-6 py-4 text-right">TVQ</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-scifi-border/50">
                    {detailData.map((row, index) => (
                        <tr key={index} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4 font-medium text-white group-hover:text-scifi-primary transition-colors">
                                {row.companyName}
                            </td>
                            <td className="px-6 py-4 text-gray-400">{row.department}</td>
                            <td className="px-6 py-4 font-mono text-scifi-text">{row.invoiceNumber}</td>
                            <td className="px-6 py-4 font-mono text-gray-400">{row.invoiceDate}</td>
                            <td className="px-6 py-4 text-right font-mono text-scifi-danger font-bold">
                                ${(row.invoiceAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-gray-500">
                                ${(row.tps || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-gray-500">
                                ${(row.tvq || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                        </tr>
                    ))}
                    {detailData.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-mono">
                                No records found for this selection.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            {/* Total Card */}
            <div className="relative overflow-hidden rounded-xl bg-[#0f172a] border border-scifi-danger/50 p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                <div className="absolute top-0 left-0 w-1 h-full bg-scifi-danger"></div>
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-scifi-danger/10 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-scifi-danger text-sm font-mono uppercase tracking-widest mb-1 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {t.headers.unpaidTotal}
                        </h3>
                        <div className="text-4xl font-bold text-white tracking-tighter filter drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                            ${unpaidSummary.totalUnpaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart/Table Area */}
            <div className="animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between mb-4">
                    {/* Back Buttons */}
                    <div className="flex gap-2">
                        {viewMode === 'COMPANY' && (
                            <button
                                onClick={() => {
                                    setViewMode('DEPT');
                                    setSelectedDept('');
                                }}
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-mono uppercase"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Departments
                            </button>
                        )}
                        {viewMode === 'DETAILS' && (
                            <button
                                onClick={() => {
                                    setViewMode('COMPANY');
                                    setSelectedCompany('');
                                }}
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-mono uppercase"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Companies
                            </button>
                        )}
                    </div>

                    {/* Breadcrumbs */}
                    <div className="flex gap-2">
                        {selectedDept && (
                            <div className="px-4 py-2 bg-scifi-danger/20 border border-scifi-danger/50 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                <span className="text-sm font-bold text-scifi-danger tracking-wide">{selectedDept}</span>
                            </div>
                        )}
                        {selectedCompany && (
                            <div className="px-4 py-2 bg-scifi-primary/20 border border-scifi-primary/50 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                <span className="text-sm font-bold text-scifi-primary tracking-wide">{selectedCompany}</span>
                            </div>
                        )}
                    </div>
                </div>

                <GlassCard className="border-scifi-danger/30">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {viewMode === 'DEPT' && (
                                <>
                                    <AlertTriangle className="w-5 h-5 text-scifi-danger" />
                                    {t.headers.unpaidDeptTitle}
                                </>
                            )}
                            {viewMode === 'COMPANY' && (
                                <>
                                    <Database className="w-5 h-5 text-scifi-danger" />
                                    {t.headers.unpaidCompTitle}
                                </>
                            )}
                            {viewMode === 'DETAILS' && (
                                <>
                                    <Database className="w-5 h-5 text-scifi-primary" />
                                    Unpaid Invoices Detail
                                </>
                            )}
                        </h2>
                    </div>

                    {viewMode === 'DEPT' && (
                        <UnpaidDeptChart
                            data={unpaidSummary}
                            onBarClick={(dept) => {
                                setSelectedDept(dept);
                                setViewMode('COMPANY');
                            }}
                        />
                    )}

                    {viewMode === 'COMPANY' && (
                        <UnpaidCompanyChart
                            data={unpaidSummary}
                            selectedDept={selectedDept}
                            onBarClick={(company) => {
                                setSelectedCompany(company);
                                setViewMode('DETAILS');
                            }}
                        />
                    )}

                    {viewMode === 'DETAILS' && renderDetailTable()}
                </GlassCard>
            </div>
        </div>
    );
};
