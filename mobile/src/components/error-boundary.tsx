import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { reportError } from '@/utils/report-error';
import {
  createInitialErrorBoundaryState,
  getDerivedErrorState,
  resetErrorState,
  type ErrorBoundaryState,
} from './error-boundary-model';

export interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = createInitialErrorBoundaryState();
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return getDerivedErrorState();
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error);
    void info;
  }

  handleReset = () => {
    this.setState(resetErrorState(this.props.onReset));
  };

  render() {
    if (this.state.hasError) {
      return (
        <ThemedView style={styles.flex} testID="recovery-screen">
          <SafeAreaView style={styles.center}>
            <ThemedText type="subtitle" style={styles.centerText}>
              Algo salió mal
            </ThemedText>
            <ThemedText style={styles.centerText}>
              Ocurrió un error inesperado. Puedes volver a intentar.
            </ThemedText>
            <Button title="Reintentar" onPress={this.handleReset} testID="retry-button" />
          </SafeAreaView>
        </ThemedView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
});
