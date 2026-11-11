import { Activity, CheckCircle2, WifiOff, Zap } from 'lucide-react';

export const summaryCards = [
  { label: 'Tensão Atual', value: '—', detail: 'Última leitura do sensor', tone: 'blue', icon: Activity },
  { label: 'Dispositivos Ativos', value: '—', detail: 'Status ativo ou online', tone: 'green', icon: CheckCircle2 },
  { label: 'Dispositivos Offline', value: '—', detail: 'Status offline ou inativo', tone: 'red', icon: WifiOff },
  { label: 'Fator de Potência', value: '—', detail: 'Última leitura do sensor', tone: 'yellow', icon: Zap },
];
