//
//  HomeView.swift
//  FuelUp
//
//  The Fuel dashboard: completion ring, targets, day plan, hydration and tips.
//

import SwiftUI

struct HomeView: View {
    @Environment(ProfileStore.self) private var profileStore
    @Environment(DayProgressStore.self) private var progress

    @State private var showPremium = false
    @State private var showDayPlan = false
    @State private var mealsPerDay = 4
    @State private var showCookingPrefs = false
    @State private var isGenerating = false
    @State private var showGeneratedPlan = false
    @State private var didAppear = false

    private var profile: UserProfile { profileStore.profile }
    private var dayType: DayType { profileStore.todayDayType }

    private var totalSessions: Int {
        FuelTimeline.template(for: dayType).slots.count
    }

    private var fuelProgress: Double {
        totalSessions > 0 ? Double(progress.completedCount) / Double(totalSessions) : 0
    }

    private var tip: String {
        PerformanceTips.tip(for: Date())
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    header
                        .padding(.bottom, 4)

                    fuelProgressCard
                    fuelProfileCard
                    DailyTargetsCard(profile: profile, dayType: dayType)
                    dayFuelPlanCard
                    HydrationCard(profile: profile, dayType: dayType)
                    tipCard
                    mealsPerDaySection
                    cookingPrefsSection
                    generateSection
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 32)
                .opacity(didAppear ? 1 : 0)
                .offset(y: didAppear ? 0 : 24)
            }
            .background(Theme.background)
            .scrollIndicators(.hidden)
            .navigationDestination(isPresented: $showDayPlan) {
                DayFuelPlanView(dayType: dayType)
            }
        }
        .task {
            progress.refresh()
            withAnimation(.spring(response: 0.6, dampingFraction: 0.85)) {
                didAppear = true
            }
        }
        .sheet(isPresented: $showPremium) {
            PremiumView()
        }
        .sheet(isPresented: $showGeneratedPlan) {
            GeneratedPlanSheet(profile: profile, dayType: dayType, mealsPerDay: mealsPerDay)
        }
        .overlay {
            if isGenerating {
                GeneratingOverlay(tip: tip)
            }
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Fuel Your Game, \(profile.firstName) ⚽")
                .font(.system(size: 26, weight: .heavy))
                .foregroundStyle(.white)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: 8) {
                DayTypeBadge(dayType: dayType)

                if !profile.isPremium {
                    Button {
                        Haptics.light()
                        showPremium = true
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "crown.fill")
                                .font(.system(size: 11))
                                .foregroundStyle(Theme.premiumGold)
                            Text("PRO")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(Theme.premiumGoldLight)
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.white.opacity(0.12))
                        .clipShape(.capsule)
                        .overlay {
                            Capsule().stroke(Theme.premiumGold.opacity(0.35), lineWidth: 1)
                        }
                    }
                    .buttonStyle(PressableButtonStyle())
                }
                Spacer(minLength: 0)
            }
            .padding(.top, 8)

            Text(dayType.subtitle)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(.white.opacity(0.7))
                .padding(.top, 6)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.top, 16)
        .padding(.bottom, 20)
        .background {
            LinearGradient(
                colors: [Color(hex: "#0D2B1F"), Color(hex: "#0F3D2A"), Color(hex: "#156042")],
                startPoint: .top,
                endPoint: .bottom
            )
        }
        .clipShape(.rect(cornerRadius: 20))
        .padding(.horizontal, -20)
        .padding(.top, -8)
    }

    // MARK: - Cards

    private var fuelProgressCard: some View {
        Button {
            Haptics.light()
            showDayPlan = true
        } label: {
            HStack(alignment: .center, spacing: 14) {
                ZStack {
                    FuelProgressRing(progress: fuelProgress, color: dayType.color)
                    VStack(spacing: 2) {
                        Text("\(Int((fuelProgress * 100).rounded()))%")
                            .font(.system(size: 20, weight: .heavy))
                            .foregroundStyle(dayType.color)
                            .monospacedDigit()
                            .contentTransition(.numericText())
                            .animation(
                                .spring(response: 0.6, dampingFraction: 0.8),
                                value: Int((fuelProgress * 100).rounded())
                            )
                        Text("\(progress.completedCount)/\(totalSessions) meals")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(Theme.textSecondary)
                            .monospacedDigit()
                            .contentTransition(.numericText())
                            .animation(
                                .spring(response: 0.5, dampingFraction: 0.85),
                                value: progress.completedCount
                            )
                    }
                }

                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text("Today's Fuel")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(Theme.text)
                        Spacer(minLength: 4)
                        DayTypeBadge(dayType: dayType, compact: true)
                    }

                    Text(progressMessage)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Theme.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                        .multilineTextAlignment(.leading)

                    HStack(spacing: 3) {
                        Text("Open day fuel plan")
                            .font(.system(size: 12, weight: .bold))
                        Image(systemName: "chevron.right")
                            .font(.system(size: 10, weight: .bold))
                    }
                    .foregroundStyle(dayType.color)
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.surface)
            .clipShape(.rect(cornerRadius: 18))
            .overlay {
                RoundedRectangle(cornerRadius: 18).stroke(Theme.border, lineWidth: 1.5)
            }
        }
        .buttonStyle(PressableButtonStyle(scale: 0.99, opacity: 0.92))
    }

    private var progressMessage: String {
        if progress.completedCount >= totalSessions && totalSessions > 0 {
            return "All fuel sessions complete. Recovery on point! 💪"
        }
        if progress.completedCount > 0 {
            let remaining = totalSessions - progress.completedCount
            return "\(remaining) more fuel session\(remaining == 1 ? "" : "s") to go today."
        }
        return "Mark off meals as you fuel up throughout the day."
    }

    private var fuelProfileCard: some View {
        FuelCard(padding: 14, radius: 16) {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text("Your Fuel Profile").sectionLabelStyle()
                    Spacer()
                }

                ScrollView(.horizontal) {
                    HStack(spacing: 6) {
                        InfoPill(text: "\(profile.position.icon) \(profile.position.label)")
                        pillDot
                        InfoPill(text: "\(profile.dietType.icon) \(profile.dietType.label)")
                        pillDot
                        InfoPill(text: "💰 €\(profile.weeklyBudget)/wk")
                        if !profile.country.isEmpty {
                            pillDot
                            InfoPill(text: "📍 \(profile.country)")
                        }
                    }
                }
                .scrollIndicators(.hidden)
            }
        }
    }

    private var pillDot: some View {
        Circle()
            .fill(Theme.textTertiary)
            .frame(width: 3, height: 3)
    }

    private var dayFuelPlanCard: some View {
        Button {
            Haptics.light()
            showDayPlan = true
        } label: {
            HStack(spacing: 14) {
                Image(systemName: dayType.symbol)
                    .font(.system(size: 20))
                    .foregroundStyle(dayType.color)
                    .frame(width: 48, height: 48)
                    .background(dayType.color.opacity(0.15))
                    .clipShape(.rect(cornerRadius: 14))

                VStack(alignment: .leading, spacing: 3) {
                    Text("\(dayType == .recovery ? "🟡" : "⚽") \(dayType.planTitle)")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Theme.text)
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                    Text(dayType.planSubtitle)
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.textSecondary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                }

                Spacer(minLength: 4)
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.textSecondary)
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background {
                LinearGradient(
                    colors: dayType.cardGradient,
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            }
            .clipShape(.rect(cornerRadius: 18))
            .overlay {
                RoundedRectangle(cornerRadius: 18)
                    .stroke(dayType.color.opacity(0.25), lineWidth: 1.5)
            }
        }
        .buttonStyle(PressableButtonStyle(scale: 0.98))
    }

    private var tipCard: some View {
        FuelCard(radius: 16) {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.premiumGold)
                    Text("Performance Tip")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Theme.premiumGold)
                        .textCase(.uppercase)
                        .kerning(0.5)
                }
                Text(tip)
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private var mealsPerDaySection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Meals per day").sectionLabelStyle()
            Text("Training & match days include a post-session snack")
                .font(.system(size: 12))
                .foregroundStyle(Theme.textTertiary)

            HStack(spacing: 8) {
                ForEach([3, 4, 5], id: \.self) { count in
                    Button {
                        Haptics.light()
                        mealsPerDay = count
                    } label: {
                        Text("\(count)")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(mealsPerDay == count ? Theme.background : Theme.text)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(mealsPerDay == count ? Theme.primary : Theme.surface)
                            .clipShape(.rect(cornerRadius: 12))
                            .overlay {
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(mealsPerDay == count ? Theme.primary : Theme.border, lineWidth: 1.5)
                            }
                    }
                    .buttonStyle(PressableButtonStyle())
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var cookingPrefsSection: some View {
        VStack(spacing: 10) {
            Button {
                Haptics.light()
                withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                    showCookingPrefs.toggle()
                }
            } label: {
                HStack {
                    HStack(spacing: 10) {
                        Image(systemName: "frying.pan.fill")
                            .font(.system(size: 16))
                            .foregroundStyle(Theme.primary)
                        Text("Cooking Preferences")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Theme.text)
                    }
                    Spacer()
                    HStack(spacing: 6) {
                        if profile.maxCookTime != .any {
                            activeChip(profile.maxCookTime.label)
                        }
                        if profile.noCookOnly {
                            activeChip("No-Cook")
                        }
                        if profile.maxFiveIngredients {
                            activeChip("5 Ing.")
                        }
                        Image(systemName: "chevron.down")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(Theme.textTertiary)
                            .rotationEffect(.degrees(showCookingPrefs ? 180 : 0))
                    }
                }
                .padding(14)
                .background(Theme.surface)
                .clipShape(.rect(cornerRadius: 14))
                .overlay {
                    RoundedRectangle(cornerRadius: 14).stroke(Theme.border, lineWidth: 1)
                }
            }
            .buttonStyle(PressableButtonStyle(scale: 0.995))

            if showCookingPrefs {
                FuelCard(radius: 14) {
                    VStack(alignment: .leading, spacing: 16) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Max Cook Time").sectionLabelStyle().font(.system(size: 12, weight: .bold))
                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                                ForEach(CookTimeFilter.allCases) { option in
                                    OptionGridChip(
                                        icon: option.icon,
                                        label: option.label,
                                        isSelected: profile.maxCookTime == option
                                    ) {
                                        Haptics.light()
                                        profileStore.profile.maxCookTime = option
                                    }
                                }
                            }
                        }

                        toggleRow(
                            title: "No-Cook Only",
                            subtitle: "Assembly-only meals",
                            isOn: Binding(
                                get: { profile.noCookOnly },
                                set: { profileStore.profile.noCookOnly = $0 }
                            )
                        )

                        toggleRow(
                            title: "Simple meals only",
                            subtitle: "Max 5 ingredients — less shopping",
                            isOn: Binding(
                                get: { profile.maxFiveIngredients },
                                set: { profileStore.profile.maxFiveIngredients = $0 }
                            )
                        )
                    }
                }
            }
        }
    }

    private func activeChip(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 11, weight: .bold))
            .foregroundStyle(Theme.primary)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(Theme.primaryLight)
            .clipShape(.capsule)
    }

    private func toggleRow(title: String, subtitle: String, isOn: Binding<Bool>) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.text)
                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.textTertiary)
            }
            Spacer()
            Toggle("", isOn: isOn)
                .labelsHidden()
                .tint(Theme.primary)
        }
    }

    private var generateSection: some View {
        VStack(spacing: 12) {
            Button {
                generate(weekly: false)
            } label: {
                generateCard(
                    icon: "bolt.fill",
                    title: "Generate Today's Fuel",
                    subtitle: "Match-day aware daily meal plan",
                    badge: .free,
                    gradient: [Theme.primary, Theme.primaryDark],
                    foreground: Theme.background
                )
            }
            .buttonStyle(PressableButtonStyle())

            Button {
                generate(weekly: true)
            } label: {
                generateCard(
                    icon: "calendar",
                    title: "Generate Weekly Plan",
                    subtitle: "7-day plan by training schedule",
                    badge: .pro,
                    gradient: [Color(hex: "#0f766e"), Color(hex: "#115e59")],
                    foreground: .white
                )
            }
            .buttonStyle(PressableButtonStyle())
        }
    }

    private enum GenerateBadge {
        case free, pro
    }

    private func generateCard(
        icon: String,
        title: String,
        subtitle: String,
        badge: GenerateBadge,
        gradient: [Color],
        foreground: Color
    ) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 22, weight: .semibold))
                .foregroundStyle(foreground)
                .frame(width: 48, height: 48)
                .background(foreground.opacity(0.15))
                .clipShape(.rect(cornerRadius: 14))

            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(title)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(foreground)
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                    switch badge {
                    case .free:
                        Text("FREE")
                            .font(.system(size: 9, weight: .heavy))
                            .foregroundStyle(foreground)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(foreground.opacity(0.2))
                            .clipShape(.capsule)
                    case .pro:
                        HStack(spacing: 3) {
                            Image(systemName: "crown.fill").font(.system(size: 8))
                            Text("PRO").font(.system(size: 9, weight: .heavy))
                        }
                        .foregroundStyle(Theme.premiumGold)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.white.opacity(0.15))
                        .clipShape(.capsule)
                    }
                }
                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundStyle(foreground.opacity(0.75))
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)
            }

            Spacer(minLength: 4)
            Image(systemName: "chevron.right")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(foreground.opacity(0.5))
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background {
            LinearGradient(colors: gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
        }
        .clipShape(.rect(cornerRadius: 18))
    }

    private func generate(weekly: Bool) {
        if weekly && !profile.isPremium {
            Haptics.warning()
            showPremium = true
            return
        }

        Haptics.medium()
        isGenerating = true

        Task {
            try? await Task.sleep(for: .milliseconds(1600))
            isGenerating = false
            Haptics.success()
            showGeneratedPlan = true
        }
    }
}

/// Full-screen loading overlay shown while a plan is being built.
private struct GeneratingOverlay: View {
    let tip: String
    @State private var pulse = false

    var body: some View {
        ZStack {
            Color.black.opacity(0.7).ignoresSafeArea()

            VStack(spacing: 16) {
                ProgressView()
                    .controlSize(.large)
                    .tint(Theme.primary)
                    .frame(width: 64, height: 64)
                    .background(Theme.primaryLight)
                    .clipShape(.circle)

                Text("Building your fuel plan...")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(Theme.text)

                Text(tip)
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.textSecondary)
                    .multilineTextAlignment(.center)
            }
            .padding(28)
            .frame(maxWidth: 320)
            .background(Theme.surface)
            .clipShape(.rect(cornerRadius: 20))
            .overlay {
                RoundedRectangle(cornerRadius: 20).stroke(Theme.primary.opacity(0.25), lineWidth: 1)
            }
            .scaleEffect(pulse ? 1.03 : 1)
            .animation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true), value: pulse)
        }
        .onAppear { pulse = true }
    }
}
