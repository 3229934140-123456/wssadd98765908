export type OrderStatus = 'in_transit' | 'loading' | 'arrived' | 'completed';

export type CoolerMode = 'cooling' | 'plug_in' | 'oil' | 'standby';

export type TempStatus = 'normal' | 'warning' | 'danger';

export type AcceptanceResult = 'normal' | 'deduct' | 'reject' | null;

export interface TemperaturePoint {
  time: string;
  temperature: number;
}

export interface SwitchNode {
  time: string;
  type: 'oil_to_plug' | 'plug_to_oil' | 'door_open' | 'door_close';
  description: string;
}

export interface ProgressStep {
  id: string;
  title: string;
  description: string;
  time: string;
  completed: boolean;
  current: boolean;
}

export interface WarningInfo {
  enabled: boolean;
  direction: 'up' | 'down';
  diff: number;
  currentAction: string;
  estimatedRecovery: string;
}

export interface AcceptanceConclusion {
  result: AcceptanceResult;
  resultText: string;
  reason: string;
  remark: string;
  relatedAbnormalIds: string[];
  submitTime: string;
}

export interface AbnormalPeriod {
  id: string;
  startTime: string;
  endTime: string;
  maxTemp: number;
  minTemp: number;
  type: 'over_temp' | 'door_open_long' | 'cooler_stop';
  description: string;
  remark?: string;
  selected?: boolean;
}

export interface Order {
  id: string;
  orderNo: string;
  cargoName: string;
  cargoType: string;
  origin: string;
  destination: string;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  status: OrderStatus;
  currentTemp: number;
  targetTempMin: number;
  targetTempMax: number;
  tempStatus: TempStatus;
  coolerMode: CoolerMode;
  coolerModeText: string;
  estimatedArrival: string;
  lastDoorOpenTime: string;
  distance: string;
  progressPercent: number;
  departureTime: string;
  tempHistory: TemperaturePoint[];
  switchNodes: SwitchNode[];
  abnormalPeriods: AbnormalPeriod[];
  handlingProgress?: ProgressStep[];
  isAbnormal: boolean;
  abnormalDesc?: string;
  warningInfo?: WarningInfo;
  acceptanceConclusion?: AcceptanceConclusion;
  hasRemark?: boolean;
  hasReview?: boolean;
}

export interface Message {
  id: string;
  type: 'abnormal' | 'system' | 'arrival' | 'door';
  title: string;
  content: string;
  time: string;
  orderId: string;
  read: boolean;
  level: 'info' | 'warning' | 'danger';
}

export interface UserInfo {
  name: string;
  company: string;
  phone: string;
  avatar?: string;
  verified: boolean;
}
