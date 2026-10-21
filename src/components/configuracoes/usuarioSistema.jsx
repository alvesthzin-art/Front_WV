
import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
} from 'lucide-react';

const usuariosIniciais = [
  {
    id: 1,
    nome: 'Gabriel Santos',
    email: 'gabriel.santos@wattvision.com',
    perfil: 'Administrador',
    local: 'Acesso global',
    status: 'Ativo',
    ultimoAcesso: '19/10/2026, 05:42:00',
  },
  {
    id: 2,
    nome: 'Mariana Costa',
    email: 'mariana.costa@wattvision.com',
    perfil: 'Gestor',
    local: 'Planta Industrial Jandira',
    status: 'Ativo',
    ultimoAcesso: '18/10/2026, 13:30:00',
  },
  {
    id: 3,
    nome: 'Roberto Silva',
    email: 'roberto.silva@wattvision.com',
    perfil: 'Gestor',
    local: 'Planta Industrial Osasco +1',
    status: 'Inativo',
    ultimoAcesso: '—',
  },
];

const formularioInicial = {
  nome: '',
  email: '',
  senha: '',
  perfil: 'Administrador',
  status: 'Ativo',
};

const inputClass =
  'w-full rounded-xl border border-[#17315F] bg-[#070A15] px-3 py-2.5 text-sm text-[#C0C5C8] outline-none transition focus:border-[#5A8F97]';

const labelClass =
  'mb-2 block text-xs font-medium text-[#afb5ba]';

  export function UsuariosSistema() {
  const [usuarios, setUsuarios] = useState(usuariosIniciais);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [mensagem, setMensagem] = useState('');

  const administradores = usuarios.filter(
    (usuario) => usuario.perfil === 'Administrador'
  ).length;

  const gestores = usuarios.filter(
    (usuario) => usuario.perfil === 'Gestor'
  ).length;

  function abrirNovoUsuario() {
    setFormulario(formularioInicial);
    setEditandoId(null);
    setMensagem('');
    setMostrarFormulario(true);
  }

  function abrirEdicao(usuario) {
    setFormulario({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      perfil: usuario.perfil,
      status: usuario.status,
    });

    setEditandoId(usuario.id);
    setMensagem('');
    setMostrarFormulario(true);
  }

  function cancelarFormulario() {
    setMostrarFormulario(false);
    setEditandoId(null);
    setFormulario(formularioInicial);
    setMensagem('');
  }

  function atualizarCampo(campo, valor) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function salvarUsuario(event) {
    event.preventDefault();
    setMensagem('');

    const emailExiste = usuarios.some(
      (usuario) =>
        usuario.email.toLowerCase() === formulario.email.trim().toLowerCase() &&
        usuario.id !== editandoId
    );

    if (emailExiste) {
      setMensagem('Já existe um usuário cadastrado com esse email.');
      return;
    }

    if (editandoId !== null) {
      setUsuarios((atuais) =>
        atuais.map((usuario) =>
          usuario.id === editandoId
            ? {
                ...usuario,
                nome: formulario.nome.trim(),
                email: formulario.email.trim(),
                perfil: formulario.perfil,
                status: formulario.status,
              }
            : usuario
        )
      );
    } else {
      const novoUsuario = {
        id: Date.now(),
        nome: formulario.nome.trim(),
        email: formulario.email.trim(),
        perfil: formulario.perfil,
        local:
          formulario.perfil === 'Administrador'
            ? 'Acesso global'
            : 'Não definido',
        status: formulario.status,
        ultimoAcesso: '—',
      };

      setUsuarios((atuais) => [...atuais, novoUsuario]);
    }

    cancelarFormulario();
  }

  function excluirUsuario(id) {
    const confirmar = window.confirm(
      'Tem certeza de que deseja excluir este usuário?'
    );

    if (confirmar) {
      setUsuarios((atuais) =>
        atuais.filter((usuario) => usuario.id !== id)
      );
    }
  }

  return (
    <section className="flex min-w-0 flex-col gap-4 text-[#C0C5C8]">
      {/* Cabeçalho e botão de novo usuário */}
      <div className="flex min-h-[66px] flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#17315F] px-5 py-3">
        <p className="text-xs text-[#9ca1a6]">
          <strong className="text-[#C0C5C8]">
            {usuarios.length} usuários cadastrados
          </strong>
          {' · '}
          {administradores} Administradores
          {' · '}
          {gestores} Gestores
        </p>

        <button
          type="button"
          onClick={abrirNovoUsuario}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2853A0] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#3566BB]"
        >
          <Plus size={15} />
          Novo Usuário
        </button>
      </div>

      {/* Formulário exibido ao clicar em Novo Usuário ou Editar */}
      {mostrarFormulario && (
        <form
          onSubmit={salvarUsuario}
          className="rounded-2xl border border-[#17315F] bg-[#101522] p-4 sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#C0C5C8]">
              {editandoId !== null ? 'Editar Usuário' : 'Novo Usuário'}
            </h3>

            <button
              type="button"
              onClick={cancelarFormulario}
              aria-label="Fechar formulário"
              className="text-[#68717C] hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelClass}>Nome</label>
              <input
                className={inputClass}
                value={formulario.nome}
                onChange={(e) => atualizarCampo('nome', e.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Email</label>
              <input
                type="email"
                className={inputClass}
                value={formulario.email}
                onChange={(e) => atualizarCampo('email', e.target.value)}
                placeholder="usuario@wattvision.com"
                required
              />
            </div>

            <div>
              <label className={labelClass}>Senha</label>
              <input
                type="password"
                className={inputClass}
                value={formulario.senha}
                onChange={(e) => atualizarCampo('senha', e.target.value)}
                placeholder={
                  editandoId !== null
                    ? 'Deixe vazio para manter'
                    : 'Mínimo de 6 caracteres'
                }
                minLength={editandoId === null ? 6 : undefined}
                required={editandoId === null}
                autoComplete="new-password"
              />
              <p className="mt-1.5 text-[10px] text-[#4A525B]">
                Mínimo de 6 caracteres
              </p>
            </div>

            <div>
              <label className={labelClass}>Perfil</label>
              <select
                className={inputClass}
                value={formulario.perfil}
                onChange={(e) => atualizarCampo('perfil', e.target.value)}
              >
                <option value="Administrador">Administrador</option>
                <option value="Gestor">Gestor</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Status</label>
              <select
                className={inputClass}
                value={formulario.status}
                onChange={(e) => atualizarCampo('status', e.target.value)}
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>

          {mensagem && (
            <p className="mt-4 text-xs text-red-400">{mensagem}</p>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelarFormulario}
              className="rounded-lg border border-[#17315F] px-3 py-2 text-xs text-[#9ca1a6] hover:bg-[#172033]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-[#244985] px-4 py-2 text-xs font-semibold text-white hover:bg-[#315DA5]"
            >
              <Save size={14} />
              {editandoId !== null ? 'Salvar Usuário' : 'Salvar Usuário'}
            </button>
          </div>
        </form>
      )}

      {/* Tabela de usuários */}
      <div className="overflow-x-auto rounded-2xl border border-[#17263D]">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="bg-[#0C141F]">
            <tr className="border-b border-[#17263D] text-[10px] uppercase text-[#4A525B]">
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">Local</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Último acesso</th>
              <th className="px-4 py-3 text-center font-medium">Ações</th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((usuario) => (
              <tr
                key={usuario.id}
                className="border-b border-[#17263D] last:border-b-0 hover:bg-[#111B2A]"
              >
                <td className="px-4 py-3">
                  <p className="text-xs font-semibold text-[#C0C5C8]">
                    {usuario.nome}
                  </p>
                  <p className="mt-1 text-[10px] text-[#4A525B]">
                    {usuario.email}
                  </p>
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2 py-1 text-[10px] ${
                      usuario.perfil === 'Administrador'
                        ? 'border-[#17315F] bg-[#101E36] text-[#5A8FDE]'
                        : 'border-[#214A53] bg-[#123139] text-[#5A8F97]'
                    }`}
                  >
                    {usuario.perfil}
                  </span>
                </td>

                <td className="px-4 py-3 text-[11px] text-[#9ca1a6]">
                  {usuario.local}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2 py-1 text-[10px] ${
                      usuario.status === 'Ativo'
                        ? 'border-[#174A2A] bg-[#10291D] text-[#2A8246]'
                        : 'border-[#17315F] bg-[#101A2B] text-[#6B7888]'
                    }`}
                  >
                    {usuario.status}
                  </span>
                </td>

                <td className="px-4 py-3 text-[11px] text-[#9ca1a6]">
                  {usuario.ultimoAcesso}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => abrirEdicao(usuario)}
                      aria-label={`Editar ${usuario.nome}`}
                      className="text-[#9ca1a6] hover:text-white"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => excluirUsuario(usuario.id)}
                      aria-label={`Excluir ${usuario.nome}`}
                      className="text-[#D66B76] hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {usuarios.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-xs text-[#68717C]"
                >
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
