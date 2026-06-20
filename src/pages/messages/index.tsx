import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { messages } from '@/data/messages';
import { Message } from '@/types';
import { getTimeDiffText } from '@/utils';

type TabType = 'all' | 'abnormal' | 'system';

const MessagesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [msgList, setMsgList] = useState<Message[]>(messages);

  const filteredMessages = useMemo(() => {
    if (activeTab === 'all') return msgList;
    if (activeTab === 'abnormal') return msgList.filter(m => m.type === 'abnormal' || m.type === 'door');
    return msgList.filter(m => m.type === 'system' || m.type === 'arrival');
  }, [activeTab, msgList]);

  const unreadCount = useMemo(() => {
    return msgList.filter(m => !m.read).length;
  }, [msgList]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleMessageClick = (msg: Message) => {
    setMsgList(prev => 
      prev.map(m => 
        m.id === msg.id ? { ...m, read: true } : m
      )
    );
    
    Taro.navigateTo({
      url: `/pages/order-detail/index?id=${msg.orderId}`
    });
  };

  const getIconText = (type: Message['type']) => {
    const icons = {
      abnormal: '⚠️',
      door: '🚪',
      arrival: '📦',
      system: '📢'
    };
    return icons[type] || '📢';
  };

  const getLevelClass = (level: Message['level']) => {
    return level;
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>
          消息中心
          {unreadCount > 0 && (
            <Text style={{ color: '#f53f3f', fontSize: '28rpx', marginLeft: '16rpx' }}>
              ({unreadCount}条未读)
            </Text>
          )}
        </Text>
      </View>

      <View className={styles.tabs}>
        <View
          className={classnames(styles.tabItem, activeTab === 'all' && styles.active)}
          onClick={() => handleTabChange('all')}
        >
          全部
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'abnormal' && styles.active)}
          onClick={() => handleTabChange('abnormal')}
        >
          异常提醒
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'system' && styles.active)}
          onClick={() => handleTabChange('system')}
        >
          系统通知
        </View>
      </View>

      <ScrollView scrollY className={styles.list}>
        {filteredMessages.length > 0 ? (
          filteredMessages.map(msg => (
            <View
              key={msg.id}
              className={classnames(styles.messageItem, !msg.read && styles.unread)}
              onClick={() => handleMessageClick(msg)}
            >
              <View className={classnames(styles.iconWrapper, styles[getLevelClass(msg.level)])}>
                <Text className={styles.iconText}>{getIconText(msg.type)}</Text>
              </View>
              <View className={styles.content}>
                <View className={styles.msgHeader}>
                  <Text className={styles.msgTitle}>{msg.title}</Text>
                  {!msg.read && <View className={styles.unreadDot} />}
                  <Text className={styles.msgTime}>{getTimeDiffText(msg.time)}</Text>
                </View>
                <Text className={styles.msgContent}>{msg.content}</Text>
              </View>
            </View>
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>暂无消息</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default MessagesPage;
