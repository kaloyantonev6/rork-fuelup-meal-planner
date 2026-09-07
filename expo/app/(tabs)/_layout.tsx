import { Tabs } from "expo-router";
import { Home, User, Wallet } from "lucide-react-native";
import { Text } from "react-native";
import React from "react";

import Colors from "@/constants/colors";
import AnimatedTabIcon from "@/components/ui/AnimatedTabIcon";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tint,
        headerShown: false,
        lazy: false,
        animation: "shift",
        transitionSpec: {
          animation: "spring",
          config: {
            stiffness: 320,
            damping: 32,
            mass: 0.9,
          },
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Fuel",
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
