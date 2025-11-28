import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';

interface DatePickerProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    min?: string;
    max?: string;
    className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ label, value, onChange, min, max, className = "" }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleContainerClick = () => {
        // Programmatically open the date picker when the container is clicked
        if (inputRef.current) {
            try {
                inputRef.current.showPicker();
            } catch (error) {
                // Fallback for browsers that don't support showPicker (though most modern ones do)
                inputRef.current.focus();
            }
        }
    };

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label className="text-xs text-scifi-accent font-mono uppercase">{label}</label>
            <div
                onClick={handleContainerClick}
                className="relative group cursor-pointer"
            >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400 group-hover:text-scifi-primary transition-colors" />
                </div>
                <input
                    ref={inputRef}
                    type="date"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    min={min}
                    max={max}
                    className="bg-scifi-card border border-scifi-border rounded p-2 pl-10 w-full text-sm text-white focus:border-scifi-primary outline-none cursor-pointer transition-colors hover:border-scifi-primary/50"
                />
            </div>
        </div>
    );
};
