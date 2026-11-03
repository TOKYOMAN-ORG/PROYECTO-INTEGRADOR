import { Radius, type ColorTheme } from '../constants/theme.ts';
import type { AppIconName } from './icon-model.ts';

export type BannerTone = 'success' | 'error' | 'warning' | 'info';

export interface BannerStyleConfig {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  iconName: AppIconName;
  iconColor: string;
  borderRadius: number;
}

export function resolveBannerConfig(tone: BannerTone, theme: ColorTheme): BannerStyleConfig {
  switch (tone) {
    case 'success':
      return {
        backgroundColor: theme.successMuted,
        borderColor: theme.success,
        textColor: theme.onSuccessMuted,
        iconName: 'check',
        iconColor: theme.success,
        borderRadius: Radius.md,
      };
    case 'error':
      return {
        backgroundColor: theme.dangerMuted,
        borderColor: theme.danger,
        textColor: theme.onDangerMuted,
        iconName: 'error',
        iconColor: theme.danger,
        borderRadius: Radius.md,
      };
    case 'warning':
      return {
        backgroundColor: theme.warningMuted,
        borderColor: theme.warning,
        textColor: theme.onWarningMuted,
        iconName: 'warning',
        iconColor: theme.warning,
        borderRadius: Radius.md,
      };
    case 'info':
    default:
      return {
        backgroundColor: theme.infoMuted,
        borderColor: theme.info,
        textColor: theme.onInfoMuted,
        iconName: 'info',
        iconColor: theme.info,
        borderRadius: Radius.md,
      };
  }
}
