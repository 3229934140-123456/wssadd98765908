import { Order, TemperaturePoint, SwitchNode, ProgressStep, AbnormalPeriod, WarningInfo, AcceptanceConclusion } from '@/types';

const STORAGE_KEY_PREFIX = 'cold_chain_';

const saveToStorage = (key: string, data: any) => {
  try {
    const fullKey = STORAGE_KEY_PREFIX + key;
    localStorage.setItem(fullKey, JSON.stringify(data));
  } catch (e) {
    console.error('[Storage] 保存数据失败', e);
  }
};

const loadFromStorage = (key: string): any => {
  try {
    const fullKey = STORAGE_KEY_PREFIX + key;
    const data = localStorage.getItem(fullKey);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('[Storage] 读取数据失败', e);
    return null;
  }
};

const generateTempHistory = (baseTemp: number, count: number = 48): TemperaturePoint[] => {
  const history: TemperaturePoint[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 30 * 60 * 1000);
    const variation = (Math.random() - 0.5) * 2;
    history.push({
      time: time.toISOString(),
      temperature: Math.round((baseTemp + variation) * 10) / 10
    });
  }
  return history;
};

const generateAbnormalHistory = (): TemperaturePoint[] => {
  const history: TemperaturePoint[] = [];
  const now = new Date();
  for (let i = 47; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 30 * 60 * 1000);
    let temp = 4.5;
    if (i < 20 && i > 8) {
      temp = 8 + (20 - i) * 0.3;
    }
    if (i <= 8) {
      temp = 10 - (8 - i) * 0.5;
    }
    const variation = (Math.random() - 0.5) * 1;
    history.push({
      time: time.toISOString(),
      temperature: Math.round((temp + variation) * 10) / 10
    });
  }
  return history;
};

const generateWarningHistory = (): TemperaturePoint[] => {
  const history: TemperaturePoint[] = [];
  const now = new Date();
  for (let i = 47; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 30 * 60 * 1000);
    let temp = 3.5;
    if (i < 15) {
      temp = 3.5 + (15 - i) * 0.1;
    }
    const variation = (Math.random() - 0.5) * 0.5;
    history.push({
      time: time.toISOString(),
      temperature: Math.round((temp + variation) * 10) / 10
    });
  }
  return history;
};

const now = new Date();

const baseOrders: Order[] = [
  {
    id: '1',
    orderNo: 'CC20240615001',
    cargoName: '进口车厘子 500箱',
    cargoType: '生鲜水果',
    origin: '上海浦东冷库',
    destination: '杭州农副产品物流中心',
    plateNumber: '浙A·D8526',
    driverName: '张师傅',
    driverPhone: '138****5678',
    status: 'in_transit',
    currentTemp: 3.2,
    targetTempMin: 0,
    targetTempMax: 5,
    tempStatus: 'normal',
    coolerMode: 'cooling',
    coolerModeText: '制冷稳定',
    estimatedArrival: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    lastDoorOpenTime: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    distance: '约120公里',
    progressPercent: 65,
    departureTime: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    tempHistory: generateTempHistory(3.5),
    switchNodes: [
      { time: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), type: 'plug_to_oil', description: '出库出发，切换油机运行' },
      { time: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), type: 'door_open', description: '中途开门检查' },
      { time: new Date(now.getTime() - 3 * 60 * 55 * 1000).toISOString(), type: 'door_close', description: '货门关闭，继续制冷' }
    ],
    abnormalPeriods: [],
    isAbnormal: false,
    hasRemark: false,
    hasReview: false
  },
  {
    id: '2',
    orderNo: 'CC20240615002',
    cargoName: '巴氏鲜奶 2000箱',
    cargoType: '乳制品',
    origin: '蒙牛乳业工厂',
    destination: '宁波三江超市配送中心',
    plateNumber: '浙B·K3389',
    driverName: '李师傅',
    driverPhone: '139****2345',
    status: 'in_transit',
    currentTemp: 7.8,
    targetTempMin: 2,
    targetTempMax: 6,
    tempStatus: 'danger',
    coolerMode: 'oil',
    coolerModeText: '油机运行中',
    estimatedArrival: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
    lastDoorOpenTime: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
    distance: '约180公里',
    progressPercent: 40,
    departureTime: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    tempHistory: generateAbnormalHistory(),
    switchNodes: [
      { time: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), type: 'plug_to_oil', description: '出库出发，切换油机运行' },
      { time: new Date(now.getTime() - 50 * 60 * 1000).toISOString(), type: 'door_open', description: '服务区休息开门' }
    ],
    abnormalPeriods: [
      {
        id: 'ab1',
        startTime: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
        endTime: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        maxTemp: 10.5,
        minTemp: 4.2,
        type: 'door_open_long',
        description: '货门开启时间过长，温度上升'
      }
    ],
    handlingProgress: [
      { id: 's1', title: '温度异常预警', description: '系统检测到温度超标', time: new Date(now.getTime() - 40 * 60 * 1000).toISOString(), completed: true, current: false },
      { id: 's2', title: '司机已确认', description: '司机确认货门关闭', time: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), completed: true, current: false },
      { id: 's3', title: '调度远程干预', description: '调度已远程切换油机', time: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), completed: true, current: true },
      { id: 's4', title: '温度恢复中', description: '预计15分钟内恢复正常', time: '', completed: false, current: false }
    ],
    isAbnormal: true,
    abnormalDesc: '温度偏高，正在恢复中',
    hasRemark: false,
    hasReview: false
  },
  {
    id: '3',
    orderNo: 'CC20240615003',
    cargoName: '胰岛素注射液 100箱',
    cargoType: '医药冷链',
    origin: '国药控股仓库',
    destination: '温州医科大学附属一院',
    plateNumber: '浙C·M7752',
    driverName: '王师傅',
    driverPhone: '137****8899',
    status: 'loading',
    currentTemp: 4.8,
    targetTempMin: 2,
    targetTempMax: 8,
    tempStatus: 'warning',
    coolerMode: 'plug_in',
    coolerModeText: '等待装卸插电中',
    estimatedArrival: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(),
    lastDoorOpenTime: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
    distance: '约320公里',
    progressPercent: 5,
    departureTime: '',
    tempHistory: generateWarningHistory(),
    switchNodes: [
      { time: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), type: 'plug_to_oil', description: '车辆到站，接通电源' }
    ],
    abnormalPeriods: [],
    isAbnormal: false,
    warningInfo: {
      enabled: true,
      direction: 'up',
      diff: 3.2,
      currentAction: '装卸货期间保持插电制冷',
      estimatedRecovery: '装车完成后出发即恢复正常'
    },
    hasRemark: false,
    hasReview: false
  },
  {
    id: '4',
    orderNo: 'CC20240614008',
    cargoName: '冻虾仁 800箱',
    cargoType: '冷冻水产',
    origin: '舟山国际水产城',
    destination: '上海盒马鲜生配送中心',
    plateNumber: '沪E·H6621',
    driverName: '陈师傅',
    driverPhone: '136****5566',
    status: 'completed',
    currentTemp: -18.2,
    targetTempMin: -22,
    targetTempMax: -18,
    tempStatus: 'normal',
    coolerMode: 'standby',
    coolerModeText: '已签收',
    estimatedArrival: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastDoorOpenTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    distance: '已送达',
    progressPercent: 100,
    departureTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000).toISOString(),
    tempHistory: generateTempHistory(-20),
    switchNodes: [
      { time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000).toISOString(), type: 'plug_to_oil', description: '出库出发' },
      { time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), type: 'oil_to_plug', description: '到达目的地' }
    ],
    abnormalPeriods: [],
    isAbnormal: false,
    acceptanceConclusion: {
      result: 'normal',
      resultText: '正常验收',
      reason: '全程温度稳定，无异常',
      remark: '货物完好，无解冻现象',
      relatedAbnormalIds: [],
      submitTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString()
    },
    hasRemark: true,
    hasReview: false
  },
  {
    id: '5',
    orderNo: 'CC20240613012',
    cargoName: '新鲜草莓 300篮',
    cargoType: '生鲜水果',
    origin: '建德草莓基地',
    destination: '杭州鲜丰水果总仓',
    plateNumber: '浙A·F2235',
    driverName: '刘师傅',
    driverPhone: '135****7788',
    status: 'completed',
    currentTemp: 5.5,
    targetTempMin: 0,
    targetTempMax: 8,
    tempStatus: 'normal',
    coolerMode: 'standby',
    coolerModeText: '已签收',
    estimatedArrival: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lastDoorOpenTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    distance: '已送达',
    progressPercent: 100,
    departureTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000).toISOString(),
    tempHistory: generateTempHistory(4),
    switchNodes: [],
    abnormalPeriods: [
      {
        id: 'ab2',
        startTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 - 1.5 * 60 * 60 * 1000).toISOString(),
        maxTemp: 9.2,
        minTemp: 4.8,
        type: 'over_temp',
        description: '途中堵车，温度短暂升高',
        remark: '客户已确认不影响品质，正常签收'
      }
    ],
    isAbnormal: false,
    acceptanceConclusion: {
      result: 'deduct',
      resultText: '扣损验收',
      reason: '温度异常导致部分草莓变软',
      remark: '约5%的草莓有轻微变软，扣除对应货款',
      relatedAbnormalIds: ['ab2'],
      submitTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString()
    },
    hasRemark: true,
    hasReview: false
  }
];

export const orders: Order[] = baseOrders.map(order => {
  const savedData = loadFromStorage(`order_${order.id}`);
  if (savedData) {
    return { ...order, ...savedData };
  }
  return order;
});

export const getOrderById = (id: string): Order | undefined => {
  const order = orders.find(order => order.id === id);
  if (order) {
    const savedData = loadFromStorage(`order_${id}`);
    if (savedData) {
      return { ...order, ...savedData };
    }
  }
  return order;
};

export const updateOrderData = (id: string, updates: Partial<Order>): void => {
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index] = { ...orders[index], ...updates };
    saveToStorage(`order_${id}`, updates);
  }
};

export const saveAbnormalRemark = (orderId: string, abnormalId: string, remark: string): void => {
  const order = getOrderById(orderId);
  if (order) {
    const abnormalPeriods = order.abnormalPeriods.map(ap => 
      ap.id === abnormalId ? { ...ap, remark } : ap
    );
    const hasRemark = abnormalPeriods.some(ap => ap.remark && ap.remark.length > 0);
    updateOrderData(orderId, { abnormalPeriods, hasRemark });
  }
};

export const saveAcceptanceConclusion = (orderId: string, conclusion: AcceptanceConclusion): void => {
  const hasReview = conclusion.result === 'reject';
  updateOrderData(orderId, { 
    acceptanceConclusion: conclusion,
    hasReview,
    status: 'completed'
  });
};

export const getInTransitOrders = (): Order[] => {
  return orders.filter(o => {
    const savedData = loadFromStorage(`order_${o.id}`);
    const order = savedData ? { ...o, ...savedData } : o;
    return order.status === 'in_transit' || order.status === 'loading';
  });
};

export const getHistoryOrders = (): Order[] => {
  return orders.filter(o => {
    const savedData = loadFromStorage(`order_${o.id}`);
    const order = savedData ? { ...o, ...savedData } : o;
    return order.status === 'completed' || order.status === 'arrived';
  });
};
