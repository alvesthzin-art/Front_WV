import React, { useEffect, useState } from 'react';
import { UsuariosSistema } from './usuarioSistema.jsx';
import { GeralSistema } from './geralSistema.jsx';
import {
  X,
  Settings,
  Users,
  Monitor,
  Save,
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
  { id: 'usuarios', label: 'Usuários', icon: Users },
];

/*
|--------------------------------------------------------------------------
| 2. VALORES INICIAIS DOS CAMPOS
|--------------------------------------------------------------------------
|
| Estes valores aparecem quando o modal é inicializado.
|
| nomeEmpresa = nome inicial da empresa.
| Para alterar os valores iniciais, modifique os valores abaixo.
|
| ATENÇÃO:
| Estes valores são preferências da interface e ficam persistidos
| no navegador para serem reaproveitados quando o modal for reaberto.
|
*/

const initialSettings = {
  nomeEmpresa: 'Watt Vision',
};

const SETTINGS_KEY = 'wattvision_settings';

function carregarConfiguracoes() {
  try {
    const armazenadas = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    return armazenadas && typeof armazenadas === 'object'
      ? { nomeEmpresa: armazenadas.nomeEmpresa || initialSettings.nomeEmpresa }
      : initialSettings;
  } catch {
    return initialSettings;
  }
}

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

export function ConfiguracoesSistemaModal({ onClose, theme = 'dark', onThemeChange, usuario }) {

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
  const [settings, setSettings] = useState(carregarConfiguracoes);
  const [temaSelecionado, setTemaSelecionado] = useState(theme);

  /*
  | saved guarda os últimos valores confirmados para o botão Cancelar.
  */
  const [saved, setSaved] = useState(carregarConfiguracoes);

  const isAdministrador = usuario?.perfil === 'Administrador';
  const tabsDisponiveis = isAdministrador
    ? tabs
    : tabs.filter((tab) => tab.id === 'geral');
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
  | Persiste as preferências gerais e aplica o tema somente após
  | o usuário confirmar em Salvar Alterações.
  |
  */

  const saveChanges = () => {
    setSaved(settings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // A tela continua funcionando mesmo sem armazenamento local disponível.
    }
    onThemeChange?.(temaSelecionado);
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
              {isAdministrador
                ? 'Preferências gerais e gerenciamento de usuários'
                : 'Preferências gerais do sistema'}
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
          {tabsDisponiveis.map((tab) => {
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
              | Permite alternar o tema visual de toda a interface.
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

                <div className="p-5">
                  <label className={labelClass}>Tema</label>

                  <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-[#1C2D45] bg-[#101724] p-1">
                    {[
                      { id: 'dark', label: 'Escuro', description: 'Fundo escuro' },
                      { id: 'light', label: 'Claro', description: 'Fundo claro' },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setTemaSelecionado(option.id)}
                        aria-pressed={temaSelecionado === option.id}
                        className={`rounded-lg border px-3 py-3 text-left transition ${temaSelecionado === option.id ? 'border-[#3768C5]/60 bg-[#193564] text-white' : 'border-transparent text-[#8E98A6] hover:bg-[#172235] hover:text-white'}`}
                      >
                        <span className="block text-xs font-semibold">{option.label}</span>
                        <span className="mt-1 block text-[10px] opacity-75">{option.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/*
          |--------------------------------------------------------------------------
          | 13.2. COMPONENTE USUÁRIOS
          |--------------------------------------------------------------------------
          |
          | Área reservada para o gerenciamento de usuários e permissões.
          | Chama o import que tem o caminho da componente Usuario.
          |
          */}


          {activeTab === 'usuarios' && <UsuariosSistema />}


          {/*
          |--------------------------------------------------------------------------
          | 13.3. COMPONENTE PONTOS DE MEDIÇÃO
          |--------------------------------------------------------------------------
          |
          | Área reservada para o gerenciamento de Ponto de Medição e permissões.
          | Chama o import que tem o caminho da componente Ponto de Medição.
           */}
          
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
            <button
              type="button"
              onClick={cancelChanges}
              className="rounded-xl border border-[#24416D] px-4 py-2.5 text-xs font-semibold text-[#9CA7B7] transition hover:bg-[#111D30] hover:text-white"
            >
              Cancelar
            </button>

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

{/*
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
*/}

export default ConfiguracoesSistemaModal;
