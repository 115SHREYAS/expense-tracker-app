import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import api from "../lib/api";

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface SplitEntry {
  categoryId: string;
  amount: string;
}

interface TransactionSplit {
  id: string;
  categoryId: string;
  amount: number;
  category: Category;
}

interface SplitTransaction {
  id: string;
  description: string;
  amount: number;
  isSplit: boolean;
  splits: TransactionSplit[];
}

export default function SplitModal({
  transaction,
  categories,
  onClose,
  onSaved,
}: {
  transaction: SplitTransaction;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [entries, setEntries] = useState<SplitEntry[]>([
    { categoryId: "", amount: "" },
    { categoryId: "", amount: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill if already split
  useEffect(() => {
    if (transaction.isSplit && transaction.splits.length >= 2) {
      setEntries(
        transaction.splits.map((s) => ({
          categoryId: s.categoryId,
          amount: String(s.amount),
        }))
      );
    }
  }, [transaction]);

  const totalAmount = transaction.amount;
  const allocated = entries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const remaining = Math.round((totalAmount - allocated) * 100) / 100;

  const usedCategoryIds = new Set(entries.map((e) => e.categoryId).filter(Boolean));

  const updateEntry = (index: number, field: keyof SplitEntry, value: string) => {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  };

  const addRow = () => {
    setEntries((prev) => [...prev, { categoryId: "", amount: "" }]);
  };

  const removeRow = (index: number) => {
    if (entries.length <= 2) return;
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setError("");
    const splits = entries.map((e) => ({
      categoryId: e.categoryId,
      amount: parseFloat(e.amount) || 0,
    }));

    if (splits.some((s) => !s.categoryId)) {
      setError("All rows must have a category selected");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/transactions/${transaction.id}/split`, { splits });
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save split");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSplit = async () => {
    setLoading(true);
    try {
      await api.delete(`/transactions/${transaction.id}/split`);
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to remove split");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);

  const canSave = remaining === 0 && entries.length >= 2 && entries.every((e) => e.categoryId && parseFloat(e.amount) > 0);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Split Transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Transaction info */}
        <div className="bg-gray-50 rounded-md p-3 mb-4">
          <p className="text-sm text-gray-600 truncate">{transaction.description}</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{formatCurrency(totalAmount)}</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md mb-4">{error}</div>}

        {/* Split rows */}
        <div className="space-y-3 mb-4">
          {entries.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={entry.categoryId}
                onChange={(e) => updateEntry(index, "categoryId", e.target.value)}
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                    disabled={usedCategoryIds.has(c.id) && entry.categoryId !== c.id}
                  >
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={entry.amount}
                onChange={(e) => updateEntry(index, "amount", e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-28 px-2 py-1.5 border border-gray-300 rounded-md text-sm text-right"
              />
              <button
                onClick={() => removeRow(index)}
                disabled={entries.length <= 2}
                className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Add row */}
        <button
          onClick={addRow}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-4"
        >
          <Plus size={14} />
          Add Category
        </button>

        {/* Remaining indicator */}
        <div className={`text-sm font-medium mb-4 px-3 py-2 rounded-md ${
          remaining === 0
            ? "bg-green-50 text-green-700"
            : "bg-amber-50 text-amber-700"
        }`}>
          Remaining: {formatCurrency(remaining)}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {transaction.isSplit && (
            <button
              onClick={handleRemoveSplit}
              disabled={loading}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 disabled:opacity-50"
            >
              Remove Split
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={loading || !canSave}
            className="flex-1 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving..." : "Save Split"}
          </button>
        </div>
      </div>
    </div>
  );
}
