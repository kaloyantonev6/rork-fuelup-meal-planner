// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Barlow_500Medium } from "@expo-google-fonts/barlow/500Medium";
import { Barlow_600SemiBold } from "@expo-google-fonts/barlow/600SemiBold";
import { Barlow_700Bold } from "@expo-google-fonts/barlow/700Bold";
import { Barlow_800ExtraBold } from "@expo-google-fonts/barlow/800ExtraBold";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Colors from "@/constants/colors";
import { MealPlanProvider } from "@/providers/MealPlanProvider";
import { TodayProvider } from "@/providers/TodayProvider";
import { MealTrackingProvider } from "@/providers/MealTrackingProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { SavedPlansProvider } from "@/providers/SavedPlansProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { NotificationFeedProvider } from "@/providers/NotificationFeedProvider";

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
      screenOptions={{
        headerBackTitle: "Back",
        animation: "fade_from_bottom",
        animationDuration: 250,
        contentStyle: { backgroundColor: Colors.bg0 },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="premium" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="recipe" options={{ headerShown: false }} />
      <Stack.Screen name="meal-detail" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="checkout" options={{ headerShown: false }} />
      <Stack.Screen name="saved-plan-detail" options={{ headerShown: false }} />
      <Stack.Screen name="consent-pending" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="match-day" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
    Barlow_800ExtraBold,
  });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  // Hold the splash until the display fonts are registered so numerals never
  // flash in the fallback face. A load error falls through to system fonts.
  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <AuthProvider>
          <MealPlanProvider>
          <TodayProvider>
          <MealTrackingProvider>
          <SavedPlansProvider>
              <NotificationProvider>
                <NotificationFeedProvider>
                  <RootLayoutNav />
                </NotificationFeedProvider>
              </NotificationProvider>
          </SavedPlansProvider>
          </MealTrackingProvider>
          </TodayProvider>
          </MealPlanProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
