import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Dispara una retroalimentación háptica ligera de forma segura.
 * No genera errores en Web ni en dispositivos sin soporte de vibración háptica.
 */
export async function triggerLightHaptic(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Silencioso ante plataformas sin soporte
  }
}

/**
 * Dispara una retroalimentación háptica de éxito al completar operaciones clave.
 */
export async function triggerSuccessHaptic(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Silencioso ante plataformas sin soporte
  }
}
