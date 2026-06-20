import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TempDisplay from '@/components/TempDisplay';
import ProgressTimeline from '@/components/ProgressTimeline';
import { getOrderById, refreshOrderData } from '@/data/orders';
import { Order } from '@/types';
import { formatDate, getEtaText, getTimeDiffText } from '@/utils';

type RecordTabType = 'switch' | 'door';

const OrderDetailPage: React.FC = () => {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [recordTab, setRecordTab] = useState<RecordTabType>('switch');
  const [countdown, setCountdown] = useState<number>(0);
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  useEffect(() => {
    const id = router.params.id;
    if (id) {
      loadOrderData(id as string);
    }
  }, [router.params.id]);

  useDidShow(() => {
    const id = router.params.id;
    if (id) {
      loadOrderData(id as string);
    }
  });

  const loadOrderData = (id: string) => {
    const orderData = getOrderById(id);
    if (orderData) {
      setOrder(orderData);
      if (orderData.warningInfo?.countdownSeconds) {
        setCountdown(orderData.warningInfo.countdownSeconds);
      }
    } else {
      Taro.showToast({
        title: '订单不存在',
        icon: 'none'
      });
    }
  };

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCallDriver = () => {
    if (order?.driverPhone) {
      Taro.makePhoneCall({
        phoneNumber: order.driverPhone.replace(/\*/g, '0')
      }).catch(() => {
        Taro.showToast({
          title: '演示号码无法拨打',
          icon: 'none'
        });
      });
    }
  };

  const handleCallResponsible = (phone: string) => {
    Taro.makePhoneCall({
      phoneNumber: phone.replace(/\*/g, '0')
    }).catch(() => {
      Taro.showToast({
        title: '演示号码无法拨打',
        icon: 'none'
      });
    });
  };

  const goToReceipt = () => {
    if (order) {
      Taro.navigateTo({
        url: `/pages/receipt/index?id=${order.id}`
      });
    }
  };

  const goToReview = () => {
    if (order) {
      Taro.navigateTo({
        url: `/pages/review-followup/index?id=${order.id}`
      });
    }
  };

  if (!order) {
    return (
      <View className={styles.page}>
        <View style={{ textAlign: 'center', padding: '200rpx 0' }}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  const showReceiptBtn = order.status === 'completed' || order.status === 'arrived' || order.status === 'reviewing';
  
  const switchNodes = order.switchNodes.filter(
    n => n.type === 'oil_to_plug' || n.type === 'plug_to_oil'
  );
  const doorNodes = order.switchNodes.filter(
    n => n.type === 'door_open' || n.type === 'door_close'
  );
  const currentRecords = recordTab === 'switch' ? switchNodes : doorNodes;

  const renderWarningCard = () => {
    if (!order.warningInfo?.enabled && order.tempStatus !== 'warning') {
      return null;
    }

    const warningInfo = order.warningInfo || {
      direction: order.currentTemp > order.targetTempMax ? 'up' : 'down',
      diff: order.currentTemp > order.targetTempMax 
        ? Number(Math.abs(order.currentTemp - order.targetTempMax).toFixed(1))
        : Number(Math.abs(order.targetTempMin - order.currentTemp).toFixed(1)),
      currentAction: '系统已自动加强制冷',
      estimatedRecovery: '预计5分钟内恢复正常',
      countdownSeconds: 300,
      responsiblePerson: { name: '系统', role: '待分配', phone: '400-888-8888' },
      driverConfirmed: false,
      dispatchAction: '待调度处理',
      disposalActions: []
    };

    const isDirectionUp = warningInfo.direction === 'up';
    const diffValue = warningInfo.diff;
    const targetText = isDirectionUp ? '上限' : '下限';
    const oppositeText = isDirectionUp ? '下限' : '上限';
    const targetDiff = diffValue;
    const oppositeDiff = isDirectionUp 
      ? Math.abs(order.currentTemp - order.targetTempMin).toFixed(1)
      : Math.abs(order.targetTempMax - order.currentTemp).toFixed(1);

    const getDisposalIconClass = (type: string) => {
      if (type === 'system_notice') return styles.system;
      if (type === 'driver_confirm') return styles.driver;
      if (type === 'dispatch_action') return styles.dispatch;
      if (type === 'owner_remark') return styles.owner;
      return styles.system;
    };

    const getDisposalIcon = (type: string) => {
      if (type === 'system_notice') return '📢';
      if (type === 'driver_confirm') return '👨‍✈️';
      if (type === 'dispatch_action') return '📱';
      if (type === 'owner_remark') return '💬';
      return '📝';
    };

    return (
      <View className={classnames(
        styles.warningCard,
        !isDirectionUp && styles.warningCardDown
      )}>
        <View className={styles.warningHeader}>
          <Text className={styles.warningIcon}>⚠️</Text>
          <Text className={styles.warningTitle}>温度接近{targetText}</Text>
          <Text className={styles.warningSubTitle}>{warningInfo.estimatedRecovery}</Text>
        </View>
        <View className={styles.warningBody}>
          <View className={styles.warningItem}>
            <Text className={styles.warningLabel}>距离{targetText}</Text>
            <Text className={styles.warningValue}>
              <Text className={styles.highlight}>{targetDiff}℃</Text>
            </Text>
          </View>
          <View className={styles.warningItem}>
            <Text className={styles.warningLabel}>距离{oppositeText}</Text>
            <Text className={styles.warningValue}>
              <Text>{oppositeDiff}℃</Text>
            </Text>
          </View>
          <View className={styles.warningItem}>
            <Text className={styles.warningLabel}>当前动作</Text>
            <Text className={styles.warningValue}>{warningInfo.currentAction}</Text>
          </View>
        </View>

        <View className={styles.warningSectionTitle}>
          <Text>责任人</Text>
        </View>
        <View className={styles.responsiblePerson}>
          <View className={styles.respAvatar}>
            <Text>{warningInfo.responsiblePerson.name.charAt(0)}</Text>
          </View>
          <View className={styles.respInfo}>
            <View className={styles.respName}>{warningInfo.responsiblePerson.name}</View>
            <View className={styles.respRole}>{warningInfo.responsiblePerson.role}</View>
          </View>
          <View 
            className={styles.respPhone}
            onClick={() => handleCallResponsible(warningInfo.responsiblePerson.phone)}
          >
            <Text>📞</Text>
          </View>
        </View>

        <View className={styles.warningSectionTitle}>
          <Text>处置进度</Text>
        </View>
        <View className={styles.statusChecks}>
          <View className={classnames(
            styles.statusCheck,
            warningInfo.driverConfirmed && styles.done
          )}>
            <View className={styles.statusDot} />
            <View>
              <View className={styles.statusText}>司机确认</View>
              {warningInfo.driverConfirmTime && (
                <View className={styles.statusTime}>{formatDate(warningInfo.driverConfirmTime)}</View>
              )}
            </View>
          </View>
          <View className={classnames(
            styles.statusCheck,
            !!warningInfo.dispatchTime && styles.done
          )}>
            <View className={styles.statusDot} />
            <View>
              <View className={styles.statusText}>调度处理</View>
              {warningInfo.dispatchTime && (
                <View className={styles.statusTime}>{formatDate(warningInfo.dispatchTime)}</View>
              )}
            </View>
          </View>
        </View>

        {countdown > 0 && (
          <View className={styles.countdownBox}>
            <View className={styles.countdownLabel}>预计恢复倒计时</View>
            <View className={styles.countdownValue}>{formatCountdown(countdown)}</View>
          </View>
        )}

        {warningInfo.disposalActions && warningInfo.disposalActions.length > 0 && (
          <>
            <View className={styles.warningSectionTitle}>
              <Text>处置记录</Text>
            </View>
            <View className={styles.disposalList}>
              {warningInfo.disposalActions.slice().reverse().map(action => (
                <View key={action.id} className={styles.disposalItem}>
                  <View className={classnames(
                    styles.disposalIcon,
                    getDisposalIconClass(action.type)
                  )}>
                    <Text>{getDisposalIcon(action.type)}</Text>
                  </View>
                  <View className={styles.disposalContent}>
                    <View className={styles.disposalHeader}>
                      <Text className={styles.disposalActor}>{action.actor} · {action.role}</Text>
                      <Text className={styles.disposalTime}>{formatDate(action.time)}</Text>
                    </View>
                    <Text className={styles.disposalAction}>{action.action}</Text>
                    {action.remark && (
                      <Text className={styles.disposalRemark}>{action.remark}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    );
  };

  const renderReviewBtn = () => {
    if (!order.reviewInfo) return null;
    
    return (
      <View className={styles.reviewBtn} onClick={goToReview}>
        <View className={styles.reviewBtnLeft}>
          <Text className={styles.reviewBtnIcon}>🔍</Text>
          <Text className={styles.reviewBtnText}>复核跟进</Text>
          <View className={styles.reviewBtnBadge}>
            <Text>{order.reviewInfo.statusText}</Text>
          </View>
        </View>
        <Text className={styles.reviewBtnArrow}>›</Text>
      </View>
    );
  };

  const renderConclusion = () => {
    if (!order.acceptanceConclusion) return null;
    const conclusion = order.acceptanceConclusion;
    
    return (
      <View className={styles.conclusionSection}>
        <View className={styles.conclusionHeader}>
          <Text className={styles.conclusionTitle}>验收结论</Text>
          <View
            className={classnames(
              styles.conclusionBadge,
              styles[conclusion.result || 'normal']
            )}
          >
            <Text>{conclusion.resultText}</Text>
          </View>
        </View>
        <View className={styles.conclusionItem}>
          <Text className={styles.conclusionLabel}>验收原因</Text>
          <Text className={styles.conclusionValue}>{conclusion.reason || '暂无'}</Text>
        </View>
        {conclusion.remark && (
          <View className={styles.conclusionItem}>
            <Text className={styles.conclusionLabel}>货主备注</Text>
            <Text className={styles.conclusionValue}>{conclusion.remark}</Text>
          </View>
        )}
        {conclusion.relatedAbnormalIds && conclusion.relatedAbnormalIds.length > 0 && (
          <View className={styles.conclusionItem}>
            <Text className={styles.conclusionLabel}>关联异常</Text>
            <View className={styles.relatedAbnormals}>
              {conclusion.relatedAbnormalIds.map(id => {
                const abnormal = order.abnormalPeriods.find(a => a.id === id);
                return (
                  <View key={id} className={styles.relatedTag}>
                    <Text>{abnormal?.description || '异常时段'}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
        <View className={styles.conclusionItem}>
          <Text className={styles.conclusionLabel}>提交时间</Text>
          <Text className={styles.conclusionValue}>{formatDate(conclusion.submitTime)}</Text>
        </View>
      </View>
    );
  };

  const getTraceDotClass = (type: string) => {
    if (type === 'acceptance_submit') return styles.acceptance;
    if (type === 'abnormal_remark') return styles.abnormal;
    if (type === 'review_submit' || type === 'review_remark' || type === 'review_status_change') return styles.review;
    if (type === 'review_completed' || type === 'system_notice') return styles.system;
    return '';
  };

  const renderTraceTimeline = () => {
    if (!order.traceRecords || order.traceRecords.length === 0) return null;
    
    const sortedRecords = [...order.traceRecords].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );

    return (
      <View className={styles.traceSection}>
        <View className={styles.traceTitle}>
          <View className={styles.titleIcon} style={{ display: 'none' }} />
          <Text>📋 签收追溯</Text>
          <Text style={{ fontSize: '24rpx', color: '#86909c', marginLeft: 'auto' }}>
            共{sortedRecords.length}条记录
          </Text>
        </View>
        <View className={styles.timeline}>
          {sortedRecords.map(record => {
            const isExpanded = expandedTraceId === record.id;
            const relatedAbnormals = order.abnormalPeriods.filter(
              ap => record.relatedAbnormalIds?.includes(ap.id)
            );
            
            return (
              <View
                key={record.id}
                className={styles.timelineItem}
                onClick={() => setExpandedTraceId(isExpanded ? null : record.id)}
              >
                <View className={classnames(
                  styles.timelineDot,
                  getTraceDotClass(record.type)
                )} />
                <View className={styles.timelineLine} />
                <View className={styles.timelineContent}>
                  <View className={styles.timelineHeader}>
                    <Text className={styles.timelineTitleText}>
                      {record.title}
                      {record.result && (
                        <Text className={classnames(styles.timelineBadge, styles[record.result])}>
                          {record.result === 'normal' ? '正常' : record.result === 'deduct' ? '扣损' : '拒收'}
                        </Text>
                      )}
                      {record.reviewStatus && record.reviewStatusText && (
                        <Text className={classnames(styles.timelineBadge, styles[record.reviewStatus])}>
                          {record.reviewStatusText}
                        </Text>
                      )}
                    </Text>
                    <Text className={styles.timelineTime}>{formatDate(record.time)}</Text>
                  </View>
                  <View className={styles.timelineDesc}>
                    <Text>{record.description}</Text>
                  </View>
                  <View className={styles.timelineOperator}>
                    <Text>{record.operator} · {record.operatorRole}</Text>
                  </View>
                  
                  {isExpanded && (
                    <View className={styles.traceDetail}>
                      {record.remark && (
                        <View className={styles.traceDetailItem}>
                          <Text className={styles.label}>备注：</Text>
                          <Text>{record.remark}</Text>
                        </View>
                      )}
                      {relatedAbnormals.length > 0 && (
                        <View className={styles.traceDetailItem}>
                          <Text className={styles.label}>关联异常：</Text>
                          <View className={styles.traceAbnormalTags}>
                            {relatedAbnormals.map(ab => (
                              <View key={ab.id} className={styles.traceAbnormalTag}>
                                <Text>{ab.description}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.content}>
        <TempDisplay
          currentTemp={order.currentTemp}
          targetTempMin={order.targetTempMin}
          targetTempMax={order.targetTempMax}
          coolerMode={order.coolerMode}
          tempStatus={order.tempStatus}
          estimatedArrival={order.estimatedArrival}
          lastDoorOpenTime={order.lastDoorOpenTime}
        />

        {order.tempStatus === 'warning' && renderWarningCard()}

        {order.isAbnormal && order.handlingProgress && (
          <>
            <View className={styles.abnormalBanner}>
              <Text className={styles.abnormalIcon}>⚠️</Text>
              <Text className={styles.abnormalText}>{order.abnormalDesc}</Text>
            </View>
            <ProgressTimeline steps={order.handlingProgress} />
          </>
        )}

        {renderReviewBtn()}

        {renderConclusion()}

        {renderTraceTimeline()}

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.titleIcon} />
            <Text>运输进度</Text>
          </View>
          <View className={styles.routeInfo}>
            <View className={styles.routePoint}>
              <View className={styles.pointLabel}>发货地</View>
              <View className={styles.pointName}>{order.origin}</View>
            </View>
            <View className={styles.routeLine}>
              <View className={styles.progressBar}>
                <View
                  className={styles.progressFill}
                  style={{ width: `${order.progressPercent}%` }}
                />
              </View>
              <View className={styles.distanceText}>{order.distance}</View>
            </View>
            <View className={styles.routePoint}>
              <View className={styles.pointLabel}>收货地</View>
              <View className={styles.pointName}>{order.destination}</View>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.titleIcon} />
            <Text>订单信息</Text>
          </View>
          <View className={styles.infoGrid}>
            <View className={styles.infoItem}>
              <View className={styles.label}>订单编号</View>
              <View className={styles.value}>{order.orderNo}</View>
            </View>
            <View className={styles.infoItem}>
              <View className={styles.label}>货物名称</View>
              <View className={styles.value}>{order.cargoName}</View>
            </View>
            <View className={styles.infoItem}>
              <View className={styles.label}>货物类型</View>
              <View className={styles.value}>{order.cargoType}</View>
            </View>
            <View className={styles.infoItem}>
              <View className={styles.label}>目标温区</View>
              <View className={styles.value}>{order.targetTempMin}℃ ~ {order.targetTempMax}℃</View>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.titleIcon} />
            <Text>司机信息</Text>
          </View>
          <View className={styles.contactSection}>
            <View className={styles.driverInfo}>
              <View className={styles.driverAvatar}>
                <Text>🚚</Text>
              </View>
              <View className={styles.driverText}>
                <View className={styles.driverName}>{order.driverName}</View>
                <View className={styles.plateNumber}>{order.plateNumber}</View>
              </View>
            </View>
            <View className={styles.contactBtn} onClick={handleCallDriver}>
              <Text>📞</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.titleIcon} />
            <Text>运输记录</Text>
          </View>
          <View className={styles.tabContainer}>
            <View
              className={classnames(styles.tabItem, recordTab === 'switch' && styles.active)}
              onClick={() => setRecordTab('switch')}
            >
              <Text>油电切换 ({switchNodes.length})</Text>
            </View>
            <View
              className={classnames(styles.tabItem, recordTab === 'door' && styles.active)}
              onClick={() => setRecordTab('door')}
            >
              <Text>开关门 ({doorNodes.length})</Text>
            </View>
          </View>
          {currentRecords.length > 0 ? (
            currentRecords.slice().reverse().map((node, index) => (
              <View key={index} className={styles.doorRecord}>
                <View>
                  <View className={styles.doorDesc}>{node.description}</View>
                  <View className={styles.doorTime}>{formatDate(node.time)}</View>
                </View>
                <View
                  className={classnames(
                    styles.doorType,
                    node.type === 'door_open' && styles.open,
                    node.type === 'door_close' && styles.close,
                    (node.type === 'oil_to_plug' || node.type === 'plug_to_oil') && styles.switch
                  )}
                >
                  {node.type === 'door_open' && '开门'}
                  {node.type === 'door_close' && '关门'}
                  {node.type === 'oil_to_plug' && '插电'}
                  {node.type === 'plug_to_oil' && '油机'}
                </View>
              </View>
            ))
          ) : (
            <View className={styles.emptyState}>
              <Text>暂无记录</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.footerBar}>
        {showReceiptBtn ? (
          <>
            <View className={classnames(styles.btn, styles.btnOutline)}>
              <Text>联系客服</Text>
            </View>
            <View className={classnames(styles.btn, styles.btnPrimary)} onClick={goToReceipt}>
              <Text>查看签收</Text>
            </View>
          </>
        ) : (
          <>
            <View className={classnames(styles.btn, styles.btnOutline)}>
              <Text>联系客服</Text>
            </View>
            <View className={classnames(styles.btn, styles.btnPrimary)} onClick={goToReceipt}>
              <Text>查看温度曲线</Text>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
};

export default OrderDetailPage;
