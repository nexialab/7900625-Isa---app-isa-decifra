import React from 'react';
import { View, Platform, useWindowDimensions, StyleSheet } from 'react-native';
import { useSegments, usePathname } from 'expo-router';
import { COLORS_ARTIO } from '@/constants/colors-artio';
import { ADMIN_MAX_WIDTH, MAX_CONTENT_WIDTH, MOBILE_BREAKPOINT } from '@/constants/web';

const ADMIN_ROUTES = ['/login', '/codigos', '/treinadoras', '/compras', '/relatorios', '/configuracoes'];

export function WebContainer({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const segments = useSegments();
  const pathname = usePathname();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const isAdmin = segments.includes('(admin)') || ADMIN_ROUTES.some(route => pathname.startsWith(route));
  const isLargeScreen = width >= MOBILE_BREAKPOINT;
  const maxWidth = isAdmin ? ADMIN_MAX_WIDTH : MAX_CONTENT_WIDTH;

  return (
    <View style={styles.webRoot}>
      <View
        style={[
          styles.webContainer,
          isLargeScreen && {
            maxWidth,
            width: '100%',
            // @ts-ignore - react-native-web supports boxShadow as string in inline styles
            boxShadow: '0 0 60px rgba(0, 0, 0, 0.3)',
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    backgroundColor: COLORS_ARTIO.vinhoDeep,
    alignItems: 'center',
  },
  webContainer: {
    flex: 1,
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
  },
});
