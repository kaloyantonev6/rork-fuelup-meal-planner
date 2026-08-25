//
//  PremiumView.swift
//  FuelUp
//
//  Subscription paywall: €4.99/month or €34.99/year with a 10-day free trial.
//

import SwiftUI

struct PremiumView: View {
    @Environment(ProfileStore.self) private var profileStore
    @Environment(\.dismiss) private var dismiss

    @State private var isAnnual = false
    @State private var didAppear = false

    private static let freeFeatures = [
        "1 meal plan per week",
        "Basic hydration tracker",
        "Ingredient substitutes",
        "Performance tips",
        "Shopping list with price comparison",
    ]

    private static let proFeatures = [
        "Unlimited AI meal plan generation",
        "Match Day Timeline with personalized fuel schedule",
        "Season Planner (auto-adjusts nutrition by phase)",
        "Budget tracker with weekly projections",
        "Cooking tutorials for every meal",
        "Unlimited saved meal plans",
        "PDF export for coaches & parents",
        "Advanced hydration protocols",
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    header
                    billingToggle
                    proCard
                    freeCard
                    legalText
                }
                .padding(.bottom, 32)
                .opacity(didAppear ? 1 : 0)
                .offset(y: didAppear ? 0 : 20)
            }
            .background(Theme.background)
            .scrollIndicators(.hidden)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(.white.opacity(0.8))
                            .frame(width: 32, height: 32)
                            .background(Color.white.opacity(0.15))
                            .clipShape(.circle)
                    }
                }
            }
        }
        .preferredColorScheme(.dark)
        .task {
            withAnimation(.easeOut(duration: 0.5)) {
                didAppear = true
            }
        }
    }

    private var header: some View {
        VStack(spacing: 10) {
            Image(systemName: "crown.fill")
                .font(.system(size: 26))
                .foregroundStyle(Theme.premiumGold)
                .frame(width: 56, height: 56)
                .background(Theme.premiumGold.opacity(0.15))
                .clipShape(.circle)
                .overlay {
                    Circle().stroke(Theme.premiumGold.opacity(0.3), lineWidth: 1.5)
                }

            Text("FuelUp Pro")
                .font(.system(size: 28, weight: .heavy))
                .foregroundStyle(.white)

            Text("Fuel like a pro footballer.\nMatch-day ready, every week.")
                .font(.system(size: 14))
                .foregroundStyle(.white.opacity(0.75))
                .multilineTextAlignment(.center)
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 26)
        .frame(maxWidth: .infinity)
        .background {
            LinearGradient(
                colors: [Color(hex: "#134A2D"), Color(hex: "#1B5E3A"), Color(hex: "#2D8B56")],
                startPoint: .top,
                endPoint: .bottom
            )
        }
    }

    private var billingToggle: some View {
        HStack(spacing: 4) {
            toggleOption(label: "Monthly", selected: !isAnnual) {
                isAnnual = false
            }
            toggleOption(label: "Annual", selected: isAnnual, savings: "Save 42%") {
                isAnnual = true
            }
        }
        .padding(4)
        .background(Theme.surfaceElevated)
        .clipShape(.capsule)
    }

    private func toggleOption(
        label: String,
        selected: Bool,
        savings: String? = nil,
        action: @escaping () -> Void
    ) -> some View {
        Button {
            Haptics.light()
            withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                action()
            }
        } label: {
            HStack(spacing: 6) {
                Text(label)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(selected ? Theme.background : Theme.textSecondary)
                if let savings {
                    Text(savings)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(selected ? Theme.background : Theme.primary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(selected ? Theme.background.opacity(0.15) : Theme.primary.opacity(0.2))
                        .clipShape(.capsule)
                }
            }
            .padding(.vertical, 10)
            .padding(.horizontal, 20)
            .background(selected ? Theme.primary : Color.clear)
            .clipShape(.capsule)
        }
        .buttonStyle(.plain)
    }

    private var proCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                HStack(spacing: 4) {
                    Image(systemName: "gift.fill").font(.system(size: 11))
                    Text("10-day free trial").font(.system(size: 11, weight: .bold))
                }
                .foregroundStyle(Theme.premiumGold)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Theme.premiumGold.opacity(0.15))
                .clipShape(.capsule)

                Spacer()

                Text("MOST POPULAR")
                    .font(.system(size: 9, weight: .heavy))
                    .foregroundStyle(Theme.background)
                    .kerning(0.5)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Theme.primary)
                    .clipShape(.capsule)
            }
            .padding(.bottom, 12)

            Text(isAnnual ? "Billed annually" : "Billed monthly")
                .font(.system(size: 11))
                .foregroundStyle(Theme.textSecondary)

            Text(isAnnual ? "€34.99" : "€4.99")
                .font(.system(size: 34, weight: .heavy))
                .foregroundStyle(Theme.text)
                .contentTransition(.numericText())

            if isAnnual {
                HStack(spacing: 6) {
                    Text("€4.99/month")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.primary.opacity(0.7))
                        .strikethrough()
                    Text("€2.92/month")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(Theme.primary)
                    Text("Save 42%")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(Theme.background)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Theme.primary)
                        .clipShape(.capsule)
                }
                .padding(.top, 2)
            }

            Text("Unlock your full performance potential")
                .font(.system(size: 12))
                .foregroundStyle(Theme.textSecondary)
                .padding(.top, 4)
                .padding(.bottom, 14)

            Divider().overlay(Theme.border)

            VStack(alignment: .leading, spacing: 10) {
                ForEach(Self.proFeatures, id: \.self) { feature in
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(Theme.primary)
                            .padding(.top, 2)
                        Text(feature)
                            .font(.system(size: 13))
                            .foregroundStyle(Theme.text)
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 0)
                    }
                }
            }
            .padding(.vertical, 14)

            Button {
                startTrial()
            } label: {
                Text(profileStore.profile.isPremium ? "You're on Pro ✓" : "Start Free Trial")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Theme.background)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background {
                        LinearGradient(
                            colors: [Theme.primary, Theme.primaryDark],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    }
                    .clipShape(.rect(cornerRadius: 14))
            }
            .buttonStyle(PressableButtonStyle(scale: 0.98))
            .disabled(profileStore.profile.isPremium)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.surface)
        .clipShape(.rect(cornerRadius: 18))
        .overlay {
            RoundedRectangle(cornerRadius: 18)
                .stroke(
                    LinearGradient(
                        colors: [Theme.primary, Color(hex: "#1B9C4F")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 2
                )
        }
        .padding(.horizontal, 20)
    }

    private var freeCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("€0")
                .font(.system(size: 28, weight: .heavy))
                .foregroundStyle(Theme.text)
            Text("Enough for trying out FuelUp")
                .font(.system(size: 12))
                .foregroundStyle(Theme.textSecondary)
                .padding(.bottom, 16)

            VStack(alignment: .leading, spacing: 10) {
                ForEach(Self.freeFeatures, id: \.self) { feature in
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(Theme.textSecondary)
                            .padding(.top, 2)
                        Text(feature)
                            .font(.system(size: 13))
                            .foregroundStyle(Theme.textSecondary)
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 0)
                    }
                }
            }
            .padding(.bottom, 16)

            Text(profileStore.profile.isPremium ? "Free Plan" : "Current Plan")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Theme.textTertiary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Theme.surfaceElevated)
                .clipShape(.rect(cornerRadius: 12))
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.surface)
        .clipShape(.rect(cornerRadius: 18))
        .overlay {
            RoundedRectangle(cornerRadius: 18).stroke(Theme.border, lineWidth: 1)
        }
        .padding(.horizontal, 20)
    }

    private var legalText: some View {
        Text("Payment will be charged to your account after the trial period. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.")
            .font(.system(size: 10))
            .foregroundStyle(Theme.textTertiary)
            .multilineTextAlignment(.center)
            .padding(.horizontal, 30)
    }

    private func startTrial() {
        Haptics.success()
        profileStore.profile.isPremium = true
        dismiss()
    }
}
