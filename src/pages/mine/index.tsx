import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const userInfo = {
    name: '王经理',
    company: '杭州鲜丰果品有限公司',
    phone: '138****8888',
    verified: true
  };

  const menuGroups = [
    {
      title: '订单服务',
      items: [
        { icon: '📦', text: '我的订单', path: '/pages/orders/index' },
        { icon: '📝', text: '签收记录', path: '' },
        { icon: '📊', text: '温度报表', path: '' }
      ]
    },
    {
      title: '企业服务',
      items: [
        { icon: '🏢', text: '企业认证', path: '' },
        { icon: '👥', text: '子账号管理', path: '' },
        { icon: '📞', text: '联系客服', path: '' }
      ]
    },
    {
      title: '其他',
      items: [
        { icon: '⚙️', text: '系统设置', path: '' },
        { icon: '❓', text: '帮助中心', path: '' },
        { icon: '📋', text: '关于我们', path: '' }
      ]
    }
  ];

  const handleMenuClick = (path: string) => {
    if (path) {
      Taro.switchTab({
        url: path
      }).catch(() => {
        Taro.navigateTo({ url: path }).catch(() => {
          Taro.showToast({
            title: '功能开发中',
            icon: 'none'
          });
        });
      });
    } else {
      Taro.showToast({
        title: '功能开发中',
        icon: 'none'
      });
    }
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            <Text>👤</Text>
          </View>
          <View className={styles.userText}>
            <View className={styles.userName}>
              <Text>{userInfo.name}</Text>
              {userInfo.verified && (
                <View className={styles.verifiedBadge}>
                  <Text>已认证</Text>
                </View>
              )}
            </View>
            <Text className={styles.companyName}>{userInfo.company}</Text>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <View className={styles.statNum}>12</View>
            <View className={styles.statLabel}>本月订单</View>
          </View>
          <View className={styles.statItem}>
            <View className={styles.statNum}>98%</View>
            <View className={styles.statLabel}>温度合格</View>
          </View>
          <View className={styles.statItem}>
            <View className={styles.statNum}>3</View>
            <View className={styles.statLabel}>待签收</View>
          </View>
        </View>
      </View>

      {menuGroups.map((group, groupIndex) => (
        <React.Fragment key={groupIndex}>
          <View className={styles.sectionTitle}>
            <Text>{group.title}</Text>
          </View>
          <View className={styles.menuList}>
            {group.items.map((item, itemIndex) => (
              <View
                key={itemIndex}
                className={styles.menuItem}
                onClick={() => handleMenuClick(item.path)}
              >
                <View className={styles.menuIcon}>
                  <Text>{item.icon}</Text>
                </View>
                <Text className={styles.menuText}>{item.text}</Text>
                <Text className={styles.menuArrow}>›</Text>
              </View>
            ))}
          </View>
        </React.Fragment>
      ))}

      <View className={styles.aboutSection}>
        <Text className={styles.version}>冷链在途监督 v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

export default MinePage;
