import { Tabs } from "expo-router";
import { Home, ShoppingCart, Trophy, User } from "lucide-react-native";
import { StyleSheet, Text } from "react-native";
import React from "react";

import Colors from "@/constants/colors";
import AnimatedTabIcon from "@/components/ui/AnimatedTabIcon";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tint,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.bg2,
          borderTopColor: Colors.border,
        },
        headerShown: false,
        lazy: false,
        animation: "shift",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarLabel: ({ color }) => <Text style={[tabStyles.label, { color }]}>Home</Text>,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={!!focused}>
              <Home size={22} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
      {/* Plan stays reachable via "Open Plan" on Today's Fuel — just not shown as a tab */}
      <Tabs.Screen name="plan" options={{ href: null }} />
      <Tabs.Screen
        name="match"
        options={{
          title: "Match",
          tabBarLabel: ({ color }) => <Text style={[tabStyles.label, { color }]}>Match</Text>,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={!!focused}>
              <Trophy size={22} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarLabel: ({ color }) => <Text style={[tabStyles.label, { color }]}>Shop</Text>,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={!!focused}>
              <ShoppingCart size={22} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: ({ color }) => <Text style={[tabStyles.label, { color }]}>Profile</Text>,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={!!focused}>
              <User size={22} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
      {/* Budget remains a reachable route (pushed from the Shop tab) but is not a tab */}
      <Tabs.Screen name="budget" options={{ href: null }} />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  label: {
    fontSize: 10,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
