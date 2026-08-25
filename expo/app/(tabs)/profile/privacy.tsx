import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Privacy Policy",
          headerStyle: { backgroundColor: Colors.background },
          headerTitleStyle: { color: Colors.text, fontWeight: "600" as const, fontSize: 17 },
          headerTintColor: Colors.primary,
        }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Privacy Policy — FuelUp</Text>
        <Text style={styles.updated}>Last updated: March 2026</Text>

        <Text style={styles.sectionTitle}>1. Who we are</Text>
        <Text style={styles.body}>
          FuelUp is an AI-powered meal planning application operated by FuelUp. We are committed to protecting your personal data in accordance with the General Data Protection Regulation (GDPR) and applicable EU member state law.
        </Text>

        <Text style={styles.sectionTitle}>2. Data we collect</Text>
        <Text style={styles.body}>
          We collect and process the following categories of personal data:
        </Text>
        <Text style={styles.bullet}>• <Text style={styles.boldInline}>Identity & contact data:</Text> your name and email address, used to create and manage your account.</Text>
        <Text style={styles.bullet}>• <Text style={styles.boldInline}>Health & body data:</Text> weight, age, and fitness or nutritional goals, used solely to generate personalised meal plans.</Text>
        <Text style={styles.bullet}>• <Text style={styles.boldInline}>Dietary preferences:</Text> food preferences, allergies, and dietary restrictions, used to tailor AI-generated recommendations.</Text>
        <Text style={styles.bullet}>• <Text style={styles.boldInline}>Payment data:</Text> billing information processed securely through our third-party payment provider. We do not store your full card details on our servers.</Text>

        <Text style={styles.sectionTitle}>3. Legal basis for processing</Text>
        <Text style={styles.body}>
          We process your data on the following legal bases under GDPR Article 6 and Article 9:
        </Text>
        <Text style={styles.bullet}>• <Text style={styles.boldInline}>Performance of a contract:</Text> to provide the FuelUp service you have signed up for.</Text>
        <Text style={styles.bullet}>• <Text style={styles.boldInline}>Legitimate interests:</Text> to improve app performance and prevent misuse.</Text>
        <Text style={styles.bullet}>• <Text style={styles.boldInline}>Explicit consent:</Text> for the processing of health-related data (Article 9(2)(a) GDPR). You may withdraw consent at any time.</Text>

        <Text style={styles.sectionTitle}>4. How we use your data</Text>
        <Text style={styles.body}>Your data is used to:</Text>
        <Text style={styles.bullet}>• Generate and personalise AI-driven meal plans</Text>
        <Text style={styles.bullet}>• Maintain and secure your account</Text>
        <Text style={styles.bullet}>• Process payments and manage subscriptions</Text>
        <Text style={styles.bullet}>• Send service-related notifications (not marketing, unless separately consented to)</Text>

        <Text style={styles.sectionTitle}>5. Data sharing</Text>
        <Text style={styles.body}>
          We do not sell your personal data. We share data only with trusted service providers acting on our behalf (e.g. cloud hosting, payment processing, analytics), all of whom are contractually bound to process data in accordance with GDPR.
        </Text>

        <Text style={styles.sectionTitle}>6. Data retention</Text>
        <Text style={styles.body}>
          We retain your data for as long as your account is active, or as required by law. Upon account deletion, personal data is removed within 30 days.
        </Text>

        <Text style={styles.sectionTitle}>7. Your rights</Text>
        <Text style={styles.body}>Under GDPR, you have the right to:</Text>
        <Text style={styles.bullet}>• Access, correct, or delete your personal data</Text>
        <Text style={styles.bullet}>• Restrict or object to processing</Text>
        <Text style={styles.bullet}>• Withdraw consent at any time</Text>
        <Text style={styles.bullet}>• Data portability</Text>
        <Text style={styles.bullet}>• Lodge a complaint with your local supervisory authority</Text>
        <Text style={styles.bodySpaced}>
          To exercise any of these rights, please contact us at privacy@fuelup.app
        </Text>

        <Text style={styles.sectionTitle}>8. Cookies & analytics</Text>
        <Text style={styles.body}>
          FuelUp uses essential cookies required for app functionality and, with your consent, analytics cookies to improve the user experience. You may manage your cookie preferences at any time in this Settings menu.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  updated: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  bodySpaced: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    paddingLeft: 8,
    marginBottom: 4,
  },
  boldInline: {
    fontWeight: "600" as const,
    color: Colors.text,
  },
});
