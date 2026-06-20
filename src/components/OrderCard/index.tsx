import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Order } from '@/types';
import { getEtaText, getTimeDiffText } from '@/utils';

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onClick }) => {
  const statusType = order.isAbnormal ? 'danger' : order.tempStatus;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/order-detail/index?id=${order.id}`
      });
    }
  };

  const renderEta = () => {
    if (order.status === 'completed') {
      return '已送达';
    }
    if (order.status === 'loading') {
      return '待发车';
    }
    return getEtaText(order.estimatedArrival);
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <Text className={styles.orderNo}>{order.orderNo}</Text>
        <View className={classnames(styles.statusBadge, styles[statusType])}>
          {order.coolerModeText}
        </View>
      </View>

      <View className={styles.cargoInfo}>
        <Text className={styles.cargoName}>{order.cargoName}</Text>
        <Text className={styles.cargoType}>{order.cargoType} · {order.plateNumber}</Text>
      </View>

      <View className={styles.route}>
        <Text className={styles.origin}>{order.origin}</Text>
        <Text className={styles.arrow}>→</Text>
        <Text className={styles.destination}>{order.destination}</Text>
      </View>

      <View className={styles.footer}>
        <View className={styles.tempInfo}>
          <Text className={classnames(styles.tempValue, styles[order.tempStatus])}>
            {order.currentTemp}
          </Text>
          <Text className={styles.tempUnit}>℃</Text>
        </View>
        <View className={styles.eta}>
          <Text>{renderEta()}</Text>
        </View>
      </View>
    </View>
  );
};

export default OrderCard;
