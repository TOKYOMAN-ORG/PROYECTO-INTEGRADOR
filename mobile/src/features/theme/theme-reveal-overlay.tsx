import React, { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet } from 'react-native';

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
  /** Se invoca cuando la esfera cubre la pantalla para conmutar el tema debajo sin parpadeos */
  onCovered: () => void;
  /** Se invoca al terminar la disolución para desmontar la capa */
  onDone: () => void;
}

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export function ThemeRevealOverlay({ reveal, onCovered, onDone }: Props) {
  const isWeb = Platform.OS === 'web';
  const [scale] = useState(() => new Animated.Value(0.005));
  const [opacity] = useState(() => new Animated.Value(1));
  const [waveScale] = useState(() => new Animated.Value(0.01));
  const [waveOpacity] = useState(() => new Animated.Value(0.95));

  const isDarkTarget = reveal.target === 'dark';

  useEffect(() => {
    scale.setValue(0.005);
    opacity.setValue(1);
    waveScale.setValue(0.01);
    waveOpacity.setValue(0.95);

    const sphereExpand = Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.02,
        duration: 520,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);

    const shockwave = Animated.parallel([
      Animated.timing(waveScale, {
        toValue: 1.08,
        duration: 680,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(waveOpacity, {
        toValue: 0,
        duration: 680,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);

    const animation = Animated.parallel([sphereExpand, shockwave]);

    // A los 400ms la curva cubic-bezier(0.22, 1, 0.36, 1) ya alcanzó >92% del radio total
    const coverTimer = setTimeout(onCovered, 400);
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

  // Estética diferencial para Oscuro -> Claro (halo solar cálido + cristal celeste) vs Claro -> Oscuro (halo cian/índigo)
  const rimBorderColor = isDarkTarget
    ? 'rgba(56, 189, 248, 0.65)'
    : 'rgba(251, 191, 36, 0.85)';
  const shockwaveBorderColor = isDarkTarget
    ? 'rgba(255, 255, 255, 0.55)'
    : 'rgba(14, 165, 233, 0.55)';
  const sphereGlowWeb = isDarkTarget
    ? '0 0 60px 18px rgba(56, 189, 248, 0.45), inset 0 0 40px 10px rgba(99, 102, 241, 0.30)'
    : '0 0 70px 24px rgba(251, 191, 36, 0.50), 0 0 32px 8px rgba(56, 189, 248, 0.35), inset 0 0 45px 12px rgba(255, 255, 255, 0.90)';
  const waveGlowWeb = isDarkTarget
    ? '0 0 42px 12px rgba(56, 189, 248, 0.55), inset 0 0 24px 4px rgba(255, 255, 255, 0.35)'
    : '0 0 48px 14px rgba(251, 191, 36, 0.65), inset 0 0 28px 6px rgba(255, 255, 255, 0.85)';

  const basePositionStyle = {
    position: (isWeb ? 'fixed' : 'absolute') as 'absolute',
    width: diameter,
    height: diameter,
    borderRadius: reveal.radius,
    left: reveal.x - reveal.radius,
    top: reveal.y - reveal.radius,
  };

  return (
    <>
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.sphere,
          basePositionStyle,
          {
            backgroundColor: reveal.backgroundColor,
            borderWidth: 2.5,
            borderColor: rimBorderColor,
            opacity,
            transform: [{ scale }],
          },
          isWeb
            ? ({
                boxShadow: sphereGlowWeb,
                willChange: 'transform, opacity',
              } as any)
            : null,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.shockwave,
          basePositionStyle,
          {
            borderWidth: 2,
            borderColor: shockwaveBorderColor,
            backgroundColor: isDarkTarget
              ? 'rgba(56, 189, 248, 0.06)'
              : 'rgba(255, 255, 255, 0.18)',
            opacity: waveOpacity,
            transform: [{ scale: waveScale }],
          },
          isWeb
            ? ({
                boxShadow: waveGlowWeb,
                backdropFilter: 'blur(8px) saturate(180%)',
                WebkitBackdropFilter: 'blur(8px) saturate(180%)',
                willChange: 'transform, opacity',
              } as any)
            : null,
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sphere: {
    zIndex: 999998,
  },
  shockwave: {
    zIndex: 999999,
  },
});
