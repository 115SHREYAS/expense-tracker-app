import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/upload/hdfc", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Upload Statement</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileSpreadsheet className="text-green-600" size={24} />
          <div>
            <h2 className="font-semibold text-gray-900">HDFC Bank Statement</h2>
            <p className="text-sm text-gray-500">Upload your HDFC bank account statement in XLS format</p>
          </div>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            file ? "border-blue-300 bg-blue-50" : "border-gray-300 hover:border-gray-400"
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) setFile(f);
          }}
        >
          <Upload className="mx-auto text-gray-400 mb-3" size={32} />
          {file ? (
            <div>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                onClick={() => { setFile(null); setResult(null); setError(""); }}
                className="text-xs text-red-600 hover:underline mt-2"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-1">Drag & drop your XLS file here, or</p>
              <label className="text-sm text-blue-600 hover:underline cursor-pointer font-medium">
                browse files
                <input
                  type="file"
                  accept=".xls,.xlsx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFile(f);
                  }}
                />
              </label>
            </div>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full mt-4 py-2.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? "Processing..." : "Upload & Import"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600 shrink-0" size={20} />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="text-green-600" size={20} />
            <h3 className="font-semibold text-green-900">Import Successful</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{result.total}</p>
              <p className="text-xs text-gray-500">Total Found</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{result.imported}</p>
              <p className="text-xs text-gray-500">Imported</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{result.duplicates}</p>
              <p className="text-xs text-gray-500">Duplicates Skipped</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/transactions")}
            className="w-full mt-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Review Transactions
          </button>
        </div>
      )}
    </div>
  );
}
