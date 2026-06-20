import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { CoolerMode, TempStatus } from '@/types';
import { getCoolerModeText, formatTime } from '@/utils';

interface TempDisplayProps {
  currentTemp: number;
  targetTempMin: number;
  targetTempMax: number;
  coolerMode: CoolerMode;
  tempStatus: TempStatus;
  estimatedArrival?: string;
  lastDoorOpenTime?: string;
}

const TempDisplay: React.FC<TempDisplayProps> = ({
  currentTemp,
  targetTempMin,
  targetTempMax,
  coolerMode,
  tempStatus,
  estimatedArrival,
  lastDoorOpenTime
}) => {
  const formatEta = (dateStr?: string) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatLastDoor = (dateStr?: string) => {
    if (!dateStr) return '--';
    const now = new Date().getTime();
    const target = new Date(dateStr).getTime();
    const diff = Math.floor((now - target) / 1000 / 60);
    if (diff < 1) return '刚刚';
    if (diff < 60) return `${diff}分钟前`;
    if (diff < 1440) return `${Math.floor(diff / 60)}小时前`;
    return `${Math.floor(diff / 1440)}天前`;
  };

  return (
    <View className={styles.container}>
      <View className={styles.bgPattern} />
      <View className={styles.bgPattern2} />
      
      <View className={styles.header}>
        <Text className={styles.title}>当前温度</Text>
        <View className={styles.modeBadge}>
          <View className={classnames(styles.dot, styles[tempStatus])} />
          <Text>{getCoolerModeText(coolerMode)}</Text>
        </View>
      </View>

      <View className={styles.tempMain}>
        <Text className={styles.tempValue}>{currentTemp}</Text>
        <Text className={styles.tempUnit}>℃</Text>
      </View>

      <View className={styles.targetRange}>
        目标温区：{targetTempMin}℃ ~ {targetTempMax}℃
      </View>

      <View className={styles.footer}>
        <View className={styles.infoItem}>
          <View className={styles.infoLabel}>预计到达</View>
          <View className={styles.infoValue}>{formatEta(estimatedArrival)}</View>
        </View>
        <View className={styles.infoItem}>
          <View className={styles.infoLabel}>上次开门</View>
          <View className={styles.infoValue}>{formatLastDoor(lastDoorOpenTime)}</View>
        </View>
      </View>
    </View>
  );
};

export default TempDisplay;
