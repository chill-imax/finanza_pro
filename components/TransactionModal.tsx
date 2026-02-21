import React, { useState, useEffect, useMemo } from 'react';
import { Account, Category, TransactionType, Currency, Frequency } from '../types';
import { X, RefreshCw, CalendarRange } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[]; // Dynamic categories
  onSave: (data: any) => void;
  currentExchangeRate: number;
  initialData?: Partial<{
    type: TransactionType;
    amount: number;
    accountId: string;
    toAccountId: string;
    categoryId: string;
    note: string;
  }> | null;
  onAddCategory: () => void; // Trigger for category modal
}

export const TransactionModal: React.FC<Props> = ({ isOpen, onClose, accounts, categories, onSave, currentExchangeRate, initialData, onAddCategory }) => {
  const userCountry = localStorage.getItem('user_country') || 'Venezuela';
  const mainCurrency = localStorage.getItem('main_currency') || 'USD';

  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  
  // Input State
  const [amount, setAmount] = useState('');
  const [inputCurrency, setInputCurrency] = useState<Currency | string>(Currency.USD);
  
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Recurring State
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>(Frequency.MONTHLY);
  const [customInterval, setCustomInterval] = useState(1);
  const [customUnit, setCustomUnit] = useState<'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS'>('MONTHS');
  
  // Exchange Rate Logic
  const [customExchangeRate, setCustomExchangeRate] = useState<string>('');

  // Initialize Data
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type || TransactionType.EXPENSE);
        setAmount(initialData.amount ? initialData.amount.toString() : '');
        setAccountId(initialData.accountId || accounts[0]?.id || '');
        const initialAcc = accounts.find(a => a.id === (initialData.accountId || accounts[0]?.id));
        
        setInputCurrency(userCountry === 'Venezuela' ? (initialAcc?.currency || Currency.USD) : mainCurrency);
        
        setToAccountId(initialData.toAccountId || (accounts.length > 1 ? accounts[1].id : ''));
        setCategoryId(initialData.categoryId || categories[0]?.id || '');
        setNote(initialData.note || '');
      } else {
        setType(TransactionType.EXPENSE);
        setAmount('');
        setAccountId(accounts[0]?.id || '');
        const initialAcc = accounts[0];
        
        setInputCurrency(userCountry === 'Venezuela' ? (initialAcc?.currency || Currency.USD) : mainCurrency);
        
        setToAccountId(accounts.length > 1 ? accounts[1].id : '');
        setCategoryId(categories[0]?.id || '');
        setNote('');
      }
      setDate(new Date().toISOString().split('T')[0]);
      setCustomExchangeRate(currentExchangeRate.toString());
      setIsRecurring(false); // Default off
      setFrequency(Frequency.MONTHLY);
      setCustomInterval(1);
      setCustomUnit('MONTHS');
    }
  }, [isOpen, initialData, accounts, currentExchangeRate, categories, userCountry, mainCurrency]);

  // Derived Values
  const sourceAccount = accounts.find(a => a.id === accountId);
  const targetAccount = accounts.find(a => a.id === toAccountId);

  const isRateNeeded = useMemo(() => {
    if (userCountry !== 'Venezuela') return false; // Solo aplica para Venezuela
    if (!sourceAccount) return false;
    if (inputCurrency !== sourceAccount.currency) return true;
    if (type === TransactionType.TRANSFER && targetAccount) {
        if (sourceAccount.currency !== targetAccount.currency) return true;
    }
    return false;
  }, [inputCurrency, sourceAccount, targetAccount, type, userCountry]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceAccount) return;

    let finalAmount = parseFloat(amount);
    let finalRate = isRateNeeded ? parseFloat(customExchangeRate) : undefined;

    if (userCountry === 'Venezuela' && inputCurrency !== sourceAccount.currency) {
       if (inputCurrency === Currency.USD && sourceAccount.currency === Currency.VES) {
          finalAmount = parseFloat(amount) * parseFloat(customExchangeRate);
       } 
       else if (inputCurrency === Currency.VES && sourceAccount.currency === Currency.USD) {
          finalAmount = parseFloat(amount) / parseFloat(customExchangeRate);
       }
    }

    onSave({
      type,
      amount: finalAmount, 
      currency: sourceAccount.currency,
      accountId,
      toAccountId: type === TransactionType.TRANSFER ? toAccountId : undefined,
      categoryId: type === TransactionType.TRANSFER ? 'TRANSFER' : categoryId,
      note,
      date,
      exchangeRate: finalRate,
      isRecurring,
      frequency,
      customInterval,
      customUnit
    });
    onClose();
  };

  const getSummary = () => {
    if (!sourceAccount || !amount) return null;
    const val = parseFloat(amount);
    const rate = parseFloat(customExchangeRate) || currentExchangeRate;

    let sourceDeduction = val;
    let sourceCurrency = inputCurrency;

    if (userCountry === 'Venezuela' && inputCurrency !== sourceAccount.currency) {
        if (inputCurrency === Currency.USD && sourceAccount.currency === Currency.VES) {
            sourceDeduction = val * rate;
            sourceCurrency = Currency.VES;
        } else if (inputCurrency === Currency.VES && sourceAccount.currency === Currency.USD) {
            sourceDeduction = val / rate;
            sourceCurrency = Currency.USD;
        }
    } else {
        sourceCurrency = sourceAccount.currency;
    }

    let targetAddition = sourceDeduction;

    if (userCountry === 'Venezuela' && type === TransactionType.TRANSFER && targetAccount) {
        if (sourceAccount.currency !== targetAccount.currency) {
             if (sourceAccount.currency === Currency.USD && targetAccount.currency === Currency.VES) {
                 targetAddition = sourceDeduction * rate;
             } else if (sourceAccount.currency === Currency.VES && targetAccount.currency === Currency.USD) {
                 targetAddition = sourceDeduction / rate;
             }
        }
    }

    const formatCurrency = (amount: number, currencyCode: string) => {
       if (userCountry === 'Venezuela') {
           return currencyCode === 'USD' ? `$${amount.toLocaleString(undefined, {maximumFractionDigits: 2})}` : `Bs.${amount.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
       }
       return `${mainCurrency} ${amount.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
    };

    return (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 mt-4">
            <div className="flex justify-between">
                <span>Se descontará ({sourceAccount.name}):</span>
                <span className="font-bold text-red-600">
                    - {formatCurrency(sourceDeduction, sourceAccount.currency)}
                </span>
            </div>
            {type === TransactionType.TRANSFER && targetAccount && (
                <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span>Se recibirá ({targetAccount.name}):</span>
                    <span className="font-bold text-emerald-600">
                        + {formatCurrency(targetAddition, targetAccount.currency)}
                    </span>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-slate-800">Nueva Transacción</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setType(TransactionType.EXPENSE)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === TransactionType.EXPENSE ? 'bg-white text-red-500 shadow-sm' : 'text-slate-500'}`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType(TransactionType.INCOME)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === TransactionType.INCOME ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-500'}`}
            >
              Ingreso
            </button>
            <button
              type="button"
              onClick={() => setType(TransactionType.TRANSFER)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === TransactionType.TRANSFER ? 'bg-white text-blue-500 shadow-sm' : 'text-slate-500'}`}
            >
              Transferir
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                        {userCountry === 'Venezuela' ? (inputCurrency === 'USD' ? '$' : 'Bs.') : mainCurrency}
                    </span>
                    <input
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className={`w-full ${userCountry === 'Venezuela' ? 'pl-8' : 'pl-12'} pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xl font-bold text-slate-800`}
                        placeholder="0.00"
                    />
                </div>
                <div className="w-24">
                     <select 
                        value={inputCurrency}
                        onChange={(e) => setInputCurrency(e.target.value)}
                        disabled={userCountry !== 'Venezuela'}
                        className={`w-full h-full bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 text-center focus:ring-2 focus:ring-blue-500 outline-none appearance-none ${userCountry !== 'Venezuela' ? 'opacity-70 cursor-not-allowed' : ''}`}
                     >
                        {userCountry === 'Venezuela' ? (
                            <>
                                <option value={Currency.USD}>USD</option>
                                <option value={Currency.VES}>VES</option>
                            </>
                        ) : (
                            <option value={mainCurrency}>{mainCurrency}</option>
                        )}
                     </select>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {type === TransactionType.TRANSFER ? 'Desde' : 'Cuenta'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                ))}
              </select>
            </div>

            {type === TransactionType.TRANSFER && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hacia</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {accounts.filter(a => a.id !== accountId).map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {isRateNeeded && (
             <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-blue-700 font-medium text-sm">
                   <RefreshCw className="w-4 h-4" /> Tasa de Cambio Requerida
                </div>
                <div>
                   <label className="block text-xs font-medium text-blue-600 mb-1">Tasa (Bs/USD)</label>
                   <input 
                      type="number"
                      step="0.01"
                      required
                      value={customExchangeRate}
                      onChange={(e) => setCustomExchangeRate(e.target.value)}
                      className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm"
                      placeholder="Ej. 65.00"
                   />
                </div>
             </div>
          )}

          {getSummary()}

          {type !== TransactionType.TRANSFER && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                <span>Categoría</span>
                <button type="button" onClick={onAddCategory} className="text-xs text-blue-600 font-bold hover:underline">+ Crear Nueva</button>
              </label>
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto no-scrollbar">
                {categories.filter(c => c.type === type || (c.id === '10' && type === TransactionType.INCOME)).map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${categoryId === cat.id ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-100 bg-slate-50 text-slate-500'}`}
                  >
                    <span className="text-xl mb-1">{cat.icon}</span>
                    <span className="text-[10px] truncate w-full text-center">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Nota</label>
               <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Opcional..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Recurring Toggle */}
          {type !== TransactionType.TRANSFER && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl">
                  <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors shrink-0 ${isRecurring ? 'bg-purple-600' : 'bg-slate-300'}`} onClick={() => setIsRecurring(!isRecurring)}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isRecurring ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <div className="flex-1 cursor-pointer" onClick={() => setIsRecurring(!isRecurring)}>
                      <p className="text-sm font-bold text-purple-900 flex items-center gap-2">
                          <CalendarRange className="w-4 h-4" /> Programar / Recurrente
                      </p>
                      {!isRecurring && <p className="text-xs text-purple-600">Se repetirá automáticamente.</p>}
                  </div>
              </div>

              {isRecurring && (
                  <div className="p-3 bg-white border border-purple-100 rounded-xl animate-fade-in shadow-sm">
                      <label className="block text-xs font-bold text-purple-800 mb-2 uppercase">Frecuencia</label>
                      <select 
                          value={frequency}
                          onChange={(e) => setFrequency(e.target.value as Frequency)}
                          className="w-full p-2 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
                      >
                          <option value={Frequency.DAILY}>Diario</option>
                          <option value={Frequency.WEEKLY}>Semanal</option>
                          <option value={Frequency.BIWEEKLY}>Quincenal (15 días)</option>
                          <option value={Frequency.MONTHLY}>Mensual</option>
                          <option value={Frequency.YEARLY}>Anual</option>
                          <option value={Frequency.CUSTOM}>Personalizado</option>
                      </select>

                      {frequency === Frequency.CUSTOM && (
                          <div className="flex gap-2">
                              <div className="flex-1">
                                  <label className="block text-[10px] font-bold text-purple-600 mb-1">Cada</label>
                                  <input 
                                      type="number" 
                                      min="1"
                                      value={customInterval}
                                      onChange={(e) => setCustomInterval(parseInt(e.target.value) || 1)}
                                      className="w-full p-2 bg-purple-50 border border-purple-200 rounded-lg text-sm"
                                  />
                              </div>
                              <div className="flex-1">
                                  <label className="block text-[10px] font-bold text-purple-600 mb-1">Unidad</label>
                                  <select 
                                      value={customUnit}
                                      onChange={(e) => setCustomUnit(e.target.value as any)}
                                      className="w-full p-2 bg-purple-50 border border-purple-200 rounded-lg text-sm"
                                  >
                                      <option value="DAYS">Días</option>
                                      <option value="WEEKS">Semanas</option>
                                      <option value="MONTHS">Meses</option>
                                      <option value="YEARS">Años</option>
                                  </select>
                              </div>
                          </div>
                      )}
                  </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-colors mt-4"
          >
            {isRecurring ? 'Guardar y Programar' : 'Guardar Transacción'}
          </button>

        </form>
      </div>
    </div>
  );
};