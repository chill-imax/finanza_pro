import React, { useState, useEffect } from 'react';
import { Account, AccountType, Currency } from '../types';
import { X, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Account) => void;
  initialData?: Account | null;
}

const COLORS = [
  { hex: '#3b82f6', name: 'Azul' },
  { hex: '#10b981', name: 'Verde' },
  { hex: '#ef4444', name: 'Rojo' },
  { hex: '#f59e0b', name: 'Amarillo' },
  { hex: '#8b5cf6', name: 'Morado' },
  { hex: '#ec4899', name: 'Rosa' },
  { hex: '#6366f1', name: 'Indigo' },
  { hex: '#14b8a6', name: 'Turquesa' },
  { hex: '#64748b', name: 'Gris' },
  { hex: '#0f172a', name: 'Oscuro' },
];

const ICONS = ['💵', '🏦', '💳', '🐖', '💰', '🏠', '🚗', '🎓', '✈️', '🛒'];

export const AccountModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialData }) => {
  const userCountry = localStorage.getItem('user_country') || 'Venezuela';
  const mainCurrency = localStorage.getItem('main_currency') || 'USD';

  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState<Currency | string>(Currency.USD);
  const [type, setType] = useState<AccountType>(AccountType.BANK);
  const [color, setColor] = useState(COLORS[0].hex);
  const [icon, setIcon] = useState(ICONS[1]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setBalance(initialData.balance.toString());
        setCurrency(initialData.currency);
        setType(initialData.type);
        setColor(initialData.color || COLORS[0].hex);
        setIcon(initialData.icon || '🏦');
      } else {
        setName('');
        setBalance('');
        setCurrency(userCountry === 'Venezuela' ? Currency.USD : mainCurrency);
        setType(AccountType.BANK);
        setColor(COLORS[0].hex);
        setIcon('🏦');
      }
    }
  }, [isOpen, initialData, userCountry, mainCurrency]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialData?.id || crypto.randomUUID(),
      name,
      balance: parseFloat(balance) || 0,
      currency: currency as Currency,
      type,
      color,
      icon,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-slate-800">
            {initialData ? 'Editar Cuenta' : 'Nueva Cuenta'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
              placeholder="Ej. Banesco, Efectivo..."
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {initialData ? 'Saldo Actual (Editar)' : 'Saldo Inicial'}
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div className="w-1/3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={`w-full p-3 bg-slate-50 border border-slate-200 rounded-xl ${userCountry !== 'Venezuela' || !!initialData ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={!!initialData || userCountry !== 'Venezuela'} // Si se edita o no es Vzla, no se cambia
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

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
             <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
             >
                <option value={AccountType.BANK}>Banco</option>
                <option value={AccountType.CASH}>Efectivo</option>
                <option value={AccountType.WALLET}>Billetera Digital</option>
                <option value={AccountType.SAVINGS}>Ahorros</option>
             </select>
          </div>

          {/* Color Picker */}
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
             <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                    <button
                        key={c.hex}
                        type="button"
                        onClick={() => setColor(c.hex)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform active:scale-95 ${color === c.hex ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c.hex }}
                    >
                        {color === c.hex && <Check className="w-4 h-4 text-white" />}
                    </button>
                ))}
             </div>
          </div>

           {/* Icon Picker */}
           <div>
             <label className="block text-sm font-medium text-slate-700 mb-2">Icono</label>
             <div className="flex flex-wrap gap-2">
                {ICONS.map((i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => setIcon(i)}
                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-colors ${icon === i ? 'bg-blue-100 border-blue-500' : 'bg-slate-50 border-slate-200'}`}
                    >
                        {i}
                    </button>
                ))}
             </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg mt-2"
          >
            Guardar Cuenta
          </button>
        </form>
      </div>
    </div>
  );
};