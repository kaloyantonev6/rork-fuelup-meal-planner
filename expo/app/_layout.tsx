// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MealPlanProvider } from "@/providers/MealPlanProvider";
import { TodayProvider } from "@/providers/TodayProvider";
import { MealTrackingProvider } from "@/providers/MealTrackingProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { SavedPlansProvider } from "@/providers/SavedPlansProvider";
import { BudgetProvider } from "@/providers/BudgetProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";

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
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <AuthProvider>
          <MealPlanProvider>
          <TodayProvider>
          <MealTrackingProvider>
          <SavedPlansProvider>
            <BudgetProvider>
              <NotificationProvider>
                <RootLayoutNav />
              </NotificationProvider>
            </BudgetProvider>
          </SavedPlansProvider>
          </MealTrackingProvider>
          </TodayProvider>
          </MealPlanProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
