import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
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

interface SegmentItemProps {
  label: string;
  count?: number;
  iconName?: AppIconName;
  isActive: boolean;
  onPress: () => void;
}

function SegmentItem({
  label,
  count,
  iconName,
  isActive,
  onPress,
}: SegmentItemProps) {
  const theme = useTheme();

  const handlePress = () => {
    triggerLightHaptic();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={
        count !== undefined ? `${label}, ${count} eventos` : label
      }
      onPress={handlePress}
      style={({ pressed }) => [
        styles.item,
        {
          transform: [{ scale: pressed ? 0.95 : 1 }],
          opacity: pressed ? 0.85 : 1,
        },
        isActive && [
          styles.itemActive,
          {
            backgroundColor: theme.isDark ? theme.backgroundElement : '#FFFFFF',
            borderColor: theme.isDark
              ? 'rgba(255, 255, 255, 0.12)'
              : 'rgba(0, 0, 0, 0.06)',
          },
        ],
      ]}
    >
        {iconName && (
          <View style={styles.iconContainer}>
            <Icon
              name={iconName}
              size={13}
              color={isActive ? theme.primary : theme.textSecondary}
            />
          </View>
        )}
        <ThemedText
          type={isActive ? 'smallBold' : 'small'}
          style={{
            color: isActive ? theme.text : theme.textSecondary,
            fontSize: 13,
          }}
        >
          {label}
        </ThemedText>

        {count !== undefined && (
          <View
            style={[
              styles.countBadge,
              {
                backgroundColor: isActive
                  ? theme.isDark
                    ? 'rgba(255, 255, 255, 0.16)'
                    : 'rgba(0, 0, 0, 0.08)'
                  : theme.isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)',
              },
            ]}
          >
            <ThemedText
              type="smallBold"
              style={{
                fontSize: 11,
                color: isActive ? theme.primary : theme.textSecondary,
              }}
            >
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

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: theme.isDark
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.04)',
          borderColor: theme.isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.05)',
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((option) => (
          <SegmentItem
            key={option.value}
            label={option.label}
            count={option.count}
            iconName={icons?.[option.value]}
            isActive={value === option.value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.full,
    padding: 3,
    borderWidth: 1,
    marginVertical: Spacing.two,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemActive: {
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
