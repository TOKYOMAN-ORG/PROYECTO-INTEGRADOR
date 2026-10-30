import React, { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

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
  /** Se invoca a mitad de la expansión para aplicar el nuevo tema debajo del círculo */
  onCovered: () => void;
  /** Se invoca al terminar la animación para desmontar la capa */
  onDone: () => void;
}

const KEYFRAMES_STYLE_ID = 'secureplan-theme-ripple-keyframes';

function ensureWebKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAMES_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = KEYFRAMES_STYLE_ID;
  style.textContent = `
    @keyframes themeRippleExpand {
      0% {
        clip-path: circle(0px at var(--ripple-x) var(--ripple-y));
        opacity: 1;
      }
      75% {
        clip-path: circle(var(--ripple-r) at var(--ripple-x) var(--ripple-y));
        opacity: 1;
      }
      100% {
        clip-path: circle(var(--ripple-r) at var(--ripple-x) var(--ripple-y));
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

export function ThemeRevealOverlay({ reveal, onCovered, onDone }: Props) {
  const isWeb = Platform.OS === 'web';
  const [scale] = useState(() => new Animated.Value(0.001));
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (isWeb) {
      ensureWebKeyframes();
      // En web con CSS clip-path: cambio de tema a los 190ms (círculo ya cubre el área principal)
      const coverTimer = setTimeout(onCovered, 190);
      const doneTimer = setTimeout(onDone, 380);

      return () => {
        clearTimeout(coverTimer);
        clearTimeout(doneTimer);
      };
    }

    // En nativo (iOS / Android) usando Animated
    const animation = Animated.sequence([
      Animated.timing(scale, {
        toValue: 1,
        duration: 320,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    const coverTimer = setTimeout(onCovered, 240);
    animation.start(({ finished }) => {
      if (finished) onDone();
    });

    return () => {
      clearTimeout(coverTimer);
      animation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal.id]);

  if (isWeb) {
    const webStyle: Record<string, string | number> = {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: reveal.backgroundColor,
      zIndex: 999999,
      pointerEvents: 'none',
      '--ripple-x': `${reveal.x}px`,
      '--ripple-y': `${reveal.y}px`,
      '--ripple-r': `${reveal.radius}px`,
      animation: 'themeRippleExpand 380ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
    };

    return (
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={webStyle as any}
      />
    );
  }

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
    zIndex: 999999,
  },
});
