import { TempStatus, CoolerMode } from '@/types';

export const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
};

export const getTempStatus = (temp: number, min: number, max: number): TempStatus => {
  if (temp < min || temp > max) {
    return 'danger';
  }
  if (temp < min + 1 || temp > max - 1) {
    return 'warning';
  }
  return 'normal';
};

export const getTempStatusColor = (status: TempStatus): string => {
  const colors = {
    normal: '#00b42a',
    warning: '#ff7d00',
    danger: '#f53f3f'
  };
  return colors[status];
};

export const getCoolerModeText = (mode: CoolerMode): string => {
  const texts = {
    cooling: '制冷稳定',
    plug_in: '等待装卸插电中',
    oil: '油机运行中',
    standby: '待机中'
  };
  return texts[mode];
};

export const getCoolerModeColor = (mode: CoolerMode): string => {
  const colors = {
    cooling: '#00b42a',
    plug_in: '#0e8aff',
    oil: '#ff7d00',
    standby: '#86909c'
  };
  return colors[mode];
};

export const getTimeDiffText = (dateStr: string): string => {
  const now = new Date().getTime();
  const target = new Date(dateStr).getTime();
  const diff = Math.floor((now - target) / 1000 / 60);
  
  if (diff < 1) return '刚刚';
  if (diff < 60) return `${diff}分钟前`;
  if (diff < 1440) return `${Math.floor(diff / 60)}小时前`;
  return `${Math.floor(diff / 1440)}天前`;
};

export const getEtaText = (dateStr: string): string => {
  const now = new Date().getTime();
  const target = new Date(dateStr).getTime();
  const diff = Math.floor((target - now) / 1000 / 60);
  
  if (diff <= 0) return '即将到达';
  if (diff < 60) return `预计${diff}分钟后到达`;
  if (diff < 1440) return `预计${Math.floor(diff / 60)}小时${diff % 60}分后到达`;
  return `预计${Math.floor(diff / 1440)}天后到达`;
};
