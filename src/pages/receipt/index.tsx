import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Input, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TempChart from '@/components/TempChart';
import { getOrderById } from '@/data/orders';
import { Order, AbnormalPeriod } from '@/types';
import { formatDate } from '@/utils';

const ReceiptPage: React.FC = () => {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [remarkInput, setRemarkInput] = useState<{ [key: string]: string }>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [abnormalPeriods, setAbnormalPeriods] = useState<AbnormalPeriod[]>([]);

  useEffect(() => {
    const id = router.params.id;
    if (id) {
      const orderData = getOrderById(id as string);
      if (orderData) {
        setOrder(orderData);
        setAbnormalPeriods(orderData.abnormalPeriods || []);
      } else {
        Taro.showToast({
          title: '订单不存在',
          icon: 'none'
        });
      }
    }
  }, [router.params.id]);

  const handleAddRemark = (id: string) => {
    setEditingId(id);
    setRemarkInput(prev => ({
      ...prev,
      [id]: abnormalPeriods.find(p => p.id === id)?.remark || ''
    }));
  };

  const handleSaveRemark = (id: string) => {
    const remark = remarkInput[id] || '';
    setAbnormalPeriods(prev =>
      prev.map(p => (p.id === id ? { ...p, remark } : p))
    );
    setEditingId(null);
    Taro.showToast({
      title: '备注已保存',
      icon: 'success'
    });
  };

  const handleCancelRemark = () => {
    setEditingId(null);
  };

  const handleConfirmReceipt = () => {
    Taro.showModal({
      title: '确认签收',
      content: '确认货物完好并正常签收？',
      confirmText: '确认签收',
      confirmColor: '#0e8aff',
      success: res => {
        if (res.confirm) {
          Taro.showToast({
            title: '签收成功',
            icon: 'success'
          });
          setTimeout(() => {
            Taro.navigateBack();
          }, 1500);
        }
      }
    });
  };

  const handleApplyReview = () => {
    Taro.showModal({
      title: '申请复核',
      content: '确认对本次运输温度异常申请复核？',
      confirmText: '申请复核',
      confirmColor: '#f53f3f',
      success: res => {
        if (res.confirm) {
          Taro.showToast({
            title: '已提交复核申请',
            icon: 'success'
          });
        }
      }
    });
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

  const getSwitchIcon = (type: string) => {
    if (type.includes('oil') || type.includes('plug')) {
      return type === 'oil_to_plug' ? '🔌' : '⛽';
    }
    return type === 'door_open' ? '🚪' : '✅';
  };

  const getSwitchClass = (type: string) => {
    if (type.includes('oil') || type.includes('plug')) {
      return type === 'oil_to_plug' ? 'plug' : 'oil';
    }
    return 'door';
  };

  const tempStats = {
    avg: order.tempHistory.length > 0
      ? (order.tempHistory.reduce((sum, p) => sum + p.temperature, 0) / order.tempHistory.length).toFixed(1)
      : '0',
    max: order.tempHistory.length > 0
      ? Math.max(...order.tempHistory.map(p => p.temperature)).toFixed(1)
      : '0',
    min: order.tempHistory.length > 0
      ? Math.min(...order.tempHistory.map(p => p.temperature)).toFixed(1)
      : '0'
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.content}>
        <View className={styles.summaryCard}>
          <View className={styles.summaryTitle}>运输概览</View>
          <View className={styles.summaryStats}>
            <View className={styles.summaryItem}>
              <View className={styles.value}>{tempStats.avg}℃</View>
              <View className={styles.label}>平均温度</View>
            </View>
            <View className={styles.summaryItem}>
              <View className={styles.value}>{order.tempHistory.length}</View>
              <View className={styles.label}>数据点</View>
            </View>
            <View className={styles.summaryItem}>
              <View className={styles.value}>{abnormalPeriods.length}</View>
              <View className={styles.label}>异常时段</View>
            </View>
          </View>
        </View>

        <TempChart
          data={order.tempHistory}
          tempMin={order.targetTempMin}
          tempMax={order.targetTempMax}
        />

        <View className={styles.section}>
          <View className={styles.tempInfo}>
            <View className={classnames(styles.tempInfoItem, styles.min)}>
              <View className={styles.label}>最低温度</View>
              <View className={styles.value}>{tempStats.min}℃</View>
            </View>
            <View className={styles.tempInfoItem}>
              <View className={styles.label}>平均温度</View>
              <View className={styles.value}>{tempStats.avg}℃</View>
            </View>
            <View className={classnames(styles.tempInfoItem, styles.max)}>
              <View className={styles.label}>最高温度</View>
              <View className={styles.value}>{tempStats.max}℃</View>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.titleLeft}>
              <View className={styles.titleIcon} />
              <Text>油电切换节点</Text>
            </View>
          </View>
          {order.switchNodes.length > 0 ? (
            <View className={styles.switchList}>
              {order.switchNodes.map((node, index) => (
                <View key={index} className={styles.switchItem}>
                  <View className={classnames(styles.switchIcon, styles[getSwitchClass(node.type)])}>
                    <Text>{getSwitchIcon(node.type)}</Text>
                  </View>
                  <View className={styles.switchInfo}>
                    <View className={styles.switchDesc}>{node.description}</View>
                    <View className={styles.switchTime}>{formatDate(node.time)}</View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ textAlign: 'center', padding: '32rpx 0', color: '#86909c' }}>
              <Text>暂无切换记录</Text>
            </View>
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.titleLeft}>
              <View className={styles.titleIcon} />
              <Text>异常时段</Text>
            </View>
          </View>
          {abnormalPeriods.length > 0 ? (
            <View className={styles.abnormalList}>
              {abnormalPeriods.map(period => (
                <View key={period.id} className={styles.abnormalItem}>
                  <View className={styles.abnormalHeader}>
                    <Text className={styles.abnormalTitle}>{period.description}</Text>
                    <Text className={styles.abnormalTemp}>
                      {period.minTemp}℃ ~ {period.maxTemp}℃
                    </Text>
                  </View>
                  <View className={styles.abnormalTime}>
                    {formatDate(period.startTime)} - {formatDate(period.endTime)}
                  </View>

                  <View className={styles.remarkSection}>
                    <View className={styles.remarkLabel}>
                      <Text>货主备注</Text>
                      {!editingId && !period.remark && (
                        <Text
                          className={styles.addRemarkBtn}
                          onClick={() => handleAddRemark(period.id)}
                        >
                          + 添加备注
                        </Text>
                      )}
                    </View>

                    {editingId === period.id ? (
                      <>
                        <Textarea
                          className={styles.remarkInput}
                          placeholder="请输入备注信息..."
                          value={remarkInput[period.id] || ''}
                          onInput={e => setRemarkInput(prev => ({
                            ...prev,
                            [period.id]: e.detail.value
                          }))}
                          maxlength={200}
                        />
                        <View className={styles.remarkActions}>
                          <View
                            className={classnames(styles.remarkBtn, styles.cancel)}
                            onClick={handleCancelRemark}
                          >
                            <Text>取消</Text>
                          </View>
                          <View
                            className={classnames(styles.remarkBtn, styles.confirm)}
                            onClick={() => handleSaveRemark(period.id)}
                          >
                            <Text>保存</Text>
                          </View>
                        </View>
                      </>
                    ) : period.remark ? (
                      <View className={styles.remarkText} onClick={() => handleAddRemark(period.id)}>
                        <Text>{period.remark}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ textAlign: 'center', padding: '32rpx 0', color: '#86909c' }}>
              <Text>全程温度正常，无异常时段</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.footerBar}>
        {abnormalPeriods.length > 0 && (
          <View
            className={classnames(styles.btn, styles.btnOutline)}
            onClick={handleApplyReview}
          >
            <Text>申请复核</Text>
          </View>
        )}
        <View
          className={classnames(styles.btn, styles.btnPrimary)}
          onClick={handleConfirmReceipt}
        >
          <Text>确认签收</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default ReceiptPage;
