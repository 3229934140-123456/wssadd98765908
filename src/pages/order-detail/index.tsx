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

const OrderDetailPage: React.FC = () => {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);

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

        {order.isAbnormal && order.handlingProgress && (
          <>
            <View className={styles.abnormalBanner}>
              <Text className={styles.abnormalIcon}>⚠️</Text>
              <Text className={styles.abnormalText}>{order.abnormalDesc}</Text>
            </View>
            <ProgressTimeline steps={order.handlingProgress} />
          </>
        )}

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
            <Text>开关门记录</Text>
          </View>
          {order.switchNodes.length > 0 ? (
            order.switchNodes.slice().reverse().map((node, index) => (
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
                  {(node.type === 'oil_to_plug' || node.type === 'plug_to_oil') && '切换'}
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
