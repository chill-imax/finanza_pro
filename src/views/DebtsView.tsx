import React, { useState } from "react";
import { Debt, Account, Transaction } from "../types";
import { Trash2, AlertCircle, ChevronDown, ChevronUp, Calendar, History } from "lucide-react";

interface Props {
  debts: Debt[];
  accounts: Account[];
  transactions: Transaction[];
  userCountry: string;
  mainCurrency: string;
  onDeleteDebt: (id: string) => void;
  onPayDebt: (debt: Debt) => void;
  onAddDebt: () => void;
}

export const DebtsView: React.FC<Props> = ({
  debts,
  accounts,
  transactions,
  userCountry,
  mainCurrency,
  onDeleteDebt,
  onPayDebt,
  onAddDebt,
}) => {
  const [showPaid, setShowPaid] = useState(false);
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);

  const currencyPrefix = userCountry !== "Venezuela" ? mainCurrency + " " : "$";
  const hasAccounts = accounts.length > 0;

  // 1. Separar las deudas
  const activeDebts = debts.filter((d) => !d.isPaid);
  const paidDebts = debts.filter((d) => d.isPaid);

  const sumDebts = (type: "I_OWE" | "OWES_ME") =>
    activeDebts
      .filter(
        (d) =>
          d.type === type &&
          (userCountry === "Venezuela" ? d.currency === "USD" : true),
      )
      .reduce((a, b) => a + (b.amount - b.paidAmount), 0);

  // Helper para dar formato a la fecha (YYYY-MM-DD a DD/MM/YYYY)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  // Función auxiliar para renderizar la tarjeta de la deuda
  const renderDebtCard = (debt: Debt) => {
    const isExpanded = expandedDebtId === debt.id;
    
    // Obtener los abonos de esta deuda específica y ordenarlos del más reciente al más antiguo
    const debtTransactions = transactions
      .filter((t) => t.linkedDebtId === debt.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div
        key={debt.id}
        className={
          "bg-white p-4 rounded-xl shadow-sm border border-slate-100 transition-all " +
          (debt.isPaid ? "opacity-75 bg-slate-50" : "")
        }
      >
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-slate-800">{debt.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={
                  "text-xs px-2 py-0.5 rounded font-medium " +
                  (debt.type === "I_OWE"
                    ? "bg-red-100 text-red-600"
                    : "bg-emerald-100 text-emerald-600")
                }
              >
                {debt.type === "I_OWE" ? "Debo" : "Me deben"}
              </span>
              
              {/* Etiqueta de fecha límite si existe */}
              {debt.dueDate && (
                <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Límite: {formatDate(debt.dueDate)}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <p className="font-bold text-lg">
              {userCountry === "Venezuela"
                ? debt.currency === "USD"
                  ? "$"
                  : "Bs."
                : mainCurrency + " "}
              {debt.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <button
              onClick={() => onDeleteDebt(debt.id)}
              className="text-slate-400 hover:text-red-500 p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de progreso de pago */}
        <div className="w-full bg-slate-100 rounded-full h-2 mt-4 mb-3 overflow-hidden">
          <div
            className={
              "h-full transition-all duration-500 " +
              (debt.type === "I_OWE" ? "bg-red-500" : "bg-emerald-500")
            }
            style={{
              width: Math.min((debt.paidAmount / debt.amount) * 100, 100) + "%",
            }}
          />
        </div>

        <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
          <span>
            Pagado: {debt.paidAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
          <span>
            Restante: {(debt.amount - debt.paidAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>

        {!debt.isPaid && (
          hasAccounts ? (
            <button
              onClick={() => onPayDebt(debt)}
              className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors mt-2"
            >
              Abonar
            </button>
          ) : (
            <div className="w-full py-2 bg-slate-100 text-slate-400 rounded-lg text-sm text-center cursor-not-allowed mt-2">
              Crea una cuenta para abonar
            </div>
          )
        )}

        {/* ── Desplegable de Historial de Abonos ── */}
        {debtTransactions.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-2">
            <button
              onClick={() => setExpandedDebtId(isExpanded ? null : debt.id)}
              className="flex items-center justify-between w-full p-2 hover:bg-slate-100 rounded-lg text-sm text-slate-600 font-medium transition-colors"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <span>Ver historial de abonos ({debtTransactions.length})</span>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isExpanded && (
              <div className="mt-2 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 animate-fade-in">
                {debtTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center text-sm border-b border-slate-200 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="font-medium text-slate-600">
                      {formatDate(tx.date)}
                    </span>
                    <span className="font-bold text-slate-800">
                      {userCountry === "Venezuela" ? (debt.currency === "USD" ? "$" : "Bs.") : mainCurrency + " "}
                      {tx.debtPaymentAmount?.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      }) || tx.amount.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-24">
      <h2 className="text-2xl font-bold text-slate-800">Control de Deudas</h2>

      {!hasAccounts && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">
              Sin cuentas disponibles
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Crea al menos una cuenta para registrar pagos o cobros de deudas.
            </p>
          </div>
        </div>
      )}

      {/* ── Resumen por pagar / por cobrar (Solo activas) ── */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">
          <span className="text-red-500 text-xs uppercase font-bold">Por Pagar</span>
          <p className="text-xl font-bold text-red-700 mt-1">
            {currencyPrefix}
            {sumDebts("I_OWE").toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="flex-1 bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
          <span className="text-emerald-500 text-xs uppercase font-bold">Por Cobrar</span>
          <p className="text-xl font-bold text-emerald-700 mt-1">
            {currencyPrefix}
            {sumDebts("OWES_ME").toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* ── Lista de deudas activas ── */}
      <div className="space-y-3">
        {activeDebts.map(renderDebtCard)}

        {activeDebts.length === 0 && (
          <p className="text-center text-slate-400 py-4">
            ¡No tienes deudas activas!
          </p>
        )}

        <button
          onClick={onAddDebt}
          className="w-full p-4 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-slate-400 font-medium hover:border-slate-400 hover:text-slate-500 transition-colors mt-4"
        >
          + Agregar Deuda
        </button>
      </div>

      {/* ── Sección de Deudas Pagadas ── */}
      {paidDebts.length > 0 && (
        <div className="pt-6 border-t border-slate-200">
          <button
            onClick={() => setShowPaid(!showPaid)}
            className="flex items-center justify-between w-full p-3 bg-slate-200/50 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <span className="font-bold text-slate-700">
              Deudas canceladas ({paidDebts.length})
            </span>
            {showPaid ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {showPaid && (
            <div className="space-y-3 mt-4">
              {paidDebts.map(renderDebtCard)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};