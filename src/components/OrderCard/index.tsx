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
    if (order.status === 'reviewing') {
      return '复核中';
    }
    if (order.status === 'completed') {
      return order.acceptanceConclusion?.resultText || '已签收';
    }
    if (order.status === 'loading') {
      return '待发车';
    }
    return getEtaText(order.estimatedArrival);
  };

  const getStatusBadgeText = () => {
    if (order.status === 'completed' && order.acceptanceConclusion) {
      return order.acceptanceConclusion.resultText;
    }
    if (order.status === 'reviewing') {
      return '复核中';
    }
    return order.coolerModeText;
  };

  const getStatusBadgeType = () => {
    if (order.status === 'completed' && order.acceptanceConclusion) {
      return order.acceptanceConclusion.result || 'normal';
    }
    if (order.status === 'reviewing') {
      return 'danger';
    }
    return statusType;
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.headerLeft}>
          <Text className={styles.orderNo}>{order.orderNo}</Text>
          <View className={styles.tagRow}>
            {order.hasRemark && (
              <View className={classnames(styles.smallTag, styles.remark)}>
                <Text>有备注</Text>
              </View>
            )}
            {order.hasReview && order.status === 'reviewing' && (
              <View className={classnames(styles.smallTag, styles.review)}>
                <Text>复核中</Text>
              </View>
            )}
            {order.acceptanceConclusion?.result === 'deduct' && !order.hasReview && (
              <View className={classnames(styles.smallTag, styles.deduct)}>
                <Text>扣损</Text>
              </View>
            )}
            {order.acceptanceConclusion?.result === 'normal' && !order.hasReview && (
              <View className={classnames(styles.smallTag, styles.normal)}>
                <Text>正常签收</Text>
              </View>
            )}
          </View>
        </View>
        <View className={classnames(styles.statusBadge, styles[getStatusBadgeType()])}>
          {getStatusBadgeText()}
        </View>
      </View>

      <View className={styles.cargoInfo}>
        <Text className={styles.cargoName}>{order.cargoName}</Text>
        <Text className={styles.cargoType}>{order.cargoType} · {order.plateNumber}</Text>
      </View>

      {order.acceptanceConclusion && (
        <View
          className={classnames(
            styles.conclusionBadge,
            styles[order.acceptanceConclusion.result || 'normal']
          )}
        >
          <Text>{order.acceptanceConclusion.resultText}</Text>
        </View>
      )}

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
