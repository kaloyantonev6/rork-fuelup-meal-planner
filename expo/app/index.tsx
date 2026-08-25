import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Leaf,
  ChevronRight,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { useAuth } from "@/providers/AuthProvider";

const { width, height } = Dimensions.get("window");

type AuthMode = "signin" | "signup";

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoading: planLoading, hasOnboarded, profile } = useMealPlan();
  const { isLoading: authLoading, isAuthenticated, lastEmail, signIn, signUp } = useAuth();

  const appLoading = planLoading || authLoading;

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string; general?: string }>({});
  const [hasRedirected, setHasRedirected] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const formSlide = useRef(new Animated.Value(50)).current;
  const bgCircle1 = useRef(new Animated.Value(0)).current;
  const bgCircle2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (appLoading || hasRedirected) return;

if (isAuthenticated && hasOnboarded) {
  setHasRedirected(true);
  if (profile.parentalConsent === "pending") {
    router.replace("/consent-pending");
  } else {
    router.replace("/(tabs)/home");
  }
  return;
}

    if (isAuthenticated && !hasOnboarded) {
      console.log("User logged in but not onboarded, redirecting to onboarding");
      setHasRedirected(true);
      router.replace("/onboarding");
      return;
    }

    if (lastEmail) {
      setMode("signin");
      setEmail(lastEmail);
      console.log("Returning user detected, showing sign-in for:", lastEmail);
    } else {
      setMode("signup");
    }
  }, [appLoading, isAuthenticated, hasOnboarded, lastEmail, router, hasRedirected]);

  useEffect(() => {
    if (appLoading) return;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(formSlide, {
        toValue: 0,
        duration: 700,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(bgCircle1, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(bgCircle2, {
        toValue: 1,
        duration: 1400,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appLoading]);

  const switchMode = useCallback(() => {
    setErrors({});
    setNotice("");
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMode((prev) => (prev === "signin" ? "signup" : "signin"));
      slideAnim.setValue(20);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [slideAnim]);

  const validate = useCallback((): boolean => {
    const newErrors: { email?: string; password?: string; name?: string } = {};
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Enter a valid email";
    }
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "At least 6 characters";
    }
    if (mode === "signup" && !name.trim()) {
      newErrors.name = "Name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password, name, mode]);

  const handleAuth = useCallback(async () => {
    if (!validate()) return;
    setIsLoading(true);
    setErrors({});
    setNotice("");

    try {
      if (mode === "signup") {
        const result = await signUp(email, password, name);
        if (!result.success) {
          setErrors({ general: result.error });
          return;
        }
        if (result.requiresConfirmation) {
          // Email confirmation is enabled on the Supabase project — the user
          // must click the emailed link before the first sign-in.
          setMode("signin");
          setPassword("");
          setNotice("Account created! Check your email for the confirmation link, then sign in.");
          return;
        }
        console.log("Sign up successful, navigating to onboarding");
        router.replace("/onboarding");
      } else {
        const result = await signIn(email, password);
        if (!result.success) {
          setErrors({ general: result.error });
          return;
        }
        console.log("Sign in successful, navigating to home");
        if (hasOnboarded) {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/onboarding");
        }
      }
    } catch (e) {
      console.log("Auth error:", e);
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }, [validate, mode, email, password, name, signUp, signIn, hasOnboarded, router]);

  if (appLoading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingLogoIcon}>
          <Leaf size={32} color="#fff" strokeWidth={2.5} />
        </View>
        <Text style={styles.loadingLogoText}>FuelUp</Text>
        <ActivityIndicator color={Colors.primary} size="small" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Animated.View
        style={[
          styles.bgCircle1,
          {
            opacity: bgCircle1,
            transform: [{ scale: bgCircle1.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bgCircle2,
          {
            opacity: bgCircle2,
            transform: [{ scale: bgCircle2.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
          },
        ]}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <View style={styles.logoIcon}>
              <Leaf size={32} color="#fff" strokeWidth={2.5} />
            </View>
            <Text style={styles.logoText}>FuelUp</Text>
            <Text style={styles.tagline}>
              {lastEmail !== "" && mode === "signin"
                ? "Welcome back! Sign in to continue."
                : "Eat smarter. Save more. Feel great."}
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: formSlide }],
              },
            ]}
          >
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === "signin" && styles.modeBtnActive]}
                onPress={() => mode !== "signin" && switchMode()}
                activeOpacity={0.7}
                testID="signin-tab"
              >
                <Text style={[styles.modeBtnText, mode === "signin" && styles.modeBtnTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === "signup" && styles.modeBtnActive]}
                onPress={() => mode !== "signup" && switchMode()}
                activeOpacity={0.7}
                testID="signup-tab"
              >
                <Text style={[styles.modeBtnText, mode === "signup" && styles.modeBtnTextActive]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {errors.general ? (
              <View style={styles.generalErrorBox}>
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            ) : null}

            {notice ? (
              <View style={styles.noticeBox}>
                <Text style={styles.noticeText}>{notice}</Text>
              </View>
            ) : null}

            <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
              {mode === "signup" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View style={[styles.inputWrapper, errors.name ? styles.inputError : null]}>
                    <View style={styles.inputIconWrap}>
                      <Text style={styles.inputIconText}>👤</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Your name"
                      placeholderTextColor={Colors.textTertiary}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      testID="name-input"
                    />
                  </View>
                  {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={[styles.inputWrapper, errors.email ? styles.inputError : null]}>
                  <View style={styles.inputIconWrap}>
                    <Mail size={18} color={Colors.textTertiary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="hello@example.com"
                    placeholderTextColor={Colors.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    testID="email-input"
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
                  <View style={styles.inputIconWrap}>
                    <Lock size={18} color={Colors.textTertiary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    testID="password-input"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((p) => !p)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={Colors.textTertiary} />
                    ) : (
                      <Eye size={18} color={Colors.textTertiary} />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              {mode === "signin" && (
                <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.6}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              )}
            </Animated.View>

            <TouchableOpacity
              style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
              onPress={() => void handleAuth()}
              activeOpacity={0.8}
              disabled={isLoading}
              testID="auth-submit-btn"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>
                    {mode === "signin" ? "Sign In" : "Create Account"}
                  </Text>
                  <ArrowRight size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

          </Animated.View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            </Text>
            <TouchableOpacity onPress={switchMode} activeOpacity={0.6}>
              <Text style={styles.footerLink}>
                {mode === "signin" ? "Sign Up" : "Sign In"}
              </Text>
            </TouchableOpacity>
            <ChevronRight size={14} color={Colors.primary} style={{ marginLeft: 2 }} />
          </View>

          <Text style={styles.terms}>
            By continuing, you agree to our{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> &{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F0F7F2",
  },
  flex: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#F0F7F2",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingLogoIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingLogoText: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  bgCircle1: {
    position: "absolute",
    top: -height * 0.15,
    right: -width * 0.3,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: "rgba(27, 156, 79, 0.08)",
  },
  bgCircle2: {
    position: "absolute",
    bottom: -height * 0.1,
    left: -width * 0.25,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: "rgba(255, 140, 66, 0.06)",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 6,
    letterSpacing: 0.2,
    textAlign: "center" as const,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 11,
    alignItems: "center",
  },
  modeBtnActive: {
    backgroundColor: Colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  modeBtnText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.textTertiary,
  },
  modeBtnTextActive: {
    color: Colors.text,
  },
  generalErrorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 12,
    marginBottom: 16,
  },
  generalErrorText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: "500" as const,
    textAlign: "center" as const,
  },
  noticeBox: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    fontSize: 13,
    color: "#15803D",
    fontWeight: "500" as const,
    textAlign: "center" as const,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 10,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    paddingHorizontal: 16,
    height: 58,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: "#FEF2F2",
  },
  inputIconWrap: {
    width: 28,
    alignItems: "center",
  },
  inputIconText: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 0,
    marginLeft: 10,
  },
  eyeBtn: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 8,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 54,
    marginTop: 8,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  terms: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 16,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: "500" as const,
  },
});
