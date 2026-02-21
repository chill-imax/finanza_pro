import React from "react";
import { Account, Currency, AccountType } from "../types";
import { AccountCard } from "../components/AccountCard";
import { Trash2 } from "lucide-react";

interface Props {
  accounts: Account[];
  userCountry: string;
  mainCurrency: string;
  onEdit: (acc: Account) => void;
  onDeleteAttempt: (acc: Account) => void;
  onAddAccount: () => void;
}

export const AccountsView: React.FC<Props> = ({
  accounts,
  userCountry,
  mainCurrency,
  onEdit,
  onDeleteAttempt,
  onAddAccount,
}) => (
  <div className="space-y-4 pb-24">
    <h2 className="text-2xl font-bold text-slate-800">Mis Cuentas</h2>
    <div className="grid grid-cols-1 gap-4">
      {accounts.map((acc) => (
        <div key={acc.id} className="relative group">
          <AccountCard
            account={acc}
            onClick={() => {}}
            onEdit={(e) => {
              e.stopPropagation();
              onEdit(acc);
            }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteAttempt(acc);
            }}
            className="absolute top-2 left-2 p-2 bg-black/20 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        onClick={onAddAccount}
        className="p-4 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-slate-400 font-medium hover:border-blue-500 hover:text-blue-500 transition-colors"
      >
        + Agregar Cuenta
      </button>
    </div>
  </div>
);
