import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { TemperaturePoint } from '@/types';
import { formatTime } from '@/utils';

interface TempChartProps {
  data: TemperaturePoint[];
  tempMin: number;
  tempMax: number;
  showLegend?: boolean;
}

const TempChart: React.FC<TempChartProps> = ({
  data,
  tempMin,
  tempMax,
  showLegend = true
}) => {
  const canvasRef = useRef<any>(null);
  const [tooltip, setTooltip] = useState<{ time: string; temp: number } | null>(null);

  useEffect(() => {
    if (data.length > 0) {
      const lastPoint = data[data.length - 1];
      setTooltip({
        time: formatTime(lastPoint.time),
        temp: lastPoint.temperature
      });
    }
  }, [data]);

  useEffect(() => {
    if (data.length === 0) return;

    const query = Taro.createSelectorQuery();
    query.select('#tempChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) {
          drawChartFallback();
          return;
        }
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = Taro.getSystemInfoSync().pixelRatio;
        const width = res[0].width;
        const height = res[0].height;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        
        drawChart(ctx, width, height);
      });
  }, [data, tempMin, tempMax]);

  const drawChart = (ctx: any, width: number, height: number) => {
    if (data.length === 0) return;

    const padding = { top: 20, right: 20, bottom: 20, left: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const allTemps = data.map(d => d.temperature);
    const dataMin = Math.min(...allTemps, tempMin);
    const dataMax = Math.max(...allTemps, tempMax);
    const tempRange = dataMax - dataMin + 4;
    const yMin = dataMin - 2;
    const yMax = dataMax + 2;

    const getY = (temp: number) => {
      return padding.top + chartHeight - ((temp - yMin) / tempRange) * chartHeight;
    };

    const getX = (index: number) => {
      if (data.length === 1) return padding.left + chartWidth / 2;
      return padding.left + (index / (data.length - 1)) * chartWidth;
    };

    // 绘制正常温区背景
    const rangeTop = getY(tempMax);
    const rangeBottom = getY(tempMin);
    ctx.fillStyle = 'rgba(0, 180, 42, 0.08)';
    ctx.fillRect(padding.left, rangeTop, chartWidth, rangeBottom - rangeTop);

    // 绘制温区边界线
    ctx.strokeStyle = 'rgba(0, 180, 42, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, rangeTop);
    ctx.lineTo(padding.left + chartWidth, rangeTop);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(padding.left, rangeBottom);
    ctx.lineTo(padding.left + chartWidth, rangeBottom);
    ctx.stroke();

    // 绘制温度曲线
    ctx.strokeStyle = '#0e8aff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((point, index) => {
      const x = getX(index);
      const y = getY(point.temperature);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // 绘制温度点
    data.forEach((point, index) => {
      const x = getX(index);
      const y = getY(point.temperature);
      const isNormal = point.temperature >= tempMin && point.temperature <= tempMax;
      
      ctx.fillStyle = isNormal ? '#0e8aff' : '#f53f3f';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawChartFallback = () => {
    // Canvas 不可用时的降级方案，通过 state 更新视图
  };

  const renderXLabels = () => {
    if (data.length < 4) return null;
    const step = Math.floor(data.length / 4);
    const labels = [];
    for (let i = 0; i < 4; i++) {
      const index = i * step;
      if (index < data.length) {
        labels.push(
          <Text key={i} className={styles.xLabel}>
            {formatTime(data[index].time)}
          </Text>
        );
      }
    }
    return labels;
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>温度曲线</Text>
        {showLegend && (
          <View className={styles.legend}>
            <View className={styles.legendItem}>
              <View className={`${styles.legendDot} ${styles.temp}`} />
              <Text>实际温度</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={`${styles.legendDot} ${styles.normal}`} />
              <Text>正常区间</Text>
            </View>
          </View>
        )}
      </View>

      <View className={styles.chartArea}>
        {tooltip && (
          <View className={styles.tooltip}>
            {tooltip.time} · {tooltip.temp}℃
          </View>
        )}
        <Canvas
          id="tempChart"
          type="2d"
          ref={canvasRef}
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      <View className={styles.xLabels}>
        {renderXLabels()}
      </View>
    </View>
  );
};

export default TempChart;
