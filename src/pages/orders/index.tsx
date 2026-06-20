import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import OrderCard from '@/components/OrderCard';
import { getInTransitOrders, getHistoryOrders } from '@/data/orders';
import { Order } from '@/types';

type TabType = 'inTransit' | 'history';

const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('inTransit');

  const inTransitOrders = useMemo(() => getInTransitOrders(), []);
  const historyOrders = useMemo(() => getHistoryOrders(), []);

  const abnormalCount = useMemo(() => {
    return inTransitOrders.filter(o => o.isAbnormal).length;
  }, [inTransitOrders]);

  const currentList = activeTab === 'inTransit' ? inTransitOrders : historyOrders;

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const onPullDownRefresh = () => {
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  };

  return (
    <ScrollView
      scrollY
      className={styles.page}
      onPullDownRefresh={onPullDownRefresh}
      refresherEnabled
    >
      <View className={styles.header}>
        <Text className={styles.title}>冷链在途监督</Text>
        <Text className={styles.subtitle}>实时监控您的货物温度</Text>
        
        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <View className={styles.statNum}>{inTransitOrders.length}</View>
            <View className={styles.statLabel}>在途订单</View>
          </View>
          <View className={styles.statCard}>
            <View className={styles.statNum}>{abnormalCount}</View>
            <View className={styles.statLabel}>异常提醒</View>
          </View>
          <View className={styles.statCard}>
            <View className={styles.statNum}>{historyOrders.length}</View>
            <View className={styles.statLabel}>历史订单</View>
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        <View
          className={classnames(styles.tabItem, activeTab === 'inTransit' && styles.active)}
          onClick={() => handleTabChange('inTransit')}
        >
          在途订单
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'history' && styles.active)}
          onClick={() => handleTabChange('history')}
        >
          历史订单
        </View>
      </View>

      <View className={styles.listContainer}>
        {currentList.length > 0 ? (
          currentList.map((order: Order) => (
            <OrderCard key={order.id} order={order} />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyText}>暂无订单</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default OrdersPage;
