import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { Icon } from './icon';
import type { AppIconName } from './icon-model';
import type { SegmentedOption } from './segmented-control-model';
import { ThemedText } from './themed-text';
import { Radius, Spacing } from '../constants/theme';
import { useTheme } from '../hooks/use-theme';
import { triggerLightHaptic } from '../utils/haptics';

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  icons?: Partial<Record<T, AppIconName>>;
  testID?: string;
}

interface SegmentLayout {
  x: number;
  width: number;
}

interface SegmentItemProps {
  label: string;
  count?: number;
  iconName?: AppIconName;
  isActive: boolean;
  showStaticActiveBg: boolean;
  onPress: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

function SegmentItem({
  label,
  count,
  iconName,
  isActive,
  showStaticActiveBg,
  onPress,
  onLayout,
}: SegmentItemProps) {
  const theme = useTheme();

  const handlePress = () => {
    triggerLightHaptic();
    onPress();
  };

  return (
    <Pressable
      onLayout={onLayout}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={
        count !== undefined ? `${label}, ${count} eventos` : label
      }
      onPress={handlePress}
      style={({ pressed }) => [
        styles.item,
        {
          transform: [{ scale: pressed ? 0.96 : 1 }],
          opacity: pressed ? 0.85 : 1,
        },
        isActive &&
          showStaticActiveBg && [
            styles.itemActiveFallback,
            {
              backgroundColor: theme.isDark
                ? 'rgba(255, 255, 255, 0.14)'
                : 'rgba(255, 255, 255, 0.92)',
              borderColor: theme.isDark
                ? 'rgba(255, 255, 255, 0.24)'
                : 'rgba(255, 255, 255, 0.95)',
            },
          ],
      ]}>
      {iconName && (
        <View style={styles.iconContainer}>
          <Icon
            name={iconName}
            size={14}
            color={isActive ? theme.primary : theme.textSecondary}
          />
        </View>
      )}
      <ThemedText
        type={isActive ? 'smallBold' : 'small'}
        style={{
          color: isActive ? theme.text : theme.textSecondary,
          fontSize: 13,
        }}>
        {label}
      </ThemedText>

      {count !== undefined && (
        <View
          style={[
            styles.countBadge,
            {
              backgroundColor: isActive
                ? theme.isDark
                  ? 'rgba(56, 189, 248, 0.22)'
                  : 'rgba(26, 111, 208, 0.12)'
                : theme.isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.05)',
            },
          ]}>
          <ThemedText
            type="smallBold"
            style={{
              fontSize: 11,
              color: isActive ? theme.primary : theme.textSecondary,
            }}>
            {count}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  icons,
  testID,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  const [layouts, setLayouts] = useState<Record<string, SegmentLayout>>({});
  const [pillX] = useState(() => new Animated.Value(0));
  const [pillWidth] = useState(() => new Animated.Value(0));
  const [pillScaleY] = useState(() => new Animated.Value(1));
  const initializedRef = useRef(false);

  const activeLayout = layouts[value];

  useEffect(() => {
    if (!activeLayout) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      pillX.setValue(activeLayout.x);
      pillWidth.setValue(activeLayout.width);
      return;
    }

    Animated.parallel([
      Animated.spring(pillX, {
        toValue: activeLayout.x,
        damping: 20,
        stiffness: 210,
        mass: 0.7,
        useNativeDriver: false,
      }),
      Animated.spring(pillWidth, {
        toValue: activeLayout.width,
        damping: 20,
        stiffness: 210,
        mass: 0.7,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(pillScaleY, {
          toValue: 0.92,
          duration: 90,
          useNativeDriver: false,
        }),
        Animated.spring(pillScaleY, {
          toValue: 1,
          damping: 12,
          stiffness: 220,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, [activeLayout, pillX, pillWidth, pillScaleY]);

  const handleItemLayout = (optionValue: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setLayouts((prev) => {
      const existing = prev[optionValue];
      if (
        existing &&
        Math.abs(existing.x - x) < 0.5 &&
        Math.abs(existing.width - width) < 0.5
      ) {
        return prev;
      }
      return { ...prev, [optionValue]: { x, width } };
    });
  };

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: theme.isDark
            ? 'rgba(15, 23, 42, 0.55)'
            : 'rgba(241, 245, 249, 0.78)',
          borderColor: theme.isDark
            ? 'rgba(255, 255, 255, 0.14)'
            : 'rgba(15, 23, 42, 0.08)',
        },
      ]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {activeLayout && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.liquidPill,
              {
                left: pillX,
                width: pillWidth,
                transform: [{ scaleY: pillScaleY }],
                backgroundColor: theme.isDark
                  ? 'rgba(255, 255, 255, 0.13)'
                  : 'rgba(255, 255, 255, 0.92)',
                borderColor: theme.isDark
                  ? 'rgba(255, 255, 255, 0.28)'
                  : 'rgba(255, 255, 255, 0.98)',
              },
            ]}
          />
        )}

        {options.map((option) => (
          <SegmentItem
            key={option.value}
            label={option.label}
            count={option.count}
            iconName={icons?.[option.value]}
            isActive={value === option.value}
            showStaticActiveBg={!activeLayout}
            onPress={() => onChange(option.value)}
            onLayout={(e) => handleItemLayout(option.value, e)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.full,
    padding: 4,
    borderWidth: 1,
    marginVertical: Spacing.two,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px) saturate(190%)',
        WebkitBackdropFilter: 'blur(20px) saturate(190%)',
        boxShadow:
          'inset 0 1px 1px rgba(255, 255, 255, 0.25), 0 4px 14px rgba(0, 0, 0, 0.06)',
      } as any,
      default: {},
    }),
  },
  scrollContent: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  liquidPill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: Radius.full,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        boxShadow:
          'inset 0 1px 2px rgba(255, 255, 255, 0.45), 0 3px 10px rgba(0, 0, 0, 0.12)',
      } as any,
      default: {},
    }),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    zIndex: 1,
  },
  itemActiveFallback: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
    marginLeft: 2,
  },
});
