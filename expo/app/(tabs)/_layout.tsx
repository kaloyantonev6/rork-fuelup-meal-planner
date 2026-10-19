import { Tabs } from "expo-router";
import { Home, ShoppingCart, Trophy, User } from "lucide-react-native";
import { StyleSheet, Text } from "react-native";
import React from "react";

import Colors from "@/constants/colors";
import { fonts } from "@/constants/design";
import AnimatedTabIcon from "@/components/ui/AnimatedTabIcon";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tint,
        tabBarInactiveTintColor: Colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: "rgba(255,255,255,0.06)",
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        sceneStyle: { backgroundColor: Colors.bg0 },
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
      {/* Legacy budget links redirect to Shop. */}
      <Tabs.Screen name="budget" options={{ href: null }} />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  label: {
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 0.6,
    marginTop: 2,
  },
});
