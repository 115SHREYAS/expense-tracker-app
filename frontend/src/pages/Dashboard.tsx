import { useState, useEffect } from "react";
import api from "../lib/api";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingDown, TrendingUp, ArrowRightLeft, AlertTriangle, Target, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import EmptyStateIllustration from "../components/illustrations/EmptyStateIllustration";

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"];

interface Summary {
  totalExpense: number;
  totalIncome: number;
  transactionCount: number;
}

interface CategoryBreakdown {
  categoryId: string | null;
  categoryName: string;
  total: number;
  count: number;
}

interface TimeData {
  date: string;
  amount: number;
}

interface BudgetStatus {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  budgetAmount: number;
  spent: number;
  percentage: number;
  status: "under" | "warning" | "over";
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([]);
  const [timeData, setTimeData] = useState<TimeData[]>([]);
  const [budgetStatuses, setBudgetStatuses] = useState<BudgetStatus[]>([]);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const { resolved } = useTheme();
  const isDark = resolved === "dark";

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    if (period === "week") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (period === "month") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }
    return { startDate: startDate.toISOString(), endDate: now.toISOString() };
  };

  useEffect(() => {
    const { startDate, endDate } = getDateRange();
    const now = new Date();
    setLoading(true);
    Promise.all([
      api.get("/analytics/summary", { params: { startDate, endDate } }),
      api.get("/analytics/by-category", { params: { startDate, endDate } }),
      api.get("/analytics/over-time", { params: { startDate, endDate, groupBy: period === "year" ? "month" : "day" } }),
      api.get("/analytics/budget-status", { params: { month: now.getMonth() + 1, year: now.getFullYear() } }),
    ])
      .then(([summaryRes, categoryRes, timeRes, budgetRes]) => {
        setSummary(summaryRes.data);
        setCategoryData(categoryRes.data);
        setTimeData(timeRes.data);
        setBudgetStatuses(budgetRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const tooltipStyle = {
    backgroundColor: isDark ? "#1f2937" : "#fff",
    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
    color: isDark ? "#f3f4f6" : "#111827",
  };

  const axisTickColor = isDark ? "#9ca3af" : undefined;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-600" />
        <p className="text-sm text-gray-400 dark:text-gray-500">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {(["week", "month", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-all ${
                period === p
                  ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm font-semibold"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 border-l-4 border-l-red-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 dark:bg-red-900/30 rounded-xl">
              <TrendingDown className="text-red-500" size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Expenses</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{formatCurrency(summary?.totalExpense || 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 border-l-4 border-l-green-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 dark:bg-green-900/30 rounded-xl">
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Income</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{formatCurrency(summary?.totalIncome || 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 border-l-4 border-l-blue-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <ArrowRightLeft className="text-blue-500" size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Transactions</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{summary?.transactionCount || 0}</p>
            </div>
          </div>
        </div>
        {(() => {
          const net = (summary?.totalIncome || 0) - (summary?.totalExpense || 0);
          const isPositive = net >= 0;
          return (
            <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow border-l-4 ${isPositive ? "border-l-teal-400" : "border-l-orange-400"}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isPositive ? "bg-teal-50 dark:bg-teal-900/30" : "bg-orange-50 dark:bg-orange-900/30"}`}>
                  <Wallet className={isPositive ? "text-teal-500" : "text-orange-500"} size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Net Balance</p>
                  <p className={`text-xl font-bold mt-0.5 ${isPositive ? "text-teal-600 dark:text-teal-400" : "text-orange-600 dark:text-orange-400"}`}>
                    {isPositive ? "+" : ""}{formatCurrency(net)}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Budget Alert Banners */}
      {budgetStatuses.filter((b) => b.status === "over" || b.status === "warning").length > 0 && (
        <div className="space-y-2">
          {budgetStatuses
            .filter((b) => b.status === "over" || b.status === "warning")
            .map((b) => (
              <div
                key={b.budgetId}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  b.status === "over"
                    ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                    : "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                }`}
              >
                <AlertTriangle size={18} />
                <span className="text-sm font-medium">
                  {b.categoryName} is {b.status === "over" ? "over budget" : "approaching budget"} — spent{" "}
                  {formatCurrency(b.spent)} of {formatCurrency(b.budgetAmount)} ({b.percentage}%)
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Budget Tracker */}
      {budgetStatuses.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Budget Tracker</h2>
            </div>
            <Link to="/budgets" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:underline">
              Manage →
            </Link>
          </div>
          <div className="space-y-4">
            {budgetStatuses.map((b) => {
              const barColor =
                b.status === "over" ? "bg-red-500" : b.status === "warning" ? "bg-amber-500" : "bg-green-500";
              return (
                <div key={b.budgetId}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{b.categoryName}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(b.spent)} / {formatCurrency(b.budgetAmount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${barColor}`}
                      style={{ width: `${Math.min(b.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Over Time */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Spending Over Time</h2>
          {timeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#f0f0f0"} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: axisTickColor }}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12, fill: axisTickColor }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [formatCurrency(value as number), "Spent"]}
                  labelFormatter={(label) => new Date(label).toLocaleDateString("en-IN")}
                />
                <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-10">
              <EmptyStateIllustration message="No spending data for this period" />
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">By Category</h2>
          {categoryData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="total"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {categoryData.slice(0, 6).map((cat, i) => (
                  <div key={cat.categoryName} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {cat.categoryName}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-10">
              <EmptyStateIllustration message="No category data for this period" />
            </div>
          )}
        </div>
      </div>

      {/* Category Table */}
      {categoryData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Category Details</h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-5 py-3">Category</th>
                <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-5 py-3">Transactions</th>
                <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-5 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {categoryData.map((cat, i) => (
                <tr key={cat.categoryName} className="hover:bg-blue-50/40 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-gray-900 dark:text-gray-100">{cat.categoryName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-gray-500 dark:text-gray-400">{cat.count}</td>
                  <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(cat.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
