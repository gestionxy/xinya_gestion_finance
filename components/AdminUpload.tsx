import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';

export const AdminUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    
    // Simulate Supabase upload delay
    setTimeout(() => {
        // Here we would use: await supabase.storage.from('data').upload(...) 
        // and parse the excel file
        setIsUploading(false);
        setSuccess(true);
        setFile(null);
    }, 2000);
  };

  return (
    <GlassCard title="Data Management Node (Admin)" className="border-scifi-warning/30">
        <div className="flex flex-col gap-6">
            <div className="bg-scifi-bg/50 p-4 rounded-lg border border-scifi-border">
                <h4 className="text-sm font-semibold text-scifi-muted mb-2 uppercase tracking-widest">Operation Protocol</h4>
                <ol className="list-decimal list-inside text-sm text-gray-400 space-y-1">
                    <li>Delete existing source data (Clear Database).</li>
                    <li>Upload updated Excel/CSV file (Target: 'Source Data').</li>
                    <li>System will auto-sync dashboard visuals.</li>
                </ol>
            </div>

            <div className="flex items-center gap-4">
                 <button className="flex items-center gap-2 px-4 py-2 bg-red-900/30 text-red-400 border border-red-800 rounded hover:bg-red-900/50 transition-colors text-sm">
                    <Trash2 className="w-4 h-4" />
                    Purge Database
                 </button>
            </div>

            <div className="border-2 border-dashed border-scifi-border rounded-xl p-8 flex flex-col items-center justify-center bg-scifi-bg/20 hover:border-scifi-primary/50 transition-all group relative">
                <input 
                    type="file" 
                    accept=".csv, .xlsx" 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="p-3 bg-scifi-card rounded-full mb-3 group-hover:scale-110 transition-transform">
                    {success ? <CheckCircle className="w-8 h-8 text-scifi-success" /> : <Upload className="w-8 h-8 text-scifi-primary" />}
                </div>
                <p className="text-sm text-gray-300 font-medium">
                    {file ? file.name : "Drop CSV/Excel file here or click to upload"}
                </p>
            </div>

            {file && !success && (
                <button 
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full py-2 bg-scifi-primary text-white rounded font-medium hover:bg-blue-600 transition-colors flex justify-center items-center gap-2"
                >
                    {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isUploading ? "Uploading to Supabase..." : "Execute Upload"}
                </button>
            )}

            {success && (
                <div className="p-3 bg-green-900/20 border border-green-800 rounded text-center text-green-400 text-sm">
                    Data transmission complete. System updated.
                </div>
            )}
        </div>
    </GlassCard>
  );
};