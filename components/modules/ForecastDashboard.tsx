import React, { useState } from 'react';
import { BarChart2, Search, ArrowLeft, ChevronRight } from 'lucide-react';
import { ForecastSummary, PurchaseRecord, Language } from '../../types';
import { ForecastChart } from '../charts/CycleCharts';
import { PaymentIntelligence } from '../PaymentIntelligence';
import { translations } from '../../services/translations';
import { GlassCard } from '../ui/GlassCard';

interface ForecastDashboardProps {
    forecastSummary: ForecastSummary;
    processedData: PurchaseRecord[];
    lang: Language;
}

type ViewMode = 'HOME' | 'CHART' | 'DETAILS';

export const ForecastDashboard: React.FC<ForecastDashboardProps> = ({ forecastSummary, processedData, lang }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('HOME');
    const [selectedDrillDept, setSelectedDrillDept] = useState<string>('');
    const t = translations[lang];

    // Render Home (Parallel Modules)
    if (viewMode === 'HOME') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-300">
                {/* Module 1: Overview Chart */}
                <div
                    onClick={() => setViewMode('CHART')}
                    className="group relative overflow-hidden rounded-2xl bg-[#0f172a] border border-scifi-border hover:border-scifi-primary transition-all cursor-pointer p-8 h-[300px] flex flex-col justify-between shadow-lg hover:shadow-scifi-primary/20"
                >
                    <div className="absolute top-0 left-0 w-1 h-full bg-scifi-primary group-hover:w-2 transition-all" />
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-scifi-primary/10 rounded-full blur-3xl group-hover:bg-scifi-primary/20 transition-all" />

                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-scifi-primary/20 rounded-lg text-scifi-primary">
                                <BarChart2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-white tracking-wide">
                                {t.headers.forecastTitle}
                            </h3>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Visual breakdown of payments due this week. Analyze trends and distribution by department.
                        </p>
                    </div>

                    <div className="flex items-center text-scifi-primary text-sm font-mono uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                        View Analysis <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                </div>

                {/* Module 2: Intelligence Node (Details) */}
                <div
                    onClick={() => {
                        setSelectedDrillDept(''); // Reset drill-down when entering normally
                        setViewMode('DETAILS');
                    }}
                    className="group relative overflow-hidden rounded-2xl bg-[#0f172a] border border-scifi-border hover:border-scifi-warning transition-all cursor-pointer p-8 h-[300px] flex flex-col justify-between shadow-lg hover:shadow-scifi-warning/20"
                >
                    <div className="absolute top-0 left-0 w-1 h-full bg-scifi-warning group-hover:w-2 transition-all" />
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-scifi-warning/10 rounded-full blur-3xl group-hover:bg-scifi-warning/20 transition-all" />

                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-scifi-warning/20 rounded-lg text-scifi-warning">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-white tracking-wide">
                                Payment Intelligence
                            </h3>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Detailed data tables, search functionality, and predictive analysis for unpaid invoices.
                        </p>
                    </div>

                    <div className="flex items-center text-scifi-warning text-sm font-mono uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                        Access Data <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                </div>
            </div>
        );
    }

    // Render Chart View
    if (viewMode === 'CHART') {
        return (
            <div className="animate-in slide-in-from-right duration-300">
                <button
                    onClick={() => setViewMode('HOME')}
                    className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-mono uppercase"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>
                <GlassCard className="border-scifi-primary/30">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-scifi-primary" />
                            {t.headers.forecastTitle}
                        </h2>
                    </div>
                    <ForecastChart
                        data={forecastSummary}
                        view="DEPT"
                        onBarClick={(deptName) => {
                            setSelectedDrillDept(deptName);
                            setViewMode('DETAILS');
                        }}
                    />
                </GlassCard>
            </div>
        );
    }

    // Render Details View
    if (viewMode === 'DETAILS') {
        return (
            <div className="animate-in slide-in-from-right duration-300">
                <button
                    onClick={() => setViewMode('HOME')}
                    className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-mono uppercase"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>

                {/* We use standalone=true to force it open without the toggle button */}
                <PaymentIntelligence
                    forecastData={forecastSummary.allRecords}
                    historyData={processedData}
                    lang={lang}
                    standalone={true}
                    initialView={selectedDrillDept ? 'DEPT_COMPANY_DETAILS' : 'DEPT_SUMMARY'}
                    initialDept={selectedDrillDept}
                    key={selectedDrillDept} // Force re-mount to apply initial props
                />
            </div>
        );
    }

    return null;
};
