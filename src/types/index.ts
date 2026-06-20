export type OrderStatus = 'in_transit' | 'loading' | 'arrived' | 'completed' | 'reviewing';

export type CoolerMode = 'cooling' | 'plug_in' | 'oil' | 'standby';

export type TempStatus = 'normal' | 'warning' | 'danger';

export type AcceptanceResult = 'normal' | 'deduct' | 'reject' | null;

export type ReviewStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export type ActionType = 'driver_confirm' | 'dispatch_action' | 'system_notice' | 'owner_remark';

export type TraceEventType = 
  | 'acceptance_submit'
  | 'abnormal_remark'
  | 'review_submit'
  | 'review_remark'
  | 'review_status_change'
  | 'review_completed';

export type ReviewTabType = 'pending' | 'processing' | 'completed' | 'all';

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

export interface ResponsiblePerson {
  name: string;
  role: string;
  phone: string;
  avatar?: string;
}

export interface DisposalAction {
  id: string;
  type: ActionType;
  actor: string;
  role: string;
  action: string;
  time: string;
  remark?: string;
}

export interface WarningInfo {
  enabled: boolean;
  direction: 'up' | 'down';
  diff: number;
  currentAction: string;
  estimatedRecovery: string;
  countdownSeconds: number;
  responsiblePerson: ResponsiblePerson;
  driverConfirmed: boolean;
  driverConfirmTime?: string;
  dispatchAction: string;
  dispatchTime?: string;
  disposalActions: DisposalAction[];
}

export interface AcceptanceConclusion {
  result: AcceptanceResult;
  resultText: string;
  reason: string;
  remark: string;
  relatedAbnormalIds: string[];
  submitTime: string;
}

export interface ReviewRecord {
  id: string;
  type: ActionType;
  actor: string;
  role: string;
  content: string;
  time: string;
}

export interface ReviewInfo {
  reviewId: string;
  status: ReviewStatus;
  statusText: string;
  submitTime: string;
  currentHandler: ResponsiblePerson;
  relatedAbnormalIds: string[];
  ownerRemark: string;
  acceptanceReason: string;
  records: ReviewRecord[];
}

export interface TraceRecord {
  id: string;
  type: TraceEventType;
  title: string;
  description: string;
  time: string;
  operator: string;
  operatorRole: string;
  relatedAbnormalIds?: string[];
  remark?: string;
  result?: AcceptanceResult;
  reviewStatus?: ReviewStatus;
  reviewStatusText?: string;
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
  reviewInfo?: ReviewInfo;
  traceRecords?: TraceRecord[];
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
