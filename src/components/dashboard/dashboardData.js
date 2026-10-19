
import { Cpu, CheckCircle2, WifiOff, Zap } from 'lucide-react';

export const summaryCards = [
  {
    label: 'Consumo Total',
    value: '1.284 kWh',
    detail: 'Consumo acumulado',
    change: '+12.5%',
    tone: 'blue',
    icon: Cpu,
  },
  {
    label: 'Dispositivos Ativos',
    value: '24',
    detail: 'Dispositivos conectados',
    change: '+8.2%',
    tone: 'green',
    icon: CheckCircle2,
  },
  {
    label: 'Dispositivos Offline',
    value: '3',
    detail: 'Precisam de atenção',
    change: '-2.4%',
    tone: 'red',
    icon: WifiOff,
  },
  {
    label: 'Economia de Energia',
    value: '18.6%',
    detail: 'Economia estimada',
    change: '+5.7%',
    tone: 'yellow',
    icon: Zap,
  },
    {
    label: 'Dispositivos Offline',
    value: '3',
    detail: 'Precisam de atenção',
    change: '-2.4%',
    tone: 'red',
    icon: WifiOff,
  },
   {
    label: 'Dispositivos Ativos',
    value: '24',
    detail: 'Dispositivos conectados',
    change: '+8.2%',
    tone: 'green',
    icon: CheckCircle2,
  }
];
