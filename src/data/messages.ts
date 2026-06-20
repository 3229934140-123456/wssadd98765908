import { Message } from '@/types';

const now = new Date();

export const messages: Message[] = [
  {
    id: 'm1',
    type: 'abnormal',
    title: '温度异常预警',
    content: '订单CC20240615002（巴氏鲜奶）温度已达7.8℃，超过目标温区6℃上限，请注意关注。',
    time: new Date(now.getTime() - 40 * 60 * 1000).toISOString(),
    orderId: '2',
    read: false,
    level: 'danger'
  },
  {
    id: 'm2',
    type: 'door',
    title: '货门开启提醒',
    content: '订单CC20240615002货门已开启，请注意温度变化。',
    time: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
    orderId: '2',
    read: false,
    level: 'warning'
  },
  {
    id: 'm3',
    type: 'system',
    title: '订单已发货',
    content: '您的订单CC20240615001（进口车厘子）已从上海浦东冷库发出，预计2小时后到达。',
    time: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    orderId: '1',
    read: true,
    level: 'info'
  },
  {
    id: 'm4',
    type: 'system',
    title: '订单已发货',
    content: '您的订单CC20240615003（胰岛素注射液）正在装货中，即将出发。',
    time: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    orderId: '3',
    read: true,
    level: 'info'
  },
  {
    id: 'm5',
    type: 'arrival',
    title: '订单即将到达',
    content: '订单CC20240615001即将到达杭州农副产品物流中心，请准备收货。',
    time: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    orderId: '1',
    read: true,
    level: 'info'
  },
  {
    id: 'm6',
    type: 'system',
    title: '订单已签收',
    content: '订单CC20240614008（冻虾仁）已正常签收，感谢您的使用。',
    time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    orderId: '4',
    read: true,
    level: 'info'
  },
  {
    id: 'm7',
    type: 'abnormal',
    title: '温度异常提醒',
    content: '订单CC20240613012（新鲜草莓）运输途中出现温度波动，详情请查看订单。',
    time: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    orderId: '5',
    read: true,
    level: 'warning'
  }
];

export const getUnreadCount = (): number => {
  return messages.filter(m => !m.read).length;
};

export const getMessagesByType = (type?: string): Message[] => {
  if (!type || type === 'all') return messages;
  return messages.filter(m => m.type === type);
};
