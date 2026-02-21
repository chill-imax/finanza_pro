import React from "react";
import { Transaction, Category, Account } from "../types";
import { TransactionType } from "../types";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  CheckCircle,
  Flame,
  PiggyBank,
  RefreshCcw,
  Layers,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

interface Props {
  userCountry: string;
  mainCurrency: string;
  bcvRate: number;
  streakCount: number;
  lastLogDate: string;
  grandTotalUSD: number;
  totalBalanceUSD: number;
  totalBalanceVES: number;
  totalBalanceGlobal: number;
  expensesData: { name: string; value: number }[];
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onSkipDay: () => void;
  onPayYourself: () => void;
  onViewAll: () => void;
  onSelectTransaction: (t: Transaction) => void;
}

export const DashboardView: React.FC<Props> = ({
  userCountry,
  mainCurrency,
  bcvRate,
  streakCount,
  lastLogDate,
  grandTotalUSD,
  totalBalanceUSD,
  totalBalanceVES,
  totalBalanceGlobal,
  expensesData,
  transactions,
  categories,
  onSkipDay,
  onPayYourself,
  onViewAll,
  onSelectTransaction,
}) => {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6 pb-24">
      {/* Top bar */}
      <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-100">
        {userCountry === "Venezuela" ? (
          <>
            <div className="flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">
                  Tasa BCV
                </p>
                <p className="font-bold text-slate-800">
                  {bcvRate > 0 ? `Bs. ${bcvRate.toFixed(2)}` : "Cargando..."}
                </p>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2" />
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">
                País
              </p>
              <p className="font-bold text-slate-800">
                {userCountry || "Configurando..."}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Flame
            className={`w-5 h-5 ${streakCount > 0 ? "text-orange-500 fill-orange-500" : "text-slate-300"}`}
          />
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase">
              Racha
            </p>
            <p className="font-bold text-slate-800">{streakCount} días</p>
          </div>
        </div>
      </div>

      {/* Patrimonio */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
          Patrimonio Total Estimado
        </p>
        {userCountry === "Venezuela" ? (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black">
                $
                {grandTotalUSD.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-lg text-slate-400 font-medium">USD</span>
            </div>
            <div className="mt-4 flex gap-4 text-sm text-slate-300">
              <div>
                <span className="block text-[10px] uppercase text-slate-500">
                  En Dólares
                </span>
                <span className="font-semibold">
                  ${totalBalanceUSD.toLocaleString()}
                </span>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <span className="block text-[10px] uppercase text-slate-500">
                  En Bolívares
                </span>
                <span className="font-semibold">
                  Bs. {totalBalanceVES.toLocaleString()}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black">
              {totalBalanceGlobal.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-lg text-slate-400 font-medium ml-1">
              {mainCurrency}
            </span>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {lastLogDate !== today && (
          <button
            onClick={onSkipDay}
            className="flex items-center gap-2 bg-slate-100 text-slate-600 px-5 py-3 rounded-xl font-semibold whitespace-nowrap active:scale-95 transition-transform border border-slate-200"
          >
            <CheckCircle className="w-5 h-5" /> Sin Movimientos
          </button>
        )}
        <button
          onClick={onPayYourself}
          className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-5 py-3 rounded-xl font-semibold whitespace-nowrap active:scale-95 transition-transform"
        >
          <PiggyBank className="w-5 h-5" /> Págate a ti
        </button>
      </div>

      {/* Recientes */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-800">Recientes</h3>
          <button
            onClick={onViewAll}
            className="text-blue-600 text-sm font-medium hover:underline"
          >
            Ver todo
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Sin transacciones aún
            </div>
          ) : (
            transactions.slice(0, 5).map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${tx.type === "INCOME" ? "bg-emerald-100 text-emerald-600" : tx.type === "TRANSFER" ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"}`}
                    >
                      {tx.type === "INCOME" ? (
                        <ArrowUpCircle className="w-5 h-5" />
                      ) : tx.type === "TRANSFER" ? (
                        <ArrowRightLeft className="w-5 h-5" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {cat
                          ? cat.name
                          : tx.type === "TRANSFER"
                            ? "Transferencia"
                            : "Otro"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {tx.note || tx.date}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-bold ${tx.type === "INCOME" ? "text-emerald-600" : "text-slate-800"}`}
                  >
                    {tx.type === "INCOME" ? "+" : "-"}
                    {userCountry === "Venezuela"
                      ? tx.currency === "USD"
                        ? "$"
                        : "Bs."
                      : mainCurrency + " "}
                    {tx.amount.toLocaleString()}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pie chart */}
      {expensesData.length > 0 && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg text-slate-800 mb-4">
            Gastos ({userCountry === "Venezuela" ? "USD" : mainCurrency})
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expensesData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
