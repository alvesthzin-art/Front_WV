import React, { useState } from 'react';

// Dados com variações suaves para simular o período de 24h
const dadosTensao = [
  { horario: '09:26', tensao: 224 },
  { horario: '10:00', tensao: 226 },
  { horario: '10:40', tensao: 225 },
  { horario: '11:20', tensao: 227 },
  { horario: '12:00', tensao: 226 },
  { horario: '12:26', tensao: 226 },
  { horario: '13:10', tensao: 231 },
  { horario: '14:00', tensao: 234 },
  { horario: '14:40', tensao: 236 },
  { horario: '15:26', tensao: 232 },
  { horario: '16:10', tensao: 234 },
  { horario: '17:00', tensao: 233 },
  { horario: '17:40', tensao: 237 },
  { horario: '18:26', tensao: 242 },
  { horario: '19:10', tensao: 246 },
  { horario: '19:50', tensao: 242 },
  { horario: '20:30', tensao: 242 },
  { horario: '21:26', tensao: 241 },
  { horario: '22:10', tensao: 237 },
  { horario: '23:00', tensao: 241 },
  { horario: '00:26', tensao: 243 },
  { horario: '01:10', tensao: 243 },
  { horario: '02:00', tensao: 242 },
  { horario: '02:40', tensao: 237 },
  { horario: '03:26', tensao: 238 },
  { horario: '04:10', tensao: 241 },
  { horario: '05:00', tensao: 242 },
  { horario: '05:40', tensao: 246 },
  { horario: '06:26', tensao: 253 },
  { horario: '07:10', tensao: 250 },
  { horario: '08:00', tensao: 254 },
  { horario: '09:00', tensao: 255 },
];

function gerarCaminhoSuave(pontos) {
  if (pontos.length < 2) return '';
  let d = `M ${pontos[0].x},${pontos[0].y}`;

  for (let i = 0; i < pontos.length - 1; i++) {
    const p0 = pontos[i === 0 ? i : i - 1];
    const p1 = pontos[i];
    const p2 = pontos[i + 1];
    const p3 = pontos[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return d;
}

export default function TensaoAoLongoDoTempo() {
  const [periodo, setPeriodo] = useState('24h');

  // Proporção panorâmica (achatada)
  const largura = 1000;
  const altura = 210;

  const margem = {
    superior: 15,
    inferior: 30,
    esquerda: 40,
    direita: 15,
  };

  const minimo = 211;
  const maximo = 268;

  const areaLargura = largura - margem.esquerda - margem.direita;
  const areaAltura = altura - margem.superior - margem.inferior;

  const pontos = dadosTensao.map((item, indice) => {
    const x =
      margem.esquerda +
      (indice / (dadosTensao.length - 1)) * areaLargura;
    const y =
      margem.superior +
      ((maximo - item.tensao) / (maximo - minimo)) * areaAltura;
    return { x, y, horario: item.horario };
  });

  const dCurva = gerarCaminhoSuave(pontos);
  const dArea = `${dCurva} L ${largura - margem.direita},${altura - margem.inferior} L ${margem.esquerda},${altura - margem.inferior} Z`;

  const niveisY = [268, 256, 241, 226, 211];

  // Rótulos do eixo X mostrados na imagem
  const rotulosX = ['09:26', '12:26', '15:26', '18:26', '21:26', '00:26', '03:26', '06:26'];

  return (
    <section className="rounded-2xl border border-[#141C2B] bg-[#070B15] p-5 shadow-2xl text-slate-200">
      {/* Cabeçalho */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium tracking-wide text-slate-100">
            Tensão ao Longo do Tempo
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">Leituras reais</p>
        </div>

        {/* Seleção de Período */}
        <div className="flex items-center gap-1 rounded-xl bg-[#0B1220] p-1 border border-[#162136]">
          {['1h', '6h', '24h', '7d', '30d'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPeriodo(item)}
              className={`rounded-lg px-2.5 py-0.5 text-xs font-medium transition-all ${
                periodo === item
                  ? 'bg-[#1C3B6E] text-white shadow-sm ring-1 ring-[#2E5899]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico SVG */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${largura} ${altura}`}
          className="h-auto w-full"
        >
          <defs>
            <linearGradient id="gradienteTensao24h" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1C4587" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0B1830" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Linhas de Grade e Eixo Y */}
          {niveisY.map((nivel) => {
            const y =
              margem.superior +
              ((maximo - nivel) / (maximo - minimo)) * areaAltura;

            return (
              <g key={nivel}>
                <line
                  x1={margem.esquerda}
                  y1={y}
                  x2={largura - margem.direita}
                  y2={y}
                  stroke="#101827"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={margem.esquerda - 10}
                  y={y + 4}
                  fill="#3B4B66"
                  fontSize="11"
                  fontFamily="sans-serif"
                  textAnchor="end"
                >
                  {nivel}
                </text>
              </g>
            );
          })}

          {/* Sombra abaixo da linha */}
          <path d={dArea} fill="url(#gradienteTensao24h)" />

          {/* Linha principal */}
          <path
            d={dCurva}
            fill="none"
            stroke="#2B62B3"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Eixo X com Horários */}
          {rotulosX.map((horario) => {
            const pontoCorrespondente = pontos.find((p) => p.horario === horario);
            const xPos = pontoCorrespondente
              ? pontoCorrespondente.x
              : margem.esquerda;

            return (
              <text
                key={horario}
                x={xPos}
                y={altura - 4}
                fill="#3B4B66"
                fontSize="11"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                {horario}
              </text>
            );
          })}
        </svg>
      </div>
    </section>
  );
}