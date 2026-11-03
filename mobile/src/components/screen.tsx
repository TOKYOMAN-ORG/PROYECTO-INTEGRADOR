import type { ReactElement, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { getScreenLayoutConfig } from '@/components/screen-model';
import { useTheme } from '@/hooks/use-theme';
import { useSizeClass } from '@/utils/window-size';

export interface ScreenProps {
  children: ReactNode;
  /** Encabezado fijo colocado sobre el área de contenido / scroll. */
  header?: ReactNode;
  /** Pie fijo anclado al inferior de la pantalla. */
  footer?: ReactNode;
  /** Habilita o deshabilita el scroll interno (por defecto true). */
  scrollable?: boolean;
  /** Control de recarga para ScrollView. */
  refreshControl?: ReactElement<RefreshControlProps>;
  /** Aristas de área segura a aplicar (por defecto todas). */
  edges?: Edge[];
  /** Estilo para el contenedor exterior de la pantalla. */
  style?: StyleProp<ViewStyle>;
  /** Estilo para el contenido interior con ancho máximo. */
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function Screen({
  children,
  header,
  footer,
  scrollable = true,
  refreshControl,
  edges,
  style,
  contentContainerStyle,
}: ScreenProps) {
  const theme = useTheme();
  const sizeConfig = useSizeClass();
  const config = getScreenLayoutConfig(Platform.OS === 'ios');

  const resolvedEdges = edges ?? (config.defaultEdges as Edge[]);

  const innerContent = (
    <View
      style={[
        styles.maxWidthWrapper,
        {
          maxWidth: sizeConfig.maxWidth,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          paddingVertical: config.paddingVertical,
        },
        contentContainerStyle,
      ]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={resolvedEdges}
      style={[styles.container, { backgroundColor: theme.background }, style]}>
      {/* Iluminación ambiental de fondo para refracción de superficies Liquid Glass */}
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.ambientContainer}>
        <View
          style={[
            styles.ambientOrbTop,
            {
              backgroundColor: theme.isDark
                ? 'rgba(56, 189, 248, 0.11)'
                : 'rgba(26, 111, 208, 0.08)',
            },
          ]}
        />
        <View
          style={[
            styles.ambientOrbBottom,
            {
              backgroundColor: theme.isDark
                ? 'rgba(129, 140, 248, 0.09)'
                : 'rgba(99, 102, 241, 0.06)',
            },
          ]}
        />
      </View>

      <KeyboardAvoidingView
        behavior={config.keyboardBehavior}
        style={styles.keyboardContainer}>
        {header && <View style={styles.fixedHeader}>{header}</View>}

        {scrollable ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}>
            {innerContent}
          </ScrollView>
        ) : (
          <View style={styles.nonScrollContent}>{innerContent}</View>
        )}

        {footer && <View style={styles.fixedFooter}>{footer}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  ambientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  ambientOrbTop: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 340,
    height: 340,
    borderRadius: 170,
    ...Platform.select({
      web: {
        filter: 'blur(70px)',
      } as any,
      default: {},
    }),
  },
  ambientOrbBottom: {
    position: 'absolute',
    bottom: -140,
    left: -100,
    width: 380,
    height: 380,
    borderRadius: 190,
    ...Platform.select({
      web: {
        filter: 'blur(80px)',
      } as any,
      default: {},
    }),
  },
  keyboardContainer: {
    flex: 1,
  },
  fixedHeader: {
    width: '100%',
    alignSelf: 'center',
    maxWidth: 800,
    zIndex: 10,
  },
  fixedFooter: {
    width: '100%',
    alignSelf: 'center',
    maxWidth: 800,
    zIndex: 20,
  },
  scrollContent: {
    flexGrow: 1,
  },
  nonScrollContent: {
    flex: 1,
  },
  maxWidthWrapper: {
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
  },
});
