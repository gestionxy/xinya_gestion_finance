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

type ViewMode = 'DEPT' | 'COMPANY';

export const UnpaidDashboard: React.FC<UnpaidDashboardProps> = ({ unpaidSummary, lang }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('DEPT');
    const [selectedDept, setSelectedDept] = useState<string>('');
    const t = translations[lang];

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

            {/* Chart Area */}
            <div className="animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between mb-4">
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

                    {viewMode === 'COMPANY' && (
                        <div className="px-4 py-2 bg-scifi-danger/20 border border-scifi-danger/50 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                            <span className="text-xl font-bold text-scifi-danger tracking-wide">{selectedDept}</span>
                        </div>
                    )}
                </div>

                <GlassCard className="border-scifi-danger/30">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {viewMode === 'DEPT' ? (
                                <>
                                    <AlertTriangle className="w-5 h-5 text-scifi-danger" />
                                    {t.headers.unpaidDeptTitle}
                                </>
                            ) : (
                                <>
                                    <Database className="w-5 h-5 text-scifi-danger" />
                                    {t.headers.unpaidCompTitle}
                                </>
                            )}
                        </h2>
                    </div>

                    {viewMode === 'DEPT' ? (
                        <UnpaidDeptChart
                            data={unpaidSummary}
                            onBarClick={(dept) => {
                                setSelectedDept(dept);
                                setViewMode('COMPANY');
                            }}
                        />
                    ) : (
                        <UnpaidCompanyChart
                            data={unpaidSummary}
                            selectedDept={selectedDept}
                        />
                    )}
                </GlassCard>
            </div>
        </div>
    );
};
