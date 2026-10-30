import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function NovoOperacionalModal({ tipo, onClose, onSalvar }) {
  // Ajuste exato e seguro para o singular
  const nomeSingular = tipo === 'Equipamentos' ? 'Equipamento' : tipo === 'Setores' ? 'Setor' : 'Local';

  const [formData, setFormData] = useState({
    nome: '',
    codigo: nomeSingular === 'Local' ? 'LOC-JND-05' : nomeSingular === 'Setor' ? 'SET-JND-NOV' : 'ESP32-999',
    local: 'Planta Industrial Jandira',
    setor: 'Produção',
    status: 'Ativo',
    endereco: '',
    descricao: '',
    responsavel: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSalvar(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0C141F] p-6 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Novo {nomeSingular}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Mantenha os dados da estrutura atualizados.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nome do {nomeSingular}</label>
            <input
              type="text"
              required
              placeholder={`Ex.: ${nomeSingular === 'Local' ? 'Planta Industrial Campinas' : nomeSingular === 'Setor' ? 'Montagem' : 'Compressor 04'}`}
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-[#070D18] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Código / Identificação</label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-[#070D18] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-[#070D18] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600"
              >
                <option value="Ativo">Ativo / Online</option>
                <option value="Inativo">Inativo / Offline</option>
                <option value="Atenção">Atenção</option>
              </select>
            </div>
          </div>

          {nomeSingular === 'Equipamento' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Local</label>
                <input
                  type="text"
                  value={formData.local}
                  onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-[#070D18] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Setor</label>
                <input
                  type="text"
                  value={formData.setor}
                  onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-[#070D18] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600"
                />
              </div>
            </div>
          )}

          {nomeSingular === 'Local' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Endereço Completo</label>
                <input
                  type="text"
                  placeholder="Rua, número, bairro e cidade"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-[#070D18] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Responsável Operacional</label>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-[#070D18] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Descrição</label>
            <textarea
              rows={2}
              placeholder="Descreva brevemente esta área ou equipamento..."
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-[#070D18] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20"
            >
              Salvar {nomeSingular}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}