import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TempDisplay from '@/components/TempDisplay';
import ProgressTimeline from '@/components/ProgressTimeline';
import { getOrderById } from '@/data/orders';
import { Order } from '@/types';
import { formatDate, getEtaText, getTimeDiffText } from '@/utils';

type RecordTabType = 'switch' | 'door';

const OrderDetailPage: React.FC = () => {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [recordTab, setRecordTab] = useState<RecordTabType>('switch');

  useEffect(() => {
    const id = router.params.id;
    if (id) {
      const orderData = getOrderById(id as string);
      if (orderData) {
        setOrder(orderData);
      } else {
        Taro.showToast({
          title: '订单不存在',
          icon: 'none'
        });
      }
    }
  }, [router.params.id]);

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

  const goToReceipt = () => {
    if (order) {
      Taro.navigateTo({
        url: `/pages/receipt/index?id=${order.id}`
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

  const showReceiptBtn = order.status === 'completed' || order.status === 'arrived';
  
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
        ? Math.abs(order.currentTemp - order.targetTempMax).toFixed(1)
        : Math.abs(order.targetTempMin - order.currentTemp).toFixed(1),
      currentAction: '系统已自动加强制冷',
      estimatedRecovery: '预计5分钟内恢复正常'
    };

    return (
      <View className={styles.warningCard}>
        <View className={styles.warningHeader}>
          <Text className={styles.warningIcon}>⚠️</Text>
          <Text className={styles.warningTitle}>温度接近临界值</Text>
        </View>
        <View className={styles.warningBody}>
          <View className={styles.warningItem}>
            <Text className={styles.warningLabel}>距离上限</Text>
            <Text className={styles.warningValue}>
              <Text className={styles.highlight}>{order.targetTempMax - order.currentTemp}℃</Text>
            </Text>
          </View>
          <View className={styles.warningItem}>
            <Text className={styles.warningLabel}>距离下限</Text>
            <Text className={styles.warningValue}>
              <Text className={styles.highlight}>{order.currentTemp - order.targetTempMin}℃</Text>
            </Text>
          </View>
          <View className={styles.warningItem}>
            <Text className={styles.warningLabel}>当前动作</Text>
            <Text className={styles.warningValue}>{warningInfo.currentAction}</Text>
          </View>
          <View className={styles.warningItem}>
            <Text className={styles.warningLabel}>预计恢复</Text>
            <Text className={styles.warningValue}>{warningInfo.estimatedRecovery}</Text>
          </View>
        </View>
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
          <Text className={styles.conclusionValue}>{conclusion.reason}</Text>
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

        {renderConclusion()}

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
            <View style={{ textAlign: 'center', padding: '32rpx 0', color: '#86909c' }}>
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
