import React, { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';

import { getStaggerDelay } from '@/features/theme/theme-reveal';

export interface FadeInViewProps {
  children: ReactNode;
  /** Posición en una lista; escalona la entrada de cada elemento. */
  index?: number;
  /** Desplazamiento vertical inicial en dp. */
  distance?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/** Entrada suave (fundido + deslizamiento hacia arriba) al montarse. */
export function FadeInView({ children, index = 0, distance = 14, duration = 320, style }: FadeInViewProps) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay: getStaggerDelay(index),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, index, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }),
            },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
}
