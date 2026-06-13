import { ClerkLoaded, ClerkLoading, ClerkProvider, useAuth } from '@clerk/expo';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { ActivityIndicator, Platform, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useAppContext } from '../utils/ThemeContext';

SplashScreen.preventAutoHideAsync();

const publishableKey = 'pk_live_Y2xlcmsuc3NkdmYueHl6JA';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#121212', padding: 24, paddingTop: 60 }}>
          <Text style={{ color: '#FF5252', fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'right' }}>
            حدث خطأ أثناء تشغيل التطبيق:
          </Text>
          <Text style={{ color: '#FFFFFF', fontSize: 16, marginBottom: 20, textAlign: 'right', lineHeight: 24 }}>
            {this.state.error?.toString()}
          </Text>
          <Text style={{ color: '#A0A0A0', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
            {this.state.errorInfo?.componentStack}
          </Text>
        </ScrollView>
      );
    }

    return this.props.children;
  }
}

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();
  const { theme, isDark, isArabic } = useAppContext();

  useEffect(() => {
    if (!isLoaded) return;

    // إخفاء شاشة البداية البيضاء بعد تحميل Clerk
    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn) {
      if (inAuthGroup || segments.length === 0 || (segments.length === 1 && segments[0] === 'index')) {
        // Redirect signed-in user to tabs if they are in auth screen or splash screen
        router.replace('/(tabs)');
      }
    } else {
      if (!inAuthGroup) {
        // Redirect signed-out user to login screen if they aren't there
        router.replace('/(auth)/login');
      }
    }
  }, [isSignedIn, isLoaded, segments]);

  // Return the main navigation stack so Expo Router can load the appropriate screens
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="book" options={{
          title: isArabic ? 'حجز موعد جديد' : 'Book Appointment',
          headerShown: true,
          headerStyle: { backgroundColor: theme.headerBg },
          headerTintColor: theme.textPrimary,
          headerTitleStyle: { fontWeight: 'bold' }
        }} />
        <Stack.Screen name="product/[id]" options={{
          title: isArabic ? 'تفاصيل المنتج' : 'Product Details',
          headerShown: true,
          headerStyle: { backgroundColor: theme.headerBg },
          headerTintColor: theme.textPrimary,
          headerTitleStyle: { fontWeight: 'bold' }
        }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  // هذا الشرط سيمنع الشاشة البيضاء ويظهر رسالة واضحة إذا كان المفتاح مفقوداً
  if (!publishableKey) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#121212' }}>
        <Text style={{ fontSize: 18, color: "red", fontWeight: "bold", textAlign: "center", padding: 20 }}>
          ⚠️ مفتاح Clerk مفقود أو لم يتم التعرف عليه!
        </Text>
      </View>
    );
  }

  // نقوم بالتشغيل بدون tokenCache لتلافي تعليق SecureStore في الأندرويد
  return (
    <AppErrorBoundary>
      <AppProvider>
        <ClerkProvider publishableKey={publishableKey}>
          <ClerkLoading>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
              <ActivityIndicator size="large" color="#C5A880" />
            </View>
          </ClerkLoading>
          <ClerkLoaded>
            <InitialLayout />
          </ClerkLoaded>
        </ClerkProvider>
      </AppProvider>
    </AppErrorBoundary>
  );
}
