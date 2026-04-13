import React from 'react';
import { View, Platform, useWindowDimensions, StyleSheet } from 'react-native';
import { useSegments } from 'expo-router';
import { ADMIN_MAX_WIDTH, MAX_CONTENT_WIDTH, MOBILE_BREAKPOINT } from '@/constants/web';

interface WebContentProps {
  children: React.ReactNode;
  maxWidth?: number;
}

export function WebContent({ children, maxWidth }: WebContentProps) {
  const { width } = useWindowDimensions();
  const segments = useSegments();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const isAdmin = segments.includes('(admin)');
  const isLargeScreen = width >= MOBILE_BREAKPOINT;
  const resolvedMaxWidth = maxWidth ?? (isAdmin ? ADMIN_MAX_WIDTH : MAX_CONTENT_WIDTH);

  return (
    <View
      style={[
        styles.content,
        isLargeScreen && {
          maxWidth: resolvedMaxWidth,
          width: '100%',
          alignSelf: 'center',
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    flex: 1,
  },
});
