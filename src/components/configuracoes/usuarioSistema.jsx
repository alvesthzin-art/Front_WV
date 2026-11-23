
import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  X,
  Save,
  Trash2,
  ChevronDown,
  Check,
} from 'lucide-react';
import api from '../../services/api';
import { redefinirSenhaUsuario } from '../../services/auth';

const formularioInicial = {
  id_empresa: 1,
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
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [locais, setLocais] = useState([]);
  const [setores, setSetores] = useState([]);
  const [locaisSelecionados, setLocaisSelecionados] = useState([]);
  const [locaisAberto, setLocaisAberto] = useState(false);

  useEffect(() => {
    let montado = true;

    Promise.all([api.get('/usuarios'), api.get('/locais'), api.get('/setores')])
      .then(([usuariosResposta, locaisResposta, setoresResposta]) => {
        if (!montado) return;
        setLocais(locaisResposta.data?.dados || []);
        setSetores(setoresResposta.data?.dados || []);
        setUsuarios((usuariosResposta.data?.dados || []).map((usuario) => ({
          ...usuario,
          local: usuario.perfil === 'Administrador' ? 'Acesso global' : 'Consultar autorizações',
          ultimoAcesso: usuario.ultimo_acesso
            ? new Date(usuario.ultimo_acesso).toLocaleString('pt-BR')
            : '—',
        })));
      })
      .catch((error) => {
        if (montado) setMensagem(error.response?.data?.mensagem || 'Não foi possível carregar os usuários.');
      })
      .finally(() => {
        if (montado) setCarregando(false);
      });

    return () => { montado = false; };
  }, []);

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
    setLocaisSelecionados([]);
    setLocaisAberto(false);
    setMostrarFormulario(true);
  }

  async function abrirEdicao(usuario) {
    setFormulario({
      id_empresa: usuario.id_empresa,
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      perfil: usuario.perfil,
      status: usuario.status,
    });

    setEditandoId(usuario.id);
    setMensagem('');
    setLocaisSelecionados([]);
    setLocaisAberto(false);
    setMostrarFormulario(true);

    if (usuario.perfil === 'Gestor') {
      try {
        const resposta = await api.get(`/usuarios/${usuario.id}/locais`);
        setLocaisSelecionados((resposta.data?.dados || []).map((item) => Number(item.id_local)));
      } catch (error) {
        setMensagem(error.response?.data?.mensagem || 'Não foi possível carregar os locais autorizados.');
      }
    }
  }

  function cancelarFormulario() {
    setMostrarFormulario(false);
    setEditandoId(null);
    setFormulario(formularioInicial);
    setLocaisSelecionados([]);
    setLocaisAberto(false);
    setMensagem('');
  }

  function atualizarCampo(campo, valor) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function salvarUsuario(event) {
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

    try {
      const dados = {
        id_empresa: formulario.id_empresa || 1,
        nome: formulario.nome.trim(),
        email: formulario.email.trim(),
        perfil: formulario.perfil,
        status: formulario.status,
      };

      const resposta = editandoId !== null
        ? await api.put(`/usuarios/${editandoId}`, dados)
        : await api.post('/usuarios', { ...dados, senha: formulario.senha });
      const usuarioSalvo = resposta.data?.dados;
      const idUsuarioSalvo = editandoId ?? usuarioSalvo?.id;

      if (formulario.perfil === 'Gestor' && idUsuarioSalvo) {
        await api.put(`/usuarios/${idUsuarioSalvo}/locais`, {
          ids_locais: locaisSelecionados,
        });
      }

      if (editandoId !== null) {
        setUsuarios((atuais) => atuais.map((usuario) => usuario.id === editandoId
          ? { ...usuario, ...usuarioSalvo, local: usuario.local, ultimoAcesso: usuario.ultimoAcesso }
          : usuario));
      } else if (usuarioSalvo) {
        setUsuarios((atuais) => [...atuais, {
          ...usuarioSalvo,
          local: usuarioSalvo.perfil === 'Administrador' ? 'Acesso global' : 'Consultar autorizações',
          ultimoAcesso: '—',
        }]);
      }

      cancelarFormulario();
    } catch (error) {
      setMensagem(error.response?.data?.mensagem || 'Não foi possível salvar o usuário.');
    }
  }

  function alternarLocal(idLocal) {
    setLocaisSelecionados((atuais) => atuais.includes(idLocal)
      ? atuais.filter((id) => id !== idLocal)
      : [...atuais, idLocal]);
  }

  function selecionarTodosLocais() {
    setLocaisSelecionados(locaisDaEmpresa.map((local) => Number(local.id)));
  }

  function limparLocais() {
    setLocaisSelecionados([]);
  }

  const locaisDaEmpresa = locais.filter(
    (local) => Number(local.id_empresa) === Number(formulario.id_empresa) && local.status !== 'Inativo'
  );

  const nomesLocaisSelecionados = locaisDaEmpresa
    .filter((local) => locaisSelecionados.includes(Number(local.id)))
    .map((local) => local.nome);

  async function redefinirSenha(usuario) {
    const novaSenha = window.prompt(`Digite uma nova senha para ${usuario.email} (mínimo de 8 caracteres):`);
    if (novaSenha === null) return;
    if (novaSenha.length < 8) {
      setMensagem('A nova senha deve conter pelo menos 8 caracteres.');
      return;
    }

    try {
      await redefinirSenhaUsuario(usuario.id, novaSenha);
      setMensagem(`Senha redefinida para ${usuario.email}.`);
    } catch (error) {
      setMensagem(error.response?.data?.mensagem || 'Não foi possível redefinir a senha.');
    }
  }

  async function excluirUsuario(usuario) {
    if (usuario.perfil !== 'Gestor') {
      setMensagem('Somente usuários Gestor podem ser excluídos.');
      return;
    }

    if (!window.confirm(`Deseja excluir o usuário ${usuario.nome}?`)) return;

    try {
      await api.delete(`/usuarios/${usuario.id}`);
      setUsuarios((atuais) => atuais.filter((item) => item.id !== usuario.id));
      setMensagem(`Usuário ${usuario.email} removido com sucesso.`);
    } catch (error) {
      setMensagem(error.response?.data?.mensagem || 'Não foi possível excluir o usuário.');
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

      {mensagem && !mostrarFormulario && <p role="status" className="text-xs text-blue-400">{mensagem}</p>}

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
                    ? 'Senha não é alterada nesta tela'
                    : 'Mínimo de 8 caracteres'
                }
                minLength={editandoId === null ? 8 : undefined}
                required={editandoId === null}
                autoComplete="new-password"
              />
              <p className="mt-1.5 text-[10px] text-[#4A525B]">
                A senha deve conter entre 8 e 72 caracteres.
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

            {formulario.perfil === 'Gestor' && (
              <div className="relative md:col-span-2">
                <label className={labelClass}>Locais e setores associados</label>
                <button
                  type="button"
                  onClick={() => setLocaisAberto((aberto) => !aberto)}
                  className={`${inputClass} flex items-center justify-between text-left`}
                >
                  <span className={nomesLocaisSelecionados.length ? 'text-[#C0C5C8]' : 'text-[#68717C]'}>
                    {nomesLocaisSelecionados.length
                      ? `${nomesLocaisSelecionados.length} local(is) selecionado(s)`
                      : 'Selecionar locais...'}
                  </span>
                  <ChevronDown size={15} className="shrink-0 text-[#8FA6C8]" />
                </button>

                {locaisAberto && (
                  <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-[#17315F] bg-[#0C1423] p-2 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-[#17315F] px-2 pb-2 text-[11px]">
                      <span className="uppercase tracking-wide text-[#68717C]">Locais disponíveis</span>
                      <div className="flex gap-3">
                        <button type="button" onClick={selecionarTodosLocais} className="font-semibold text-[#5A8FDE] hover:text-white">Selecionar todos</button>
                        <button type="button" onClick={limparLocais} className="text-[#9ca1a6] hover:text-white">Limpar</button>
                      </div>
                    </div>

                    {locaisDaEmpresa.map((local) => {
                      const idLocal = Number(local.id);
                      const selecionado = locaisSelecionados.includes(idLocal);
                      const setoresDoLocal = setores.filter((setor) => Number(setor.id_local) === idLocal && setor.status !== 'Inativo');

                      return (
                        <label key={local.id} className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-[#111D31]">
                          <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selecionado ? 'border-[#4D84E8] bg-[#2853A0] text-white' : 'border-[#38557D] bg-[#070A15]'}`}>
                            {selecionado && <Check size={12} />}
                            <input type="checkbox" className="sr-only" checked={selecionado} onChange={() => alternarLocal(idLocal)} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-xs font-medium text-[#C0C5C8]">{local.nome}</span>
                            {setoresDoLocal.length > 0 && (
                              <span className="mt-1 block text-[10px] text-[#8291A8]">
                                Setores: {setoresDoLocal.map((setor) => setor.nome).join(', ')}
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}

                    {locaisDaEmpresa.length === 0 && <p className="px-2 py-5 text-xs text-[#68717C]">Nenhum local ativo encontrado para esta empresa.</p>}
                  </div>
                )}
                <p className="mt-1.5 text-[10px] text-[#68717C]">Os setores exibidos pertencem aos locais selecionados e acompanham essa autorização.</p>
              </div>
            )}
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
            {carregando && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-xs text-[#68717C]">Carregando usuários...</td></tr>
            )}

            {!carregando && usuarios.map((usuario) => (
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
                      onClick={() => redefinirSenha(usuario)}
                      aria-label={`Redefinir senha de ${usuario.nome}`}
                      className="text-[#5A8FDE] hover:text-white"
                    >
                      <Save size={14} />
                    </button>

                    {usuario.perfil === 'Gestor' && (
                      <button
                        type="button"
                        onClick={() => excluirUsuario(usuario)}
                        aria-label={`Excluir ${usuario.nome}`}
                        className="text-[#C77C7C] hover:text-red-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {!carregando && usuarios.length === 0 && (
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
