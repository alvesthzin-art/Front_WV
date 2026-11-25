import api from './api';

export const CONFIGURACAO_GRANDEZA = {
  Tensão: { keys: ['tensao'], unit: 'V', label: 'Tensão (V)', color: '#6366f1' },
  Corrente: { keys: ['corrente'], unit: 'A', label: 'Corrente (A)', color: '#f59e0b' },
  Potência: { keys: ['potencia_ativa', 'potencia'], unit: 'W', label: 'Potência (W)', color: '#10b981' },
  Energia: { keys: ['energia_acumulada', 'energia'], unit: 'kWh', label: 'Energia (kWh)', color: '#3b82f6' },
  Frequência: { keys: ['frequencia', 'frequência', 'frequencia_rede'], unit: 'Hz', label: 'Frequência (Hz)', color: '#a855f7' },
  'Fator de potência': { keys: ['fator_potencia', 'fator_de_potencia'], unit: '', label: 'Fator de potência', color: '#f97316' },
};

const HORA = 3600000;

export function obterPeriodosEnergeticos(periodo, agora = new Date()) {
  const meiaNoite = new Date(agora);
  meiaNoite.setHours(0, 0, 0, 0);
  const ontem = new Date(meiaNoite);
  ontem.setDate(ontem.getDate() - 1);

  if (periodo === '6 horas') {
    const fim = agora.getTime();
    return { inicio: fim - 6 * HORA, fim, anterior: fim - 12 * HORA };
  }

  const inicio = periodo === 'Ontem' ? ontem : meiaNoite;
  const fim = periodo === 'Ontem' ? meiaNoite : agora;
  const anterior = new Date(inicio);
  anterior.setDate(anterior.getDate() - 1);
  return {
    inicio: inicio.getTime(),
    fim: fim.getTime(),
    anterior: anterior.getTime(),
    fimAnterior: periodo === 'Ontem'
      ? inicio.getTime()
      : Math.min(inicio.getTime(), anterior.getTime() + (fim - inicio)),
  };
}

export function horarioMedicao(item) {
  return new Date(String(item.data_hora ?? '').replace(' ', 'T')).getTime();
}

function numero(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const resultado = Number(valor);
  return Number.isFinite(resultado) && resultado >= 0 ? resultado : null;
}

export function calcularConsumoMedido(series, { inicio, fim }) {
  let consumo = null;

  for (const { medidor, dados } of series) {
    let anterior = null;

    for (const item of dados) {
      const hora = horarioMedicao(item);
      if (!(hora >= inicio && hora < fim)) continue;

      const energia = numero(item.energia_acumulada);
      const ponto = item.id_ponto_medicao ?? medidor.id_ponto_medicao;
      if (energia !== null && anterior && anterior.ponto === ponto && energia >= anterior.energia) {
        consumo = (consumo ?? 0) + (energia - anterior.energia);
      }
      anterior = energia === null ? null : { ponto, energia };
    }
  }
  return consumo;
}

export async function buscarIndicadoresEnergeticos(filtroPeriodo, periodo, filtros, signal) {
  if (filtroPeriodo === '6 horas') return null;

  const data = new Date(periodo.inicio).toLocaleDateString('sv-SE');
  const { local, setor, equipamento } = filtros;
  const resposta = await api.get('/medicoes/indicadores', {
    signal,
    params: {
      inicio: data,
      fim: data,
      ...(local && { local }),
      ...(setor && { setor }),
      ...(equipamento && { equipamento }),
    },
  });

  return resposta.data.dados;
}

export function calcularIndicadoresGrandeza(series, periodo, grandeza) {
  const { keys } = CONFIGURACAO_GRANDEZA[grandeza];

  function resumirLeituras(inicio, fim) {
    const medidores = new Set();
    let soma = 0;
    let quantidade = 0;
    let minimo = Infinity;
    let maximo = -Infinity;
    let ultima = null;
    let pontoMinimo = null;
    let pontoMaximo = null;
    let ultimoHorario = -Infinity;

    for (const { medidor, dados } of series) {
      for (const item of dados) {
        const hora = horarioMedicao(item);
        if (!(hora >= inicio && hora < fim)) continue;
        const chave = keys.find((campo) => item[campo] != null && item[campo] !== '');
        const valor = numero(item[chave]);
        if (valor === null) continue;

        medidores.add(medidor.id);
        soma += valor;
        quantidade++;
        const idPonto = item.id_ponto_medicao ?? medidor.id_ponto_medicao;
        const ponto = String(idPonto) === String(medidor.id_ponto_medicao) && medidor.nome_ponto_medicao
          ? medidor.nome_ponto_medicao
          : (idPonto != null ? `Ponto ${idPonto}` : `Medidor ${medidor.id}`);
        if (valor < minimo) {
          minimo = valor;
          pontoMinimo = ponto;
        }
        if (valor > maximo) {
          maximo = valor;
          pontoMaximo = ponto;
        }
        if (hora >= ultimoHorario) {
          ultimoHorario = hora;
          ultima = valor;
        }
      }
    }

    return { media: quantidade ? soma / quantidade : null, minimo, maximo, ultima, ultimoHorario, pontoMinimo, pontoMaximo, medidores };
  }

  const atual = resumirLeituras(periodo.inicio, periodo.fim);
  const anterior = resumirLeituras(periodo.anterior, periodo.fimAnterior ?? periodo.inicio);
  const mesmosMedidores = atual.medidores.size === anterior.medidores.size
    && [...atual.medidores].every((id) => anterior.medidores.has(id));

  return {
    ...atual,
    variacao: mesmosMedidores && atual.media !== null && anterior.media > 0
      ? ((atual.media - anterior.media) / anterior.media) * 100
      : null,
  };
}