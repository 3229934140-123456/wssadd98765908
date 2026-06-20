import { Order, TemperaturePoint, SwitchNode, ProgressStep, AbnormalPeriod, WarningInfo, AcceptanceConclusion, ReviewInfo, ReviewRecord, DisposalAction, TraceRecord, TraceEventType, ReviewStatus } from '@/types';

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
      estimatedRecovery: '预计30分钟内恢复',
      countdownSeconds: 1800,
      responsiblePerson: {
        name: '王调度',
        role: '调度专员',
        phone: '138****1234'
      },
      driverConfirmed: true,
      driverConfirmTime: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      dispatchAction: '已远程确认冷机运行状态正常',
      dispatchTime: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      disposalActions: [
        {
          id: 'd1',
          type: 'system_notice',
          actor: '系统',
          role: '系统',
          action: '检测到温度接近上限，触发预警',
          time: new Date(now.getTime() - 20 * 60 * 1000).toISOString()
        },
        {
          id: 'd2',
          type: 'driver_confirm',
          actor: '王师傅',
          role: '司机',
          action: '已确认货门关闭，冷机运行正常',
          time: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
          remark: '正在装车，预计30分钟后出发'
        },
        {
          id: 'd3',
          type: 'dispatch_action',
          actor: '李调度',
          role: '调度专员',
          action: '远程检查冷机参数，确认设置正确',
          time: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
          remark: '目标温区2-8℃，当前设置正确'
        }
      ]
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
  },
  {
    id: '6',
    orderNo: 'CC20240612005',
    cargoName: '进口三文鱼 200箱',
    cargoType: '冷冻水产',
    origin: '上海洋山港冷库',
    destination: '苏州盒马鲜生配送中心',
    plateNumber: '苏E·J4458',
    driverName: '赵师傅',
    driverPhone: '135****6677',
    status: 'reviewing',
    currentTemp: -12.5,
    targetTempMin: -20,
    targetTempMax: -15,
    tempStatus: 'danger',
    coolerMode: 'standby',
    coolerModeText: '复核中',
    estimatedArrival: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    lastDoorOpenTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    distance: '已送达',
    progressPercent: 100,
    departureTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 - 8 * 60 * 60 * 1000).toISOString(),
    tempHistory: generateAbnormalHistory().map(p => ({ ...p, temperature: p.temperature - 15 })),
    switchNodes: [
      { time: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 - 8 * 60 * 60 * 1000).toISOString(), type: 'plug_to_oil', description: '出库出发，切换油机运行' },
      { time: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), type: 'oil_to_plug', description: '到达目的地' }
    ],
    abnormalPeriods: [
      {
        id: 'ab3',
        startTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 - 5 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(),
        maxTemp: -8.5,
        minTemp: -16.2,
        type: 'cooler_stop',
        description: '冷机故障停止工作，温度严重升高',
        remark: '货主拒收，已启动复核流程'
      },
      {
        id: 'ab4',
        startTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 - 1.5 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000).toISOString(),
        maxTemp: -10.2,
        minTemp: -14.8,
        type: 'over_temp',
        description: '温度未恢复至目标温区',
        remark: '冷机重启后温度下降缓慢'
      }
    ],
    isAbnormal: true,
    abnormalDesc: '冷机故障导致温度异常',
    acceptanceConclusion: {
      result: 'reject',
      resultText: '拒收复核',
      reason: '冷机故障，温度严重超标',
      remark: '冷机故障约3小时，最高温度-8.5℃，远超-15℃上限，怀疑部分三文鱼已变质，申请复核',
      relatedAbnormalIds: ['ab3', 'ab4'],
      submitTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString()
    },
    reviewInfo: {
      reviewId: 'RV20240612001',
      status: 'processing',
      statusText: '处理中',
      submitTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      currentHandler: {
        name: '张主管',
        role: '运营主管',
        phone: '138****8888'
      },
      relatedAbnormalIds: ['ab3', 'ab4'],
      ownerRemark: '冷机故障约3小时，最高温度-8.5℃，远超-15℃上限，怀疑部分三文鱼已变质',
      acceptanceReason: '冷机故障，温度严重超标',
      records: [
        {
          id: 'r1',
          type: 'owner_remark',
          actor: '王经理',
          role: '货主',
          content: '已提交拒收申请，要求质检部门到场检测',
          time: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString()
        },
        {
          id: 'r2',
          type: 'system_notice',
          actor: '系统',
          role: '系统',
          content: '复核申请已受理，分配给张主管处理',
          time: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000).toISOString()
        },
        {
          id: 'r3',
          type: 'dispatch_action',
          actor: '张主管',
          role: '运营主管',
          content: '已联系质检部门，安排2小时内到场检测',
          time: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString()
        },
        {
          id: 'r4',
          type: 'driver_confirm',
          actor: '赵师傅',
          role: '司机',
          content: '已确认冷机故障期间温度记录，配合后续处理',
          time: new Date(now.getTime() - 20 * 60 * 1000).toISOString()
        }
      ]
    },
    hasRemark: true,
    hasReview: true,
    traceRecords: [
      {
        id: 't1',
        type: 'abnormal_remark',
        title: '添加异常备注',
        description: '对异常时段添加了备注',
        time: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
        operator: '王经理',
        operatorRole: '货主',
        relatedAbnormalIds: ['ab3'],
        remark: '冷机故障约3小时，最高温度-8.5℃'
      },
      {
        id: 't2',
        type: 'acceptance_submit',
        title: '提交验收',
        description: '提交拒收复核申请',
        time: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        operator: '王经理',
        operatorRole: '货主',
        relatedAbnormalIds: ['ab3', 'ab4'],
        result: 'reject',
        remark: '冷机故障约3小时，最高温度-8.5℃，远超-15℃上限，怀疑部分三文鱼已变质，申请复核'
      },
      {
        id: 't3',
        type: 'review_status_change',
        title: '复核状态变更',
        description: '复核申请已受理，分配处理人',
        time: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000).toISOString(),
        operator: '系统',
        operatorRole: '系统',
        reviewStatus: 'processing',
        reviewStatusText: '处理中'
      },
      {
        id: 't4',
        type: 'review_remark',
        title: '追加沟通备注',
        description: '货主追加沟通备注',
        time: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        operator: '王经理',
        operatorRole: '货主',
        remark: '请尽快安排质检，客户等着收货'
      }
    ]
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

export const addTraceRecord = (orderId: string, record: Omit<TraceRecord, 'id'>): void => {
  const order = getOrderById(orderId);
  if (!order) return;
  
  const newRecord: TraceRecord = {
    ...record,
    id: `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  const traceRecords = order.traceRecords ? [...order.traceRecords, newRecord] : [newRecord];
  updateOrderData(orderId, { traceRecords });
};

export const saveAbnormalRemark = (orderId: string, abnormalId: string, remark: string): void => {
  const order = getOrderById(orderId);
  if (order) {
    const abnormalPeriods = order.abnormalPeriods.map(ap => 
      ap.id === abnormalId ? { ...ap, remark } : ap
    );
    const hasRemark = abnormalPeriods.some(ap => ap.remark && ap.remark.length > 0);
    updateOrderData(orderId, { abnormalPeriods, hasRemark });
    
    const abnormal = order.abnormalPeriods.find(ap => ap.id === abnormalId);
    addTraceRecord(orderId, {
      type: 'abnormal_remark',
      title: '添加异常备注',
      description: remark ? '更新异常时段备注' : '添加异常时段备注',
      time: new Date().toISOString(),
      operator: '货主',
      operatorRole: '货主',
      relatedAbnormalIds: [abnormalId],
      remark
    });
  }
};

export const saveAcceptanceConclusion = (orderId: string, conclusion: AcceptanceConclusion): void => {
  const hasReview = conclusion.result === 'reject';
  const status = conclusion.result === 'reject' ? 'reviewing' : 'completed';
  
  if (conclusion.result === 'reject') {
    const reviewInfo: ReviewInfo = {
      reviewId: `RV${Date.now()}`,
      status: 'pending',
      statusText: '待处理',
      submitTime: conclusion.submitTime,
      currentHandler: {
        name: '系统',
        role: '待分配',
        phone: '400-888-8888'
      },
      relatedAbnormalIds: conclusion.relatedAbnormalIds,
      ownerRemark: conclusion.remark,
      acceptanceReason: conclusion.reason,
      records: [
        {
          id: `rec${Date.now()}`,
          type: 'owner_remark',
          actor: '货主',
          role: '货主',
          content: `提交${conclusion.resultText}申请：${conclusion.reason}`,
          time: conclusion.submitTime
        }
      ]
    };
    updateOrderData(orderId, { 
      acceptanceConclusion: conclusion,
      hasReview,
      status,
      reviewInfo
    });
  } else {
    updateOrderData(orderId, { 
      acceptanceConclusion: conclusion,
      hasReview,
      status
    });
  }
  
  addTraceRecord(orderId, {
    type: 'acceptance_submit',
    title: '提交验收',
    description: conclusion.resultText,
    time: conclusion.submitTime,
    operator: '货主',
    operatorRole: '货主',
    relatedAbnormalIds: conclusion.relatedAbnormalIds,
    result: conclusion.result,
    remark: conclusion.remark
  });
  
  if (conclusion.result === 'reject') {
    addTraceRecord(orderId, {
      type: 'review_submit',
      title: '发起复核',
      description: `${conclusion.resultText}申请已提交`,
      time: conclusion.submitTime,
      operator: '系统',
      operatorRole: '系统',
      relatedAbnormalIds: conclusion.relatedAbnormalIds,
      reviewStatus: 'pending',
      reviewStatusText: '待处理'
    });
  }
};

export const addReviewRecord = (orderId: string, content: string): void => {
  const order = getOrderById(orderId);
  if (!order || !order.reviewInfo) return;
  
  const newRecord: ReviewRecord = {
    id: `rec${Date.now()}`,
    type: 'owner_remark',
    actor: '货主',
    role: '货主',
    content,
    time: new Date().toISOString()
  };
  
  const reviewInfo: ReviewInfo = {
    ...order.reviewInfo,
    records: [...order.reviewInfo.records, newRecord]
  };
  
  updateOrderData(orderId, { reviewInfo });
  
  addTraceRecord(orderId, {
    type: 'review_remark',
    title: '追加沟通备注',
    description: '货主追加沟通备注',
    time: new Date().toISOString(),
    operator: '货主',
    operatorRole: '货主',
    remark: content
  });
};

export const updateReviewStatus = (orderId: string, status: ReviewStatus, statusText: string, handler?: { name: string; role: string; phone: string }): void => {
  const order = getOrderById(orderId);
  if (!order || !order.reviewInfo) return;
  
  const reviewInfo: ReviewInfo = {
    ...order.reviewInfo,
    status,
    statusText,
    ...(handler && { currentHandler: handler })
  };
  
  let orderStatus: Order['status'] = order.status;
  let hasReview = order.hasReview;
  
  if (status === 'completed') {
    orderStatus = 'completed';
    hasReview = false;
  } else if (status === 'rejected') {
    orderStatus = 'completed';
    hasReview = false;
  }
  
  updateOrderData(orderId, { reviewInfo, status: orderStatus, hasReview });
  
  const systemRecord: ReviewRecord = {
    id: `rec${Date.now()}`,
    type: 'system_notice',
    actor: '系统',
    role: '系统',
    content: `复核状态变更为：${statusText}${handler ? `，处理人：${handler.name}` : ''}`,
    time: new Date().toISOString()
  };
  
  reviewInfo.records.push(systemRecord);
  updateOrderData(orderId, { reviewInfo });
  
  addTraceRecord(orderId, {
    type: 'review_status_change',
    title: '复核状态变更',
    description: `复核状态变更为${statusText}`,
    time: new Date().toISOString(),
    operator: '系统',
    operatorRole: '系统',
    reviewStatus: status,
    reviewStatusText: statusText
  });
  
  if (status === 'completed') {
    addTraceRecord(orderId, {
      type: 'review_completed',
      title: '复核完成',
      description: '复核流程已完成',
      time: new Date().toISOString(),
      operator: '系统',
      operatorRole: '系统',
      reviewStatus: status,
      reviewStatusText: statusText
    });
  }
};

export const refreshOrderData = (orderId: string): Order | undefined => {
  return getOrderById(orderId);
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
    return order.status === 'completed' || order.status === 'arrived' || order.status === 'reviewing';
  });
};
