import React, { useState } from 'react';
import { Category } from '../types';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Category) => void;
}

const EMOJIS = ['🎮', '👗', '🎓', '🎁', '🔧', '👶', '🐱', '✈️', '🏋️', '🥂', '🛒', '⛽', '📱', '💡'];

export const CategoryModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [selectedIcon, setSelectedIcon] = useState(EMOJIS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: crypto.randomUUID(),
      name,
      type,
      icon: selectedIcon,
      isCustom: true
    });
    onClose();
    setName('');
    setSelectedIcon(EMOJIS[0]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-slate-800">Nueva Categoría</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          <div className="flex bg-slate-100 rounded-lg p-1">
             <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === 'EXPENSE' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-500'}`}
             >
               Gasto
             </button>
             <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === 'INCOME' ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-500'}`}
             >
               Ingreso
             </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
              placeholder="Ej. Videojuegos"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-2">Icono</label>
             <div className="grid grid-cols-7 gap-2">
                {EMOJIS.map((e) => (
                    <button
                        key={e}
                        type="button"
                        onClick={() => setSelectedIcon(e)}
                        className={`w-8 h-8 text-lg rounded-lg flex items-center justify-center transition-colors ${selectedIcon === e ? 'bg-blue-100 border border-blue-300' : 'bg-slate-50'}`}
                    >
                        {e}
                    </button>
                ))}
             </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg mt-2"
          >
            Crear
          </button>
        </form>
      </div>
    </div>
  );
};