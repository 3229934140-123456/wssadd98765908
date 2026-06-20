import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { ProgressStep } from '@/types';
import { formatTime } from '@/utils';

interface ProgressTimelineProps {
  steps: ProgressStep[];
  title?: string;
}

const ProgressTimeline: React.FC<ProgressTimelineProps> = ({ steps, title = '处理进度' }) => {
  return (
    <View className={styles.container}>
      <View className={styles.title}>
        <View className={styles.titleIcon} />
        <Text>{title}</Text>
      </View>

      <View className={styles.timeline}>
        {steps.map((step, index) => (
          <View key={step.id} className={styles.step}>
            <View className={styles.left}>
              <View
                className={classnames(
                  styles.dot,
                  step.completed && styles.completed,
                  step.current && styles.current,
                  step.current && styles.pulse
                )}
              />
              <View
                className={classnames(
                  styles.line,
                  step.completed && styles.completed
                )}
              />
            </View>
            <View className={styles.right}>
              <Text
                className={classnames(
                  styles.stepTitle,
                  !step.completed && !step.current && styles.disabled
                )}
              >
                {step.title}
              </Text>
              <Text className={styles.stepDesc}>{step.description}</Text>
              {step.time && (
                <Text className={styles.stepTime}>{formatTime(step.time)}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default ProgressTimeline;
