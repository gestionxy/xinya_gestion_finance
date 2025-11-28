import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface MultiSelectProps {
    label: string;
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (option: string) => {
        const newSelected = selected.includes(option)
            ? selected.filter(item => item !== option)
            : [...selected, option];
        onChange(newSelected);
    };

    const handleSelectAll = () => {
        if (selected.length === options.length) {
            onChange([]);
        } else {
            onChange(options);
        }
    };

    return (
        <div className="flex flex-col gap-1.5" ref={containerRef}>
            <label className="text-xs text-scifi-accent font-mono uppercase">{label}</label>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full bg-scifi-card border border-scifi-border rounded p-2 text-sm text-white focus:border-scifi-primary outline-none flex items-center justify-between transition-colors hover:border-scifi-primary/50"
                >
                    <span className="truncate">
                        {selected.length === 0
                            ? '选择部门...'
                            : selected.length === options.length
                                ? '全部部门'
                                : `已选 ${selected.length} 个部门`}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-[#0f172a] border border-scifi-border rounded shadow-xl z-[100] max-h-60 overflow-y-auto">
                        <div
                            onClick={handleSelectAll}
                            className="px-3 py-2 hover:bg-white/5 cursor-pointer flex items-center gap-2 text-sm text-scifi-primary border-b border-scifi-border/50"
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selected.length === options.length ? 'bg-scifi-primary border-scifi-primary' : 'border-gray-500'}`}>
                                {selected.length === options.length && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span>全选 / 取消全选</span>
                        </div>
                        {options.map(option => (
                            <div
                                key={option}
                                onClick={() => toggleOption(option)}
                                className="px-3 py-2 hover:bg-white/5 cursor-pointer flex items-center gap-2 text-sm text-gray-300"
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${selected.includes(option) ? 'bg-scifi-primary border-scifi-primary' : 'border-gray-500'}`}>
                                    {selected.includes(option) && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span>{option}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
