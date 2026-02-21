import React from "react";
import { Bot, TrendingUp } from "lucide-react";

interface Props {
  aiAdvice: string;
  isLoadingAi: boolean;
  onGetAdvice: () => void;
}

export const AdvisorView: React.FC<Props> = ({
  aiAdvice,
  isLoadingAi,
  onGetAdvice,
}) => (
  <div className="space-y-6 pb-24">
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-lg">
      <Bot className="w-12 h-12 mb-4 bg-white/20 p-2 rounded-xl" />
      <h2 className="text-2xl font-bold">Asistente Financiero</h2>
      <p className="text-blue-100 mt-2">
        Utiliza la IA para analizar tus finanzas y obtener recomendaciones
        personalizadas.
      </p>
      <button
        onClick={onGetAdvice}
        disabled={isLoadingAi}
        className="mt-6 w-full bg-white text-blue-600 font-bold py-3 rounded-xl shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {isLoadingAi ? "Analizando..." : "Analizar mis finanzas"}
      </button>
    </div>
    {aiAdvice && (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-fade-in">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          Recomendaciones
        </h3>
        <div className="prose prose-sm text-slate-600 whitespace-pre-line">
          {aiAdvice}
        </div>
      </div>
    )}
  </div>
);
