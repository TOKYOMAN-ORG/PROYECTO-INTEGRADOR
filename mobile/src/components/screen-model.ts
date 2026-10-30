import { MaxContentWidth, Spacing } from '../constants/theme.ts';

export type ScreenEdge = 'top' | 'right' | 'bottom' | 'left';

export interface ScreenLayoutConfig {
  maxWidth: number;
  paddingHorizontal: number;
  paddingVertical: number;
  keyboardBehavior: 'padding' | undefined;
  defaultEdges: ScreenEdge[];
}

export function getScreenLayoutConfig(isIOS: boolean): ScreenLayoutConfig {
  return {
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four, // 24 px
    paddingVertical: Spacing.three, // 16 px
    keyboardBehavior: isIOS ? 'padding' : undefined,
    defaultEdges: ['top', 'right', 'bottom', 'left'],
  };
}
