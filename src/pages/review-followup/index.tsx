import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Textarea } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { getOrderById, addReviewRecord, refreshOrderData } from '@/data/orders';
import { Order, ReviewRecord } from '@/types';
import { formatDate } from '@/utils';

const ReviewFollowupPage: React.FC = () => {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [remark, setRemark] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

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
    } else {
      Taro.showToast({
        title: '订单不存在',
        icon: 'none'
      });
    }
  };

  const handleCallHandler = () => {
    if (order?.reviewInfo?.currentHandler?.phone) {
      Taro.makePhoneCall({
        phoneNumber: order.reviewInfo.currentHandler.phone.replace(/\*/g, '0')
      }).catch(() => {
        Taro.showToast({
          title: '演示号码无法拨打',
          icon: 'none'
        });
      });
    }
  };

  const handleSubmitRemark = () => {
    if (!order || !order.reviewInfo) return;
    
    if (!remark.trim()) {
      Taro.showToast({ title: '请输入备注内容', icon: 'none' });
      return;
    }

    setSubmitting(true);
    
    Taro.showModal({
      title: '提交备注',
      content: '确认提交该备注？提交后将作为复核记录保存。',
      confirmText: '确认',
      success: res => {
        if (res.confirm) {
          addReviewRecord(order.id, remark.trim());
          const freshOrder = refreshOrderData(order.id);
          if (freshOrder) {
            setOrder(freshOrder);
          }
          setRemark('');
          Taro.showToast({ title: '备注已提交', icon: 'success' });
        }
        setSubmitting(false);
      },
      fail: () => {
        setSubmitting(false);
      }
    });
  };

  const getTimelineDotClass = (type: string) => {
    if (type === 'system_notice') return styles.system;
    if (type === 'driver_confirm') return styles.driver;
    if (type === 'dispatch_action') return styles.dispatch;
    if (type === 'owner_remark') return styles.owner;
    return '';
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'pending' || status === 'processing') return styles.warning;
    if (status === 'rejected') return styles.danger;
    return '';
  };

  if (!order || !order.reviewInfo) {
    return (
      <View className={styles.page}>
        <View style={{ textAlign: 'center', padding: '200rpx 0' }}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  const reviewInfo = order.reviewInfo;
  const relatedAbnormals = order.abnormalPeriods.filter(
    ap => reviewInfo.relatedAbnormalIds.includes(ap.id)
  );

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.content}>
        <View className={styles.statusHeader}>
          <View className={styles.statusTitle}>复核状态</View>
          <View className={styles.statusMain}>
            <View className={styles.statusLeft}>
              <View className={styles.statusIcon}>
                <Text>🔍</Text>
              </View>
              <View className={styles.statusText}>
                <View className={styles.statusValue}>{reviewInfo.statusText}</View>
                <View className={styles.reviewId}>复核编号：{reviewInfo.reviewId}</View>
              </View>
            </View>
            <View className={styles.statusTime}>
              <Text>{formatDate(reviewInfo.submitTime)}</Text>
            </View>
          </View>
        </View>

        <View className={styles.orderInfo}>
          <View className={styles.orderIcon}>
            <Text>📦</Text>
          </View>
          <View className={styles.orderDetail}>
            <View className={styles.orderNo}>{order.orderNo}</View>
            <View className={styles.cargoName}>{order.cargoName}</View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.titleIcon} />
            <Text>当前处理人</Text>
          </View>
          <View className={styles.handlerSection}>
            <View className={styles.handlerAvatar}>
              <Text>{reviewInfo.currentHandler.name.charAt(0)}</Text>
            </View>
            <View className={styles.handlerInfo}>
              <View className={styles.handlerName}>{reviewInfo.currentHandler.name}</View>
              <View className={styles.handlerRole}>{reviewInfo.currentHandler.role}</View>
            </View>
            <View className={styles.handlerPhone} onClick={handleCallHandler}>
              <Text>📞</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.titleIcon} />
            <Text>复核申请信息</Text>
          </View>
          <View className={styles.infoList}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>拒收原因</Text>
              <Text className={styles.infoValue}>{reviewInfo.acceptanceReason}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>货主备注</Text>
              <Text className={styles.infoValue}>{reviewInfo.ownerRemark}</Text>
            </View>
          </View>
        </View>

        {relatedAbnormals.length > 0 && (
          <View className={styles.section}>
            <View className={styles.sectionTitle}>
              <View className={styles.titleIcon} />
              <Text>关联异常时段</Text>
              <View className={classnames(styles.badge, styles.danger)}>
                <Text>{relatedAbnormals.length}个</Text>
              </View>
            </View>
            <View className={styles.abnormalList}>
              {relatedAbnormals.map(ap => (
                <View key={ap.id} className={styles.abnormalItem}>
                  <View className={styles.abnormalHeader}>
                    <Text className={styles.abnormalName}>{ap.description}</Text>
                    <View className={styles.abnormalTemp}>
                      <Text>{ap.minTemp}℃ ~ {ap.maxTemp}℃</Text>
                    </View>
                  </View>
                  <View className={styles.abnormalTime}>
                    {formatDate(ap.startTime)} - {formatDate(ap.endTime)}
                  </View>
                  {ap.remark && (
                    <View className={styles.abnormalRemark}>
                      <Text>{ap.remark}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.titleIcon} />
            <Text>处理记录</Text>
            <View className={classnames(styles.badge, getStatusBadgeClass(reviewInfo.status))}>
              <Text>{reviewInfo.records.length}条</Text>
            </View>
          </View>
          {reviewInfo.records.length > 0 ? (
            <View className={styles.timeline}>
              {reviewInfo.records.slice().reverse().map((record: ReviewRecord) => (
                <View key={record.id} className={styles.timelineItem}>
                  <View className={classnames(
                    styles.timelineDot,
                    getTimelineDotClass(record.type)
                  )} />
                  <View className={styles.timelineLine} />
                  <View className={styles.timelineContent}>
                    <View className={styles.timelineHeader}>
                      <Text className={styles.timelineActor}>
                        {record.actor} · {record.role}
                      </Text>
                      <Text className={styles.timelineTime}>
                        {formatDate(record.time)}
                      </Text>
                    </View>
                    <View className={styles.timelineBody}>
                      <Text>{record.content}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.emptyState}>
              <Text>暂无处理记录</Text>
            </View>
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.titleIcon} />
            <Text>追加沟通备注</Text>
          </View>
          <View className={styles.inputSection}>
            <Textarea
              className={styles.textarea}
              placeholder="请输入需要补充的信息，将作为复核记录保存..."
              value={remark}
              onInput={e => setRemark(e.detail.value)}
              maxlength={300}
              disabled={submitting}
            />
            <View className={styles.charCount}>
              <Text>{remark.length}/300</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.footerBar}>
        <View className={classnames(styles.btn, styles.btnOutline)} onClick={() => Taro.navigateBack()}>
          <Text>返回</Text>
        </View>
        <View 
          className={classnames(styles.btn, styles.btnPrimary)} 
          onClick={handleSubmitRemark}
          style={{ opacity: submitting ? 0.6 : 1 }}
        >
          <Text>{submitting ? '提交中...' : '提交备注'}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default ReviewFollowupPage;
