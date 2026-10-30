import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import type { ResolvedScheme } from './theme-preference';

export interface RevealState {
  x: number;
  y: number;
  radius: number;
  target: ResolvedScheme;
  backgroundColor: string;
  id: number;
}

interface Props {
  reveal: RevealState;
  /** El círculo ya cubre la pantalla: es el momento de aplicar el tema nuevo por debajo. */
  onCovered: () => void;
  onDone: () => void;
}

/**
 * Respaldo para iOS/Android (y navegadores sin View Transitions): un círculo del color del tema destino
 * crece desde el botón hasta cubrir la pantalla; entonces se cambia el tema y el círculo se desvanece.
 */
export function ThemeRevealOverlay({ reveal, onCovered, onDone }: Props) {
  const [scale] = useState(() => new Animated.Value(0.001));
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(scale, {
        toValue: 1,
        duration: 520,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    // El tema se aplica justo al terminar de crecer, mientras el círculo aún es opaco.
    const coverTimer = setTimeout(onCovered, 530);
    animation.start(({ finished }) => {
      if (finished) onDone();
    });

    return () => {
      clearTimeout(coverTimer);
      animation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal.id]);

  const diameter = reveal.radius * 2;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.circle,
        {
          width: diameter,
          height: diameter,
          borderRadius: reveal.radius,
          left: reveal.x - reveal.radius,
          top: reveal.y - reveal.radius,
          backgroundColor: reveal.backgroundColor,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
    zIndex: 9999,
  },
});
