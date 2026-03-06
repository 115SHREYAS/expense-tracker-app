import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { FileSpreadsheet, CheckCircle, AlertCircle, Lock } from "lucide-react";
import UploadIllustration from "../components/illustrations/UploadIllustration";

type Bank = "HDFC" | "SBI";

const BANK_CONFIG: Record<Bank, { label: string; accept: string; description: string }> = {
  HDFC: { label: "HDFC Bank", accept: ".xls,.xlsx", description: "Upload your HDFC bank account statement in XLS format" },
  SBI: { label: "SBI Bank", accept: ".xlsx", description: "Upload your SBI bank account statement in XLSX format" },
};

export default function UploadPage() {
  const [bank, setBank] = useState<Bank>("HDFC");
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const config = BANK_CONFIG[bank];

  const handleBankChange = (newBank: Bank) => {
    setBank(newBank);
    setFile(null);
    setPassword("");
    setResult(null);
    setError("");
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    if (bank === "SBI" && password) {
      formData.append("password", password);
    }

    try {
      const res = await api.post(`/upload/${bank.toLowerCase()}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: string } } };
      setError(errorResponse.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Upload Statement</h1>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        {/* Bank Selector */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Bank</label>
          <div className="flex gap-2">
            {(Object.keys(BANK_CONFIG) as Bank[]).map((b) => (
              <button
                key={b}
                onClick={() => handleBankChange(b)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  bank === b
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {BANK_CONFIG[b].label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-xl">
            <FileSpreadsheet className="text-green-600" size={22} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">{config.label} Statement</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{config.description}</p>
          </div>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-6 sm:p-10 text-center transition-all ${
            file
              ? "border-blue-400 bg-blue-50/60 dark:border-blue-600 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700/30"
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) setFile(f);
          }}
        >
          <div className="w-32 mx-auto mb-4">
            <UploadIllustration isDragging={!file} />
          </div>
          {file ? (
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{file.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                onClick={() => { setFile(null); setResult(null); setError(""); }}
                className="text-xs text-red-600 dark:text-red-400 hover:underline mt-2 font-medium"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Drag & drop your file here, or</p>
              <label className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-semibold">
                browse files
                <input
                  type="file"
                  accept={config.accept}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFile(f);
                  }}
                />
              </label>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Accepted: {config.accept}</p>
            </div>
          )}
        </div>

        {/* Password field for SBI */}
        {bank === "SBI" && (
          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <Lock size={14} />
              File Password (if protected)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave empty if file is not password-protected"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              SBI statements are typically protected with your account number or registered mobile number
            </p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full mt-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
        >
          {uploading ? "Processing…" : "Upload & Import"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600 dark:text-red-400 shrink-0" size={20} />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="text-green-600" size={22} />
            <h3 className="font-semibold text-green-900 dark:text-green-300 text-lg">Import Successful!</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-3">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{result.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Found</p>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-3">
              <p className="text-2xl font-bold text-green-600">{result.imported}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Imported</p>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-3">
              <p className="text-2xl font-bold text-amber-600">{result.duplicates}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Duplicates Skipped</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/transactions")}
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm hover:shadow-md"
          >
            Review Transactions →
          </button>
        </div>
      )}
    </div>
  );
}
