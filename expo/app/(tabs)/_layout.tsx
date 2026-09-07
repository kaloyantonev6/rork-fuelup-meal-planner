import { Tabs } from "expo-router";
import { Home, User, Wallet } from "lucide-react-native";
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
          title: "Fuel",
          tabBarLabel: ({ color }) => <Text style={[tabStyles.label, { color: color }]}>Fuel</Text>,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={!!focused}>
              <Home size={22} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          tabBarLabel: ({ color }) => <Text style={[tabStyles.label, { color: color }]}>Budget</Text>,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={!!focused}>
              <Wallet size={22} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: ({ color }) => <Text style={[tabStyles.label, { color: color }]}>Profile</Text>,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={!!focused}>
              <User size={22} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
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
