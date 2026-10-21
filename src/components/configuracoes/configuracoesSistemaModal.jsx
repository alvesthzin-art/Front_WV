import React, { useEffect, useState } from 'react';
import { UsuariosSistema } from './usuarioSistema.jsx';
import { TarifasSistema } from './tarifasSistema.jsx';
import { GeralSistema } from './geralSistema.jsx';
import {
  X,
  Settings,
  Zap,
  Users,
  MapPin,
  Building2,
  Monitor,
  Save,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';

/*
|--------------------------------------------------------------------------
| 1. CONFIGURAÇÃO DAS ABAS DO MODAL
|--------------------------------------------------------------------------
|
| Este array controla as abas que aparecem no topo da janela.
|
| id    = identificador usado pelo React para saber qual aba mostrar.
| label = texto exibido para o usuário.
| icon  = ícone importado da biblioteca Lucide React.
|
| COMO ADICIONAR UMA ABA:
| 1. Adicione um objeto neste array.
| 2. Crie o conteúdo da nova aba na seção "CONTEÚDO".
| 3. Use activeTab === 'novo_id' para controlar sua exibição.
|
*/

const tabs = [
  { id: 'geral', label: 'Geral', icon: Settings },
  { id: 'tarifas', label: 'Tarifas', icon: Zap },
  { id: 'usuarios', label: 'Usuários', icon: Users },
  { id: 'pontos', label: 'Pontos de Medição', icon: MapPin },
];

/*
|--------------------------------------------------------------------------
| 2. VALORES INICIAIS DOS CAMPOS
|--------------------------------------------------------------------------
|
| Estes valores aparecem quando o modal é inicializado.
|
| nomeEmpresa = nome inicial da empresa.
| fusoHorario = fuso horário selecionado inicialmente.
| formatoData = formato de data selecionado inicialmente.
|
| Para alterar os valores iniciais, modifique os valores abaixo.
|
| ATENÇÃO:
| Estes valores não são carregados de um banco de dados.
| Também não são armazenados permanentemente nesta implementação.
|
*/

const initialSettings = {
  nomeEmpresa: 'Watt Vision',
  fusoHorario: 'America/Sao_Paulo',
  formatoData: 'DD/MM/YYYY',
};

/*
|--------------------------------------------------------------------------
| 3. COMPONENTE PRINCIPAL
|--------------------------------------------------------------------------
|
| Este componente representa a janela de configurações do sistema.
|
| onClose é uma função recebida do componente pai.
| Ela permite fechar o modal quando necessário.
|
| Exemplo de uso no App.jsx:
|
| <ConfiguracoesSistemaModal
|   onClose={() => setShowConfigModal(false)}
| />
|
*/

export function ConfiguracoesSistemaModal({ onClose }) {

  /*
  | activeTab controla qual aba está aberta.
  |
  | O valor inicial 'geral' faz o modal abrir na aba Geral.
  | setActiveTab altera a aba quando o usuário clica nela.
  */
  const [activeTab, setActiveTab] = useState('geral');

  /*
  | settings armazena os valores atuais dos campos.
  |
  | Quando o usuário altera um campo, chamamos setSettings
  | para atualizar o estado e refletir a mudança na interface.
  */
  const [settings, setSettings] = useState(initialSettings);

  /*
  | saved guarda os valores considerados salvos nesta instância.
  |
  | IMPORTANTE:
  | Como o componente é fechado e desmontado, esta cópia local
  | não garante que os dados permaneçam disponíveis ao reabrir.
  | Para isso, será necessário um estado persistente ou backend.
  */
  const [saved, setSaved] = useState(initialSettings);

  const [mostrarFormularioTarifa, setMostrarFormularioTarifa] = useState(false);

  const [formTarifa, setFormTarifa] = useState({
    descricao: '',
    valor: '0',
    ativa: false,
    inicio: '',
    fim: '',
  });
  // Tarifas cadastradas no sistema.
  // Estes dados são exemplos e ficam apenas na memória do componente.
  const [tarifas, setTarifas] = useState([
    {
      id: 1,
      descricao: 'Tarifa 2026 — Convencional',
      valor: 0.80,
      inicio: '2026-01-01',
      fim: '',
      ativa: true,
    },
    {
      id: 2,
      descricao: 'Tarifa 2027 (futura, prevista)',
      valor: 0.87,
      inicio: '2027-01-01',
      fim: '',
      ativa: false,
    },
  ]);
  //const [mostrarFormularioTarifa, setMostrarFormularioTarifa] = useState(false);


  // Formata os valores para o padrão brasileiro: R$ 0,80.
  const formatarValor = (valor) =>
    Number(valor).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

  // Converte a data ISO para DD/MM/AAAA.
  const formatarData = (data) => {
    if (!data) return 'atual';

    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  // Cadastra uma nova tarifa usando caixas de diálogo simples.
  // Abre o formulário de nova tarifa.
  const adicionarTarifa = () => {
    setFormTarifa({
      descricao: '',
      valor: '0',
      ativa: false,
      inicio: '',
      fim: '',
    });

    setMostrarFormularioTarifa(true);
  };

  // Fecha o formulário sem cadastrar.
  const cancelarFormularioTarifa = () => {
    setMostrarFormularioTarifa(false);
  };

  // Valida e salva a nova tarifa na lista.
  const salvarNovaTarifa = (event) => {
    event.preventDefault();

    const valor = Number(
      String(formTarifa.valor).replace(',', '.')
    );

    if (!formTarifa.descricao.trim()) {
      window.alert('Informe a descrição da tarifa.');
      return;
    }

    if (!Number.isFinite(valor) || valor < 0) {
      window.alert('Informe um valor válido.');
      return;
    }

    if (!formTarifa.inicio) {
      window.alert('Informe a data inicial.');
      return;
    }

    if (formTarifa.fim && formTarifa.fim < formTarifa.inicio) {
      window.alert('A data final não pode ser anterior à data inicial.');
      return;
    }

    setTarifas((atuais) => [
      ...atuais,
      {
        id: Date.now(),
        descricao: formTarifa.descricao.trim(),
        valor,
        inicio: formTarifa.inicio,
        fim: formTarifa.fim,
        ativa: formTarifa.ativa,
      },
    ]);

    setMostrarFormularioTarifa(false);
  };

  // Permite alterar a descrição, o valor e a data de início.
  const editarTarifa = (tarifa) => {
    const descricao = window.prompt('Descrição:', tarifa.descricao);
    if (!descricao?.trim()) return;

    const valorInformado = window.prompt(
      'Valor por kWh:',
      String(tarifa.valor).replace('.', ',')
    );

    if (valorInformado === null) return;

    const valor = Number(valorInformado.replace(',', '.'));

    if (!Number.isFinite(valor) || valor < 0) {
      window.alert('Informe um valor válido.');
      return;
    }

    const inicio = window.prompt(
      'Data de início (AAAA-MM-DD):',
      tarifa.inicio
    );

    if (!inicio || !/^\d{4}-\d{2}-\d{2}$/.test(inicio)) {
      window.alert('Informe uma data válida.');
      return;
    }

    setTarifas((atuais) =>
      atuais.map((item) =>
        item.id === tarifa.id
          ? { ...item, descricao: descricao.trim(), valor, inicio }
          : item
      )
    );
  };

  // Exclui a tarifa somente após confirmação.
  const excluirTarifa = (id) => {
    const confirmar = window.confirm(
      'Deseja realmente excluir esta tarifa?'
    );

    if (confirmar) {
      setTarifas((atuais) =>
        atuais.filter((tarifa) => tarifa.id !== id)
      );
    }
  };
  /*
  |--------------------------------------------------------------------------
  | 4. FECHAR O MODAL COM A TECLA ESC
  |--------------------------------------------------------------------------
  |
  | useEffect registra um evento de teclado enquanto o modal
  | está montado na tela.
  |
  | Ao pressionar Escape, a função onClose é executada.
  |
  | O return remove o evento quando o modal é desmontado,
  | evitando que o listener permaneça ativo.
  |
  */

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    // Ativa a escuta do teclado.
    window.addEventListener('keydown', handleKeyDown);

    // Remove a escuta quando o componente deixa de existir.
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  /*
  |--------------------------------------------------------------------------
  | 5. FUNÇÃO PARA ATUALIZAR OS CAMPOS
  |--------------------------------------------------------------------------
  |
  | Esta função evita precisar criar uma função diferente
  | para cada campo do formulário.
  |
  | key   = nome da propriedade que será alterada.
  | value = novo valor escolhido ou digitado.
  |
  | Exemplo:
  | updateSetting('nomeEmpresa', 'Empresa Exemplo')
  |
  | O operador ...current preserva os demais campos.
  |
  */

  const updateSetting = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | 6. BOTÃO CANCELAR
  |--------------------------------------------------------------------------
  |
  | Restaura o estado local para os últimos valores salvos
  | nesta instância e fecha o modal.
  |
  | Para que o cancelamento funcione com dados persistentes,
  | será necessário definir como os valores salvos são mantidos.
  |
  */

  const cancelChanges = () => {
    setSettings(saved);
    onClose();
  };

  /*
  |--------------------------------------------------------------------------
  | 7. BOTÃO SALVAR ALTERAÇÕES
  |--------------------------------------------------------------------------
  |
  | Atualiza a cópia local e fecha o modal.
  |
  | ATENÇÃO:
  | Esta função não envia dados para uma API ou banco de dados.
  | Para salvar permanentemente, será necessário integrar
  | o componente a um serviço de persistência.
  |
  */

  const saveChanges = () => {
    setSaved(settings);
    onClose();
  };

  /*
  |--------------------------------------------------------------------------
  | 8. ESTILOS REUTILIZÁVEIS
  |--------------------------------------------------------------------------
  |
  | inputClass reúne as classes dos campos de entrada.
  | labelClass reúne as classes dos rótulos.
  |
  | Isso facilita alterar o estilo de vários campos de uma vez.
  |
  | Exemplo:
  | - Para aumentar o espaçamento dos campos, altere mt-2.
  | - Para mudar a borda, altere border-[#17315F].
  | - Para mudar a cor do texto, altere text-[#C0C5C8].
  |
  | As cores entre colchetes são valores personalizados do Tailwind.
  |
  */

  const inputClass =
    'mt-2 w-full rounded-xl border border-[#17315F] bg-[#070A15] px-3 py-3 text-[13px] text-[#C0C5C8] outline-none transition focus:border-[#5A8F97]';

  const labelClass = 'text-xs font-medium text-[#afb5ba]';

  return (
    /*
    |--------------------------------------------------------------------------
    | 9. FUNDO DO MODAL
    |--------------------------------------------------------------------------
    |
    | fixed inset-0 cobre toda a janela do navegador.
    | flex items-center justify-center centraliza o modal.
    | bg-[#050812]/80 cria o fundo escuro semitransparente.
    | backdrop-blur-sm aplica um leve desfoque no fundo.
    | p-3 adiciona espaço nas bordas em telas pequenas.
    |
    | O onMouseDown fecha o modal apenas quando o clique ocorre
    | diretamente no fundo, e não dentro do painel.
    |
    */
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#050812]/80 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {/*
      |--------------------------------------------------------------------------
      | 10. PAINEL PRINCIPAL
      |--------------------------------------------------------------------------
      |
      | role="dialog" identifica a janela como um diálogo.
      | aria-modal informa que ela é uma janela modal.
      | max-w-[1000px] define a largura máxima.
      | max-h-[94vh] limita a altura à área visível da tela.
      | overflow-hidden evita que o conteúdo ultrapasse as bordas.
      |
      | Para mudar a largura, altere max-w-[1000px].
      | Para mudar a altura máxima, altere max-h-[94vh].
      |
      */}
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="config-modal-title"
        className="flex max-h-[94vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-[20px] border border-[#26354B] bg-[#0D1523] text-[#C0C5C8] shadow-[0_24px_70px_rgba(0,0,0,0.65)]"
      >

        {/*
        |--------------------------------------------------------------------------
        | 11. CABEÇALHO
        |--------------------------------------------------------------------------
        |
        | Exibe o título, o subtítulo e o botão de fechar.
        |
        | Para alterar o título ou subtítulo, edite os textos abaixo.
        | O ícone X é fornecido pelo Lucide React.
        |
        */}

        <header className="flex shrink-0 items-center justify-between border-b border-[#17315F55] px-5 py-4 sm:px-6">
          <div>
            <h2
              id="config-modal-title"
              className="text-base font-semibold sm:text-[17px]"
            >
              Configurações do Sistema
            </h2>

            <p className="mt-1 text-xs text-[#8F9AA8]">
              Informações gerais, tarifas e preferências
            </p>
          </div>

          {/* Botão X: fecha o modal sem executar saveChanges. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar configurações"
            title="Fechar"
            className="rounded-lg p-2 text-[#7D8998] transition hover:bg-[#172235] hover:text-white"
          >
            <X size={17} />
          </button>
        </header>

        {/*
        |--------------------------------------------------------------------------
        | 12. NAVEGAÇÃO ENTRE ABAS
        |--------------------------------------------------------------------------
        |
        | tabs.map percorre o array definido no início do arquivo.
        | Para cada aba, cria um botão com seu ícone e seu título.
        |
        | selected verifica se a aba corresponde a activeTab.
        | setActiveTab altera a aba selecionada quando há um clique.
        |
        | O indicador azul aparece somente na aba selecionada.
        |
        */}

        <nav
          aria-label="Seções das configurações"
          className="flex shrink-0 gap-1 overflow-x-auto border-b border-[#17315F55] bg-[#0B1320] px-3 sm:px-5"
        >
          {tabs.map((tab) => {
            // Seleciona o componente de ícone da aba atual.
            const Icon = tab.icon;

            // Verifica se esta é a aba que está aberta.
            const selected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={selected ? 'page' : undefined}
                className={`relative flex shrink-0 items-center gap-2 px-3 py-4 text-xs transition-colors sm:px-4 ${selected
                  ? 'font-semibold text-[#C0C5C8]'
                  : 'text-[#687587] hover:text-[#C0C5C8]'
                  }`}
              >
                <Icon size={15} />

                {tab.label}

                {/* Linha azul que destaca a aba ativa. */}
                {selected && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3768C5]" />
                )}
              </button>
            );
          })}
        </nav>

        {/*
        |--------------------------------------------------------------------------
        | 13. ÁREA DE CONTEÚDO DAS ABAS
        |--------------------------------------------------------------------------
        |
        | Cada bloco abaixo aparece somente quando sua aba está ativa.
        |
        | overflow-y-auto permite rolagem vertical se o conteúdo
        | ficar maior que o espaço disponível.
        |
        | Para adicionar campos, cartões ou textos, edite o bloco
        | correspondente à aba desejada.
        |
        */}

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#0D1523] p-4 sm:p-5">

          {/*
          |--------------------------------------------------------------------------
          | 13.1. ABA GERAL
          |--------------------------------------------------------------------------
          |
          | O grid organiza os cartões em duas colunas em telas grandes.
          | Em telas menores, os cartões ficam um abaixo do outro.
          |
          | lg:grid-cols-2 controla as duas colunas.
          | gap-4 controla o espaço entre os cartões.
          |
          */}

          {activeTab === 'geral' && (
            <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">

              {/*
              |--------------------------------------------------------------------------
              | 13.1.1. CARTÃO INFORMAÇÕES DO SISTEMA
              |--------------------------------------------------------------------------
              |
              | Contém nome da empresa, fuso horário, formato de data
              | e unidade de energia.
              |
              | Para adicionar um campo, crie um novo bloco dentro
              | de space-y-4 e adicione a propriedade correspondente
              | em initialSettings.
              |
              */}

              <GeralSistema
                settings={settings}
                updateSetting={updateSetting}
                labelClass={labelClass}
                inputClass={inputClass}
              />

              {/*
              |--------------------------------------------------------------------------
              | 13.1.2. CARTÃO APARÊNCIA
              |--------------------------------------------------------------------------
              |
              | Exibe o tema visual atual da interface.
              | Nesta versão, o tema escuro é apenas informativo.
              |
              | Para permitir trocar o tema, será necessário criar
              | um estado para armazenar a seleção e aplicar o tema
              | ao restante da aplicação.
              |
              */}

              <section className="overflow-hidden rounded-[18px] border border-[#26354B] bg-[#0D1521]">

                {/* Cabeçalho do cartão Aparência. */}
                <div className="flex items-center gap-3 border-b border-[#26354B]/70 px-5 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#28515E] bg-[#14313D] text-[#6CA7B0]">
                    <Monitor size={17} />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">
                      Aparência
                    </h3>

                    <p className="mt-1 text-[11px] text-[#647184]">
                      Preferências visuais da interface
                    </p>
                  </div>
                </div>

                {/* Exibe o tema atualmente disponível. */}
                <div className="p-5">
                  <label className={labelClass}>Tema</label>

                  <div className="mt-2 flex items-center justify-between rounded-xl border border-[#1C2D45] bg-[#101724] px-3 py-3 text-[13px] text-[#8E98A6]">
                    <span>Escuro</span>

                    <span className="rounded-md bg-[#080D17] px-2 py-1 text-[9px] text-[#596474]">
                      FIXO
                    </span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/*
          |--------------------------------------------------------------------------
          | 13.2. COMPONENTE TARIFAS 
          |--------------------------------------------------------------------------
          |
          | Área reservada para o gerenciamento de Tarifas e permissões.
          | Chama o import que tem o caminho da componente Tarifas.
          |
          */}

          {activeTab === 'tarifas' && <TarifasSistema />}

          {/*
          |--------------------------------------------------------------------------
          | 13.3. COMPONENTE USUÁRIOS 
          |--------------------------------------------------------------------------
          |
          | Área reservada para o gerenciamento de usuários e permissões.
          | Chama o import que tem o caminho da componente Usuario.
          |
          */}


          {activeTab === 'usuarios' && <UsuariosSistema />}


          {/*
          |--------------------------------------------------------------------------
          | 13.4. COMPONENTE PONTOS DE MEDIÇÃO
          |--------------------------------------------------------------------------
          |
          | Área reservada para o gerenciamento de Ponto de Medição e permissões.
          | Chama o import que tem o caminho da componente Ponto de Medição.
          |
          */}

          {activeTab === 'pontos' && (
            <section className="rounded-[18px] border border-[#26354B] bg-[#0D1521]">

              <div className="border-b border-[#26354B]/70 px-5 py-4">
                <h3 className="text-sm font-semibold">
                  Pontos de Medição
                </h3>

                <p className="mt-1 text-xs text-[#647184]">
                  Equipamentos associados e estado da medição
                </p>
              </div>

              <div className="p-5 text-sm text-[#9ca1a6]">
                Esta área poderá exibir os pontos de medição, os equipamentos
                associados e o estado de comunicação.
              </div>
            </section>
          )}
        </div>

        {/*
        |--------------------------------------------------------------------------
        | 14. RODAPÉ DO MODAL
        |--------------------------------------------------------------------------
        |
        | Contém os botões Cancelar e Salvar Alterações.
        |
        | Em telas pequenas, os botões ficam empilhados.
        | Em telas maiores, ficam lado a lado.
        |
        | flex-col-reverse = empilha os botões em telas pequenas.
        | sm:flex-row = coloca os botões lado a lado em telas maiores.
        |
        */}

        <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-[#26354B] bg-[#0D1523] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

          {/* Descarta a edição atual e fecha o modal. */}
          <button
            type="button"
            onClick={cancelChanges}
            className="rounded-xl border border-[#24416D] px-4 py-2.5 text-xs font-semibold text-[#9CA7B7] transition hover:bg-[#111D30] hover:text-white"
          >
            Cancelar
          </button>

          {/* Atualiza o estado local e fecha o modal. */}
          <button
            type="button"
            onClick={saveChanges}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#2855A4] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#3568C4]"
          >
            <Save size={14} />
            Salvar Alterações
          </button>
        </footer>
      </section>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| 15. EXPORTAÇÃO DO COMPONENTE
|--------------------------------------------------------------------------
|
| Permite importar o componente de duas formas:
|
| Exportação nomeada:
| import { ConfiguracoesSistemaModal } from './configuracoesSistemaModal';
|
| Exportação padrão:
| import ConfiguracoesSistemaModal from './configuracoesSistemaModal';
|
| O projeto pode utilizar uma das formas, conforme o import existente.
|
*/

export default ConfiguracoesSistemaModal;
