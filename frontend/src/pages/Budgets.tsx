import { useState, useEffect, useCallback } from "react";
import api from "../lib/api";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import TargetIllustration from "../components/illustrations/TargetIllustration";

interface BudgetItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  amount: number;
  spent: number;
  month: number;
  year: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Budgets() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [formData, setFormData] = useState({ categoryId: "", amount: "" });
  const [error, setError] = useState("");

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const [budgetRes, catRes] = await Promise.all([
        api.get("/budgets", { params: { month, year } }),
        api.get("/categories"),
      ]);
      setBudgets(budgetRes.data.budgets);
      setCategories(catRes.data);
    } catch (err) {
      console.error("Failed to fetch budgets:", err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const getPercentage = (spent: number, amount: number) =>
    amount > 0 ? Math.round((spent / amount) * 100) : 0;

  const getStatusColor = (pct: number) => {
    if (pct >= 100) return { bar: "bg-red-500", text: "text-red-600", bg: "bg-red-50 dark:bg-red-900/30" };
    if (pct >= 80) return { bar: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/30" };
    return { bar: "bg-green-500", text: "text-green-600", bg: "bg-green-50 dark:bg-green-900/30" };
  };

  // Categories not already budgeted this month
  const availableCategories = categories.filter(
    (c) => !budgets.some((b) => b.categoryId === c.id)
  );

  const handleCreate = async () => {
    setError("");
    if (!formData.categoryId || !formData.amount) {
      setError("Please select a category and enter an amount");
      return;
    }
    try {
      await api.post("/budgets", {
        categoryId: formData.categoryId,
        amount: parseFloat(formData.amount),
        month,
        year,
      });
      setShowForm(false);
      setFormData({ categoryId: "", amount: "" });
      fetchBudgets();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: string } } };
      setError(errorResponse.response?.data?.error || "Failed to create budget");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editAmount || parseFloat(editAmount) <= 0) return;
    try {
      await api.put(`/budgets/${id}`, { amount: parseFloat(editAmount) });
      setEditingId(null);
      fetchBudgets();
    } catch (err) {
      console.error("Failed to update budget:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/budgets/${id}`);
      fetchBudgets();
    } catch (err) {
      console.error("Failed to delete budget:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-600" />
        <p className="text-sm text-gray-400 dark:text-gray-500">Loading budgets…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Monthly Budgets</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button onClick={prevMonth} className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold px-2 min-w-[130px] text-center text-gray-900 dark:text-gray-100">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300">
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            onClick={() => { setShowForm(true); setError(""); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            <Plus size={16} />
            Add Budget
          </button>
        </div>
      </div>

      {/* Add Budget Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Budget</h2>
            <button onClick={() => setShowForm(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">{error}</div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Select category...</option>
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">{c.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Amount (INR)"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full sm:w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
            <button
              onClick={handleCreate}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Budget List */}
      {budgets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center flex flex-col items-center shadow-sm">
          <div className="w-48 mb-6">
            <TargetIllustration />
          </div>
          <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">No budgets set for this month.</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Add one to start tracking your spending!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const pct = getPercentage(budget.spent, budget.amount);
            const colors = getStatusColor(pct);
            const isEditing = editingId === budget.id;

            return (
              <div key={budget.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{budget.categoryName}</span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdate(budget.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingId(budget.id); setEditAmount(String(budget.amount)); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(budget.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-2">
                  <div
                    className={`h-3 rounded-full transition-all ${colors.bar}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Spent: <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(budget.spent)}</span></span>
                  <span>Budget: <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(budget.amount)}</span></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
