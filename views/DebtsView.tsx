import React from "react";
import { Debt, Account } from "../types";
import { Trash2, AlertCircle } from "lucide-react";

interface Props {
  debts: Debt[];
  accounts: Account[];
  userCountry: string;
  mainCurrency: string;
  onDeleteDebt: (id: string) => void;
  onPayDebt: (debt: Debt) => void;
  onAddDebt: () => void;
}

export const DebtsView: React.FC<Props> = ({
  debts,
  accounts,
  userCountry,
  mainCurrency,
  onDeleteDebt,
  onPayDebt,
  onAddDebt,
}) => {
  const currencyPrefix = userCountry !== "Venezuela" ? mainCurrency + " " : "$";
  const hasAccounts = accounts.length > 0;

  const sumDebts = (type: "I_OWE" | "OWES_ME") =>
    debts
      .filter(
        (d) =>
          d.type === type &&
          !d.isPaid &&
          (userCountry === "Venezuela" ? d.currency === "USD" : true),
      )
      .reduce((a, b) => a + (b.amount - b.paidAmount), 0);

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

      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-red-50 p-4 rounded-xl border border-red-100">
          <span className="text-red-500 text-xs uppercase font-bold">
            Por Pagar
          </span>
          <p className="text-xl font-bold text-red-700 mt-1">
            {currencyPrefix}
            {sumDebts("I_OWE")}
          </p>
        </div>
        <div className="flex-1 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
          <span className="text-emerald-500 text-xs uppercase font-bold">
            Por Cobrar
          </span>
          <p className="text-xl font-bold text-emerald-700 mt-1">
            {currencyPrefix}
            {sumDebts("OWES_ME")}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {debts.map((debt) => (
          <div
            key={debt.id}
            className={
              "bg-white p-4 rounded-xl shadow-sm border border-slate-100 " +
              (debt.isPaid ? "opacity-60" : "")
            }
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-800">{debt.name}</h4>
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
              </div>
              <div className="flex flex-col items-end">
                <p className="font-bold text-lg">
                  {userCountry === "Venezuela"
                    ? debt.currency === "USD"
                      ? "$"
                      : "Bs."
                    : mainCurrency + " "}
                  {debt.amount}
                </p>
                <button
                  onClick={() => onDeleteDebt(debt.id)}
                  className="text-slate-400 hover:text-red-500 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 mb-3 overflow-hidden">
              <div
                className={
                  "h-full " +
                  (debt.type === "I_OWE" ? "bg-red-500" : "bg-emerald-500")
                }
                style={{
                  width:
                    Math.min((debt.paidAmount / debt.amount) * 100, 100) + "%",
                }}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
              <span>Pagado: {debt.paidAmount}</span>
              <span>Restante: {debt.amount - debt.paidAmount}</span>
            </div>
            {!debt.isPaid &&
              (hasAccounts ? (
                <button
                  onClick={() => onPayDebt(debt)}
                  className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
                >
                  Abonar
                </button>
              ) : (
                <div className="w-full py-2 bg-slate-100 text-slate-400 rounded-lg text-sm text-center cursor-not-allowed">
                  Crea una cuenta para abonar
                </div>
              ))}
          </div>
        ))}

        {debts.length === 0 && (
          <p className="text-center text-slate-400 py-8">
            ¡Estás libre de deudas!
          </p>
        )}

        <button
          onClick={onAddDebt}
          className="w-full p-4 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-slate-400 font-medium hover:border-blue-500 hover:text-blue-500 transition-colors mt-4"
        >
          + Agregar Deuda
        </button>
      </div>
    </div>
  );
};
