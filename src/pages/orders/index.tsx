import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import OrderCard from '@/components/OrderCard';
import { getInTransitOrders, getHistoryOrders } from '@/data/orders';
import { Order } from '@/types';

type TabType = 'inTransit' | 'history';

const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('inTransit');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const loadOrders = () => {
    setRefreshKey(prev => prev + 1);
  };

  useDidShow(() => {
    loadOrders();
  });

  const inTransitOrders = useMemo(() => getInTransitOrders(), [refreshKey]);
  const historyOrders = useMemo(() => getHistoryOrders(), [refreshKey]);

  const abnormalCount = useMemo(() => {
    return inTransitOrders.filter(o => o.isAbnormal).length;
  }, [inTransitOrders]);

  const reviewCount = useMemo(() => {
    return historyOrders.filter(o => o.status === 'reviewing').length;
  }, [historyOrders]);

  const currentList = activeTab === 'inTransit' ? inTransitOrders : historyOrders;

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const onPullDownRefresh = () => {
    loadOrders();
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
            <View className={styles.statNum}>{reviewCount}</View>
            <View className={styles.statLabel}>复核中</View>
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
            <OrderCard key={order.id + '_' + refreshKey} order={order} />
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
