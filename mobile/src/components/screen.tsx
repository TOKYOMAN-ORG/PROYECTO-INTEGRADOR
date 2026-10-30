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
  },
  keyboardContainer: {
    flex: 1,
  },
  fixedHeader: {
    width: '100%',
    alignSelf: 'center',
    maxWidth: 800,
  },
  fixedFooter: {
    width: '100%',
    alignSelf: 'center',
    maxWidth: 800,
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
