import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ArrowLeft,
  Lock,
  Shield,
  CreditCard,
  Check,
  Sparkles,
  Calendar,
  FileText,
  ShoppingCart,
  BookmarkPlus,
  ChefHat,
  Play,
} from "lucide-react-native";




const FEATURES = [
  { label: "Unlimited meal plans", icon: Calendar },
  { label: "Match Day Timeline", icon: Sparkles },
  { label: "AI Performance Coach", icon: ChefHat },
  { label: "Smart grocery list with price comparison", icon: ShoppingCart },
  { label: "Export to PDF", icon: FileText },
  { label: "Unlimited plan saves", icon: BookmarkPlus },
  { label: "Cooking video tutorials", icon: Play },
];

function getTrialEndDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 10);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getTrialEndDateISO(): string {
  const date = new Date();
  date.setDate(date.getDate() + 10);
  return date.toISOString();
}

function getTodayISO(): string {
  return new Date().toISOString();
}

interface FormErrors {
  cardNumber?: string;
  cardName?: string;
  expMonth?: string;
  expYear?: string;
  cvv?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ plan?: string }>();
  const selectedPlan = params.plan === "annual" ? "annual" : "monthly";

  const price = selectedPlan === "annual" ? "€44.00" : "€5.99";
  const pricePeriod = selectedPlan === "annual" ? "/year" : "/month";
  const chargeDate = getTrialEndDate();

  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardName, setCardName] = useState<string>("");
  const [expMonth, setExpMonth] = useState<string>("");
  const [expYear, setExpYear] = useState<string>("");
  const [cvv, setCvv] = useState<string>("");
  const [street, setStreet] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 12 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    const loadCountry = async () => {
      try {
        const stored = await AsyncStorage.getItem("country");
        if (stored) {
          setCountry(stored);
        }
      } catch (e) {
        console.log("Failed to load country from AsyncStorage", e);
      }
    };
    void loadCountry();
  }, []);

  const formatCardNumber = useCallback((text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleaned;
  }, []);

  const handleCardNumberChange = useCallback(
    (text: string) => {
      setCardNumber(formatCardNumber(text));
      if (errors.cardNumber) {
        setErrors((prev) => ({ ...prev, cardNumber: undefined }));
      }
    },
    [formatCardNumber, errors.cardNumber]
  );

  const createFieldHandler = useCallback(
    (
      setter: React.Dispatch<React.SetStateAction<string>>,
      fieldName: keyof FormErrors
    ) => {
      return (text: string) => {
        setter(text);
        if (errors[fieldName]) {
          setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
        }
      };
    },
    [errors]
  );

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    const rawCard = cardNumber.replace(/\s/g, "");
    if (rawCard.length < 13) newErrors.cardNumber = "Enter a valid card number";
    if (!cardName.trim()) newErrors.cardName = "Enter cardholder name";
    if (!expMonth.trim() || parseInt(expMonth, 10) < 1 || parseInt(expMonth, 10) > 12)
      newErrors.expMonth = "Invalid";
    if (!expYear.trim() || expYear.length < 2) newErrors.expYear = "Invalid";
    if (!cvv.trim() || cvv.length < 3) newErrors.cvv = "Invalid";
    if (!street.trim()) newErrors.street = "Enter street address";
    if (!city.trim()) newErrors.city = "Required";
    if (!postalCode.trim()) newErrors.postalCode = "Required";
    if (!country.trim()) newErrors.country = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [cardNumber, cardName, expMonth, expYear, cvv, street, city, postalCode, country]);

  const runSuccessAnimation = useCallback(() => {
    Animated.parallel([
      Animated.spring(successScale, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    confettiAnims.forEach((anim, i) => {
      const angle = (i / 12) * 2 * Math.PI;
      const distance = 80 + Math.random() * 60;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance - 40;

      Animated.sequence([
        Animated.delay(200 + i * 30),
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(anim.x, {
            toValue: targetX,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(anim.y, {
            toValue: targetY,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: Math.random() * 4 - 2,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [successScale, successOpacity, confettiAnims]);

  const handlePayment = useCallback(async () => {
    if (!validate()) return;

    setIsProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      await AsyncStorage.setItem("is_premium", "true");
      await AsyncStorage.setItem("trial_start_date", getTodayISO());
      await AsyncStorage.setItem("trial_end_date", getTrialEndDateISO());
      await AsyncStorage.setItem("selected_plan", selectedPlan);
      console.log("Premium activated:", {
        plan: selectedPlan,
        trialEnd: getTrialEndDateISO(),
      });
    } catch (e) {
      console.log("Error saving premium status", e);
    }

    setIsProcessing(false);
    setShowSuccess(true);
    runSuccessAnimation();

    void new Promise((resolve) =>
      setTimeout(() => {
        router.replace("/(tabs)/home");
        resolve(undefined);
      }, 2500)
    );
  }, [validate, selectedPlan, runSuccessAnimation, router]);

  const confettiColors = [
    "#2dd4a8",
    "#0f766e",
    "#D4A44C",
    "#FF8C42",
    "#3b82f6",
    "#ef4444",
    "#8b5cf6",
    "#f59e0b",
    "#ec4899",
    "#10b981",
    "#06b6d4",
    "#f97316",
  ];

  if (showSuccess) {
    return (
      <View style={[styles.successContainer, { paddingTop: insets.top }]}>
        <View style={styles.successCenter}>
          {confettiAnims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confettiPiece,
                {
                  backgroundColor: confettiColors[i % confettiColors.length],
                  opacity: anim.opacity,
                  transform: [
                    { translateX: anim.x },
                    { translateY: anim.y },
                    {
                      rotate: anim.rotate.interpolate({
                        inputRange: [-2, 2],
                        outputRange: ["-180deg", "180deg"],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}

          <Animated.View
            style={[
              styles.successCheckCircle,
              {
                opacity: successOpacity,
                transform: [{ scale: successScale }],
              },
            ]}
          >
            <Check size={48} color="#fff" strokeWidth={3} />
          </Animated.View>

          <Animated.Text
            style={[styles.successTitle, { opacity: successOpacity }]}
          >
            Welcome to Premium!
          </Animated.Text>
          <Animated.Text
            style={[styles.successSubtitle, { opacity: successOpacity }]}
          >
            Your 10-day free trial has started.{"\n"}Enjoy all premium features!
          </Animated.Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && { opacity: 0.7 },
            ]}
            testID="checkout-back"
          >
            <ArrowLeft size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 30 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <View style={styles.orderSummaryCard}>
              <LinearGradient
                colors={["#2dd4a8", "#0f766e"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.orderSummaryHeader}
              >
                <Text style={styles.orderSummaryHeaderText}>Order Summary</Text>
              </LinearGradient>

              <View style={styles.orderSummaryBody}>
                <View style={styles.planRow}>
                  <Text style={styles.planTitle}>FuelUp Premium</Text>
                  <View style={styles.trialBadge}>
                    <Sparkles size={12} color="#D4A44C" />
                    <Text style={styles.trialBadgeText}>10-day free trial</Text>
                  </View>
                </View>

                <Text style={styles.planPriceLabel}>
                  Then {price}
                  {pricePeriod}
                </Text>

                <View style={styles.lineItemsContainer}>
                  <View style={styles.lineItem}>
                    <Text style={styles.lineItemLabel}>Subtotal</Text>
                    <Text style={styles.lineItemValue}>{price}</Text>
                  </View>
                  <View style={styles.lineItem}>
                    <Text style={styles.lineItemLabel}>Trial Discount</Text>
                    <Text style={styles.lineItemDiscount}>-{price}</Text>
                  </View>
                  <View style={styles.lineItemDivider} />
                  <View style={styles.lineItem}>
                    <Text style={styles.dueTodayLabel}>Due Today</Text>
                    <Text style={styles.dueTodayValue}>€0.00</Text>
                  </View>
                </View>

                <View style={styles.chargeNote}>
                  <Text style={styles.chargeNoteText}>
                    Your card will be charged {price} on {chargeDate}. Cancel
                    anytime before then to avoid charges.
                  </Text>
                </View>

                <View style={styles.featureChecklist}>
                  {FEATURES.map((feature, i) => (
                    <View key={i} style={styles.featureRow}>
                      <View style={styles.featureCheckIcon}>
                        <Check size={12} color="#fff" strokeWidth={3} />
                      </View>
                      <Text style={styles.featureLabel}>{feature.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <CreditCard size={20} color="#2dd4a8" />
                <Text style={styles.paymentHeaderTitle}>Payment Details</Text>
              </View>
              <View style={styles.securityRow}>
                <Shield size={13} color="#6B7280" />
                <Text style={styles.securityText}>
                  Secure payment powered by Stripe · 256-bit SSL encryption
                </Text>
              </View>

              <View style={styles.fieldGroup}>
                <View style={[
                  styles.inlineInputContainer,
                  errors.cardName ? styles.inputError : null,
                ]}>
                  <TextInput
                    style={styles.inlineInput}
                    placeholder="Cardholder name"
                    placeholderTextColor="#6B7280"
                    value={cardName}
                    onChangeText={createFieldHandler(setCardName, "cardName")}
                    autoCapitalize="words"
                    testID="card-name"
                  />
                </View>
                {errors.cardName && (
                  <Text style={styles.errorText}>{errors.cardName}</Text>
                )}
              </View>

              <View style={styles.fieldGroup}>
                <View style={[
                  styles.inlineInputContainer,
                  errors.cardNumber ? styles.inputError : null,
                ]}>
                  <TextInput
                    style={styles.inlineInput}
                    placeholder="Card number"
                    placeholderTextColor="#6B7280"
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                    keyboardType="number-pad"
                    maxLength={19}
                    testID="card-number"
                  />
                  <CreditCard size={18} color="#6B7280" />
                </View>
                {errors.cardNumber && (
                  <Text style={styles.errorText}>{errors.cardNumber}</Text>
                )}
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.smallFieldGroup, { flex: 1 }]}>
                  <View style={[
                    styles.inlineInputContainer,
                    errors.expMonth || errors.expYear ? styles.inputError : null,
                  ]}>
                    <TextInput
                      style={styles.inlineInput}
                      placeholder="Expiration"
                      placeholderTextColor="#6B7280"
                      value={expMonth || expYear ? `${expMonth}${expYear ? '/' + expYear : ''}` : ''}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/[^0-9/]/g, '');
                        if (cleaned.includes('/')) {
                          const parts = cleaned.split('/');
                          setExpMonth(parts[0].slice(0, 2));
                          setExpYear((parts[1] || '').slice(0, 2));
                        } else if (cleaned.length <= 2) {
                          setExpMonth(cleaned);
                        } else {
                          setExpMonth(cleaned.slice(0, 2));
                          setExpYear(cleaned.slice(2, 4));
                        }
                        if (errors.expMonth) setErrors((prev) => ({ ...prev, expMonth: undefined }));
                        if (errors.expYear) setErrors((prev) => ({ ...prev, expYear: undefined }));
                      }}
                      keyboardType="number-pad"
                      maxLength={5}
                      testID="exp-month"
                    />
                  </View>
                  {(errors.expMonth || errors.expYear) && (
                    <Text style={styles.errorText}>{errors.expMonth || errors.expYear}</Text>
                  )}
                </View>
                <View style={[styles.smallFieldGroup, { flex: 1 }]}>
                  <View style={[
                    styles.inlineInputContainer,
                    errors.cvv ? styles.inputError : null,
                  ]}>
                    <TextInput
                      style={styles.inlineInput}
                      placeholder="CVV"
                      placeholderTextColor="#6B7280"
                      value={cvv}
                      onChangeText={createFieldHandler(setCvv, "cvv")}
                      keyboardType="number-pad"
                      maxLength={4}
                      secureTextEntry
                      testID="cvv"
                    />
                  </View>
                  {errors.cvv && (
                    <Text style={styles.errorText}>{errors.cvv}</Text>
                  )}
                </View>
              </View>

              <View style={styles.sectionDivider} />

              <Text style={styles.billingTitle}>Billing Address</Text>

              <View style={styles.fieldGroup}>
                <View style={[
                  styles.inlineInputContainer,
                  errors.street ? styles.inputError : null,
                ]}>
                  <TextInput
                    style={styles.inlineInput}
                    placeholder="Street address"
                    placeholderTextColor="#6B7280"
                    value={street}
                    onChangeText={createFieldHandler(setStreet, "street")}
                    testID="street"
                  />
                </View>
                {errors.street && (
                  <Text style={styles.errorText}>{errors.street}</Text>
                )}
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.smallFieldGroup, { flex: 1 }]}>
                  <View style={[
                    styles.inlineInputContainer,
                    errors.city ? styles.inputError : null,
                  ]}>
                    <TextInput
                      style={styles.inlineInput}
                      placeholder="City"
                      placeholderTextColor="#6B7280"
                      value={city}
                      onChangeText={createFieldHandler(setCity, "city")}
                      testID="city"
                    />
                  </View>
                  {errors.city && (
                    <Text style={styles.errorText}>{errors.city}</Text>
                  )}
                </View>
                <View style={[styles.smallFieldGroup, { flex: 1 }]}>
                  <View style={[
                    styles.inlineInputContainer,
                    errors.postalCode ? styles.inputError : null,
                  ]}>
                    <TextInput
                      style={styles.inlineInput}
                      placeholder="Postal code"
                      placeholderTextColor="#6B7280"
                      value={postalCode}
                      onChangeText={createFieldHandler(setPostalCode, "postalCode")}
                      testID="postal-code"
                    />
                  </View>
                  {errors.postalCode && (
                    <Text style={styles.errorText}>{errors.postalCode}</Text>
                  )}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <View style={[
                  styles.inlineInputContainer,
                  errors.country ? styles.inputError : null,
                ]}>
                  <TextInput
                    style={styles.inlineInput}
                    placeholder="Country"
                    placeholderTextColor="#6B7280"
                    value={country}
                    onChangeText={createFieldHandler(setCountry, "country")}
                    testID="country"
                  />
                </View>
                {errors.country && (
                  <Text style={styles.errorText}>{errors.country}</Text>
                )}
              </View>
            </View>

            <Pressable
              onPress={handlePayment}
              disabled={isProcessing}
              style={({ pressed }) => [
                styles.payBtn,
                pressed && !isProcessing && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                isProcessing && { opacity: 0.7 },
              ]}
              testID="complete-payment"
            >
              <LinearGradient
                colors={["#2dd4a8", "#0f766e"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payBtnGradient}
              >
                {isProcessing ? (
                  <View style={styles.processingRow}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.payBtnText}>Processing...</Text>
                  </View>
                ) : (
                  <View style={styles.processingRow}>
                    <Lock size={16} color="#fff" />
                    <Text style={styles.payBtnText}>Complete Payment</Text>
                  </View>
                )}
              </LinearGradient>
            </Pressable>

            <Text style={styles.disclaimer}>
              This is a demo. No real charges will be made.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#0F1115",
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#0F1115",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: "#fff",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  orderSummaryCard: {
    borderRadius: 16,
    overflow: "hidden" as const,
    backgroundColor: "#1A1D23",
    marginBottom: 16,
  },
  orderSummaryHeader: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  orderSummaryHeaderText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
  orderSummaryBody: {
    padding: 18,
  },
  planRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 6,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: "#fff",
  },
  trialBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    backgroundColor: "rgba(212,164,76,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  trialBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#D4A44C",
  },
  planPriceLabel: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 18,
  },
  lineItemsContainer: {
    backgroundColor: "#242830",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  lineItem: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 6,
  },
  lineItemLabel: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  lineItemValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#E5E7EB",
  },
  lineItemDiscount: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#2dd4a8",
  },
  lineItemDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 6,
  },
  dueTodayLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
  dueTodayValue: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: "#2dd4a8",
  },
  chargeNote: {
    backgroundColor: "rgba(45,212,168,0.08)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  chargeNoteText: {
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 18,
  },
  featureChecklist: {
    gap: 10,
  },
  featureRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
  },
  featureCheckIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#2dd4a8",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  featureLabel: {
    fontSize: 13,
    color: "#E5E7EB",
    flex: 1,
  },
  paymentCard: {
    backgroundColor: "#1A1D23",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  paymentHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    marginBottom: 6,
  },
  paymentHeaderTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: "#fff",
  },
  securityRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginBottom: 20,
  },
  securityText: {
    fontSize: 11,
    color: "#6B7280",
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  inlineInputContainer: {
    backgroundColor: "#1A1D23",
    borderRadius: 10,
    height: 52,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#3A3F47",
  },
  inlineInput: {
    flex: 1,
    fontSize: 15,
    color: "#fff",
    height: 52,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    fontSize: 11,
    color: "#EF4444",
    marginTop: 4,
  },
  rowFields: {
    flexDirection: "row" as const,
    gap: 10,
    marginBottom: 14,
  },
  smallFieldGroup: {
    flex: 1,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 18,
  },
  billingTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#E5E7EB",
    marginBottom: 14,
  },
  payBtn: {
    borderRadius: 14,
    overflow: "hidden" as const,
    marginBottom: 12,
  },
  payBtnGradient: {
    paddingVertical: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 14,
  },
  processingRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  payBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
  disclaimer: {
    fontSize: 11,
    color: "#555",
    textAlign: "center" as const,
    marginBottom: 10,
  },
  successContainer: {
    flex: 1,
    backgroundColor: "#0F1115",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  successCenter: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  successCheckCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#2dd4a8",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: "#fff",
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 15,
    color: "#9CA3AF",
    textAlign: "center" as const,
    lineHeight: 22,
  },
  confettiPiece: {
    position: "absolute" as const,
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
