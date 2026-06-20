import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TempChart from '@/components/TempChart';
import { getOrderById, saveAbnormalRemark, saveAcceptanceConclusion } from '@/data/orders';
import { Order, AcceptanceResult, AcceptanceConclusion } from '@/types';
import { formatDate, formatTime } from '@/utils';

const ReceiptPage: React.FC = () => {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedResult, setSelectedResult] = useState<AcceptanceResult>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [selectedAbnormals, setSelectedAbnormals] = useState<string[]>([]);
  const [remarkInput, setRemarkInput] = useState<{ [key: string]: string }>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const id = router.params.id;
    if (id) {
      const orderData = getOrderById(id as string);
      if (orderData) {
        setOrder(orderData);
        if (orderData.abnormalPeriods) {
          const initialRemarks: { [key: string]: string } = {};
          orderData.abnormalPeriods.forEach(ap => {
            if (ap.remark) {
              initialRemarks[ap.id] = ap.remark;
            }
          });
          setRemarkInput(initialRemarks);
        }
      } else {
        Taro.showToast({
          title: '订单不存在',
          icon: 'none'
        });
      }
    }
  }, [router.params.id]);

  const resultOptions = [
    { value: 'normal' as AcceptanceResult, name: '正常验收', desc: '货物完好，温度合格，正常签收', color: 'success' },
    { value: 'deduct' as AcceptanceResult, name: '扣损验收', desc: '存在轻微异常，扣除部分货款后签收', color: 'warning' },
    { value: 'reject' as AcceptanceResult, name: '拒收复核', desc: '异常严重，申请复核后拒收', color: 'error' }
  ];

  const reasonOptions = useMemo(() => {
    if (selectedResult === 'normal') {
      return ['全程温度稳定', '货物完好无损', '司机配合良好', '单据齐全'];
    }
    if (selectedResult === 'deduct') {
      return ['温度轻微超标', '少量包装破损', '部分货物变软', '延迟送达', '其他'];
    }
    if (selectedResult === 'reject') {
      return ['温度严重超标', '大量货物变质', '包装严重破损', '货损严重', '其他'];
    }
    return [];
  }, [selectedResult]);

  const tempStats = useMemo(() => {
    if (!order) return { avg: '0', max: '0', min: '0' };
    const temps = order.tempHistory.map(p => p.temperature);
    return {
      avg: (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1),
      max: Math.max(...temps).toFixed(1),
      min: Math.min(...temps).toFixed(1)
    };
  }, [order]);

  const switchNodes = useMemo(() => {
    return order?.switchNodes.filter(
      n => n.type === 'oil_to_plug' || n.type === 'plug_to_oil'
    ) || [];
  }, [order]);

  const doorNodes = useMemo(() => {
    return order?.switchNodes.filter(
      n => n.type === 'door_open' || n.type === 'door_close'
    ) || [];
  }, [order]);

  const handleAddRemark = (id: string) => {
    setEditingId(id);
  };

  const handleSaveRemark = (id: string) => {
    if (!order) return;
    const text = remarkInput[id] || '';
    saveAbnormalRemark(order.id, id, text);
    setOrder(getOrderById(order.id) || null);
    setEditingId(null);
    Taro.showToast({ title: '备注已保存', icon: 'success' });
  };

  const handleCancelRemark = () => {
    setEditingId(null);
  };

  const toggleAbnormal = (id: string) => {
    setSelectedAbnormals(prev => {
      if (prev.includes(id)) {
        return prev.filter(a => a !== id);
      }
      return [...prev, id];
    });
  };

  const handleSubmit = () => {
    if (!order) return;
    
    if (!selectedResult) {
      Taro.showToast({ title: '请选择验收结果', icon: 'none' });
      return;
    }
    if (!selectedReason) {
      Taro.showToast({ title: '请选择验收原因', icon: 'none' });
      return;
    }

    const resultText = resultOptions.find(r => r.value === selectedResult)?.name || '';
    
    const conclusion: AcceptanceConclusion = {
      result: selectedResult,
      resultText,
      reason: selectedReason,
      remark,
      relatedAbnormalIds: selectedAbnormals,
      submitTime: new Date().toISOString()
    };

    const actionText = selectedResult === 'normal' ? '确认签收' : 
                       selectedResult === 'deduct' ? '确认扣损' : '申请复核';

    Taro.showModal({
      title: actionText,
      content: `确认${actionText}？此操作将记录验收结论。`,
      confirmText: '确认',
      confirmColor: selectedResult === 'normal' ? '#00b42a' : 
                   selectedResult === 'deduct' ? '#ff7d00' : '#f53f3f',
      success: res => {
        if (res.confirm) {
          saveAcceptanceConclusion(order.id, conclusion);
          setOrder(getOrderById(order.id) || null);
          
          const successText = selectedResult === 'reject' ? '已提交复核申请' : '验收成功';
          Taro.showToast({ title: successText, icon: 'success' });
          
          setTimeout(() => {
            Taro.navigateBack();
          }, 1500);
        }
      }
    });
  };

  const getSelectedResultText = () => {
    if (!selectedResult) return '请选择验收结果';
    return resultOptions.find(r => r.value === selectedResult)?.name || '';
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

  const hasConclusion = !!order.acceptanceConclusion;

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.content}>
        <View className={styles.summaryCard}>
          <View className={styles.summaryTitle}>运输概览 · {order.orderNo}</View>
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
              <View className={styles.value}>{order.abnormalPeriods?.length || 0}</View>
              <View className={styles.label}>异常时段</View>
            </View>
          </View>
        </View>

        {hasConclusion && order.acceptanceConclusion && (
          <View className={styles.existingConclusion}>
            <View className={styles.existingHeader}>
              <Text className={styles.existingTitle}>验收结论</Text>
              <View
                className={classnames(
                  styles.existingBadge,
                  styles[order.acceptanceConclusion.result || 'normal']
                )}
              >
                <Text>{order.acceptanceConclusion.resultText}</Text>
              </View>
            </View>
            <View className={styles.existingItem}>
              <Text className={styles.existingLabel}>验收原因</Text>
              <Text className={styles.existingValue}>{order.acceptanceConclusion.reason}</Text>
            </View>
            {order.acceptanceConclusion.remark && (
              <View className={styles.existingItem}>
                <Text className={styles.existingLabel}>货主备注</Text>
                <Text className={styles.existingValue}>{order.acceptanceConclusion.remark}</Text>
              </View>
            )}
            {order.acceptanceConclusion.relatedAbnormalIds && order.acceptanceConclusion.relatedAbnormalIds.length > 0 && (
              <View className={styles.existingItem}>
                <Text className={styles.existingLabel}>关联异常</Text>
                <View className={styles.existingTags}>
                  {order.acceptanceConclusion.relatedAbnormalIds.map(id => {
                    const abnormal = order.abnormalPeriods?.find(a => a.id === id);
                    return (
                      <View key={id} className={styles.existingTag}>
                        <Text>{abnormal?.description || '异常时段'}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
            <View className={styles.existingItem}>
              <Text className={styles.existingLabel}>提交时间</Text>
              <Text className={styles.existingValue}>{formatDate(order.acceptanceConclusion.submitTime)}</Text>
            </View>
          </View>
        )}

        {!hasConclusion && (
          <View className={styles.decisionSection}>
            <View className={styles.decisionTitle}>
              <View className={styles.decisionIcon}>
                <Text>📋</Text>
              </View>
              <Text>收货决策</Text>
            </View>

            <View className={styles.reasonSection}>
              <View className={styles.sectionLabel}>
                <Text>验收结果</Text>
                <Text className={styles.required}>*</Text>
              </View>
              <View className={styles.resultOptions}>
                {resultOptions.map(option => (
                  <View
                    key={option.value}
                    className={classnames(
                      styles.resultOption,
                      selectedResult === option.value && styles.selected
                    )}
                    onClick={() => {
                      setSelectedResult(option.value);
                      setSelectedReason('');
                    }}
                  >
                    <View className={classnames(
                      styles.radio,
                      selectedResult === option.value && styles.selected
                    )} />
                    <View className={styles.resultInfo}>
                      <Text className={classnames(
                        styles.resultName,
                        styles[option.value || 'normal']
                      )}>
                        {option.name}
                      </Text>
                      <Text className={styles.resultDesc}>{option.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {selectedResult && (
              <View className={styles.reasonSection}>
                <View className={styles.sectionLabel}>
                  <Text>{selectedResult === 'normal' ? '验收原因' : '异常原因'}</Text>
                  <Text className={styles.required}>*</Text>
                </View>
                <View className={styles.reasonOptions}>
                  {reasonOptions.map(reason => (
                    <View
                      key={reason}
                      className={classnames(
                        styles.reasonTag,
                        selectedReason === reason && styles.selected
                      )}
                      onClick={() => setSelectedReason(reason)}
                    >
                      <Text>{reason}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {selectedResult && (
              <View className={styles.remarkSection}>
                <View className={styles.sectionLabel}>
                  <Text>补充说明</Text>
                </View>
                <Textarea
                  className={styles.remarkInput}
                  placeholder="请输入详细说明（选填）..."
                  value={remark}
                  onInput={e => setRemark(e.detail.value)}
                  maxlength={500}
                />
                <View className={styles.remarkHint}>
                  <Text>已输入 {remark.length}/500 字</Text>
                </View>
              </View>
            )}

            {selectedResult && selectedResult !== 'normal' && order.abnormalPeriods && order.abnormalPeriods.length > 0 && (
              <View className={styles.abnormalSection}>
                <View className={styles.sectionLabel}>
                  <Text>关联异常时段</Text>
                </View>
                <View className={styles.abnormalList}>
                  {order.abnormalPeriods.map(ap => (
                    <View
                      key={ap.id}
                      className={classnames(
                        styles.abnormalSelectItem,
                        selectedAbnormals.includes(ap.id) && styles.selected
                      )}
                      onClick={() => toggleAbnormal(ap.id)}
                    >
                      <View className={classnames(
                        styles.checkbox,
                        selectedAbnormals.includes(ap.id) && styles.selected
                      )} />
                      <View className={styles.abnormalInfo}>
                        <View className={styles.abnormalHeader}>
                          <Text className={styles.abnormalName}>{ap.description}</Text>
                          <Text className={styles.abnormalTemp}>{ap.minTemp}℃ ~ {ap.maxTemp}℃</Text>
                        </View>
                        <View className={styles.abnormalTime}>
                          {formatDate(ap.startTime)} - {formatDate(ap.endTime)}
                        </View>
                        {ap.remark && (
                          <View className={styles.abnormalRemark}>
                            <Text>已有备注：{ap.remark}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

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
          {switchNodes.length > 0 ? (
            <View className={styles.switchList}>
              {switchNodes.slice().reverse().map((node, index) => (
                <View key={index} className={styles.switchItem}>
                  <View className={classnames(
                    styles.switchIcon,
                    node.type === 'oil_to_plug' ? styles.plug : styles.oil
                  )}>
                    <Text>{node.type === 'oil_to_plug' ? '🔌' : '⛽'}</Text>
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
              <Text>运输事件</Text>
            </View>
          </View>
          {doorNodes.length > 0 ? (
            <View className={styles.eventList}>
              {doorNodes.slice().reverse().map((node, index) => (
                <View key={index} className={styles.eventItem}>
                  <View className={classnames(
                    styles.eventIcon,
                    node.type === 'door_open' ? styles.open : styles.close
                  )}>
                    <Text>{node.type === 'door_open' ? '🚪' : '✅'}</Text>
                  </View>
                  <View className={styles.eventInfo}>
                    <View className={styles.eventDesc}>{node.description}</View>
                    <View className={styles.eventTime}>{formatDate(node.time)}</View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ textAlign: 'center', padding: '32rpx 0', color: '#86909c' }}>
              <Text>暂无运输事件</Text>
            </View>
          )}
        </View>

        {order.abnormalPeriods && order.abnormalPeriods.length > 0 && (
          <View className={styles.section}>
            <View className={styles.sectionTitle}>
              <View className={styles.titleLeft}>
                <View className={styles.titleIcon} />
                <Text>异常时段详情</Text>
              </View>
            </View>
            <View className={styles.abnormalList}>
              {order.abnormalPeriods.map(ap => (
                <View key={ap.id} className={styles.abnormalSelectItem}>
                  <View className={styles.abnormalInfo}>
                    <View className={styles.abnormalHeader}>
                      <Text className={styles.abnormalName}>{ap.description}</Text>
                      <Text className={styles.abnormalTemp}>{ap.minTemp}℃ ~ {ap.maxTemp}℃</Text>
                    </View>
                    <View className={styles.abnormalTime}>
                      {formatDate(ap.startTime)} - {formatDate(ap.endTime)}
                    </View>
                    
                    <View className={styles.remarkSection} style={{ marginTop: '16rpx', marginBottom: 0 }}>
                      <View className={styles.sectionLabel} style={{ marginBottom: '8rpx' }}>
                        <Text>货主备注</Text>
                        {!editingId && !ap.remark && (
                          <Text
                            className={styles.reasonTag}
                            style={{ padding: '4rpx 12rpx', fontSize: '20rpx', marginLeft: 'auto' }}
                            onClick={() => handleAddRemark(ap.id)}
                          >
                            + 添加
                          </Text>
                        )}
                      </View>

                      {editingId === ap.id ? (
                        <>
                          <Textarea
                            className={styles.remarkInput}
                            placeholder="请输入备注信息..."
                            value={remarkInput[ap.id] || ''}
                            onInput={e => setRemarkInput(prev => ({
                              ...prev,
                              [ap.id]: e.detail.value
                            }))}
                            maxlength={200}
                          />
                          <View className={styles.footerSummary} style={{ marginTop: '12rpx', justifyContent: 'flex-end', gap: '16rpx' }}>
                            <View
                              className={styles.reasonTag}
                              style={{ padding: '8rpx 24rpx' }}
                              onClick={handleCancelRemark}
                            >
                              <Text>取消</Text>
                            </View>
                            <View
                              className={styles.reasonTag}
                              style={{ padding: '8rpx 24rpx', background: '#0e8aff', color: '#fff', borderColor: '#0e8aff' }}
                              onClick={() => handleSaveRemark(ap.id)}
                            >
                              <Text>保存</Text>
                            </View>
                          </View>
                        </>
                      ) : ap.remark ? (
                        <View className={styles.abnormalRemark} onClick={() => handleAddRemark(ap.id)}>
                          <Text>{ap.remark}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {!hasConclusion && (
        <View className={styles.footerBar}>
          <View className={styles.footerSummary}>
            <Text>已选：</Text>
            <Text className={classnames(
              styles.selectedResult,
              selectedResult ? styles[selectedResult] : ''
            )}>
              {getSelectedResultText()}
            </Text>
            {selectedAbnormals.length > 0 && (
              <Text style={{ color: '#86909c' }}>
                关联 {selectedAbnormals.length} 个异常
              </Text>
            )}
          </View>
          <View className={styles.btnRow}>
            <View
              className={classnames(
                styles.btn,
                styles.btnPrimary,
                selectedResult ? styles[selectedResult] : ''
              )}
              onClick={handleSubmit}
            >
              <Text>
                {selectedResult === 'normal' ? '确认签收' : 
                 selectedResult === 'deduct' ? '确认扣损' : 
                 selectedResult === 'reject' ? '申请复核' : '请选择验收结果'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ReceiptPage;
