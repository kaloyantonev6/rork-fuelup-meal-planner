//
//  OnboardingView.swift
//  FuelUp
//
//  Seven-step football onboarding that builds the player's fuel profile.
//

import SwiftUI

/// Draft values collected during onboarding before they are written to the profile.
private struct OnboardingDraft {
    var gender: Gender?
    var age: String = ""
    var height: String = ""
    var weight: String = ""
    var position: FootballPosition?
    var trainingFrequency: TrainingFrequency?
    var seasonPhase: SeasonPhase?
    var performanceGoal: PerformanceGoal?
    var dietType: DietType?
    var allergies: Set<Allergy> = []
    var cookingSkill: CookingSkill = .beginner
    var weeklySchedule: [DayType] = [.training, .training, .rest, .training, .training, .match, .recovery]
    var weeklyBudget: Int = 35
    var country: String = ""
}

struct OnboardingView: View {
    @Environment(ProfileStore.self) private var profileStore
    @Environment(BudgetStore.self) private var budgetStore

    private static let totalSteps = 7

    @State private var step = 0
    @State private var draft = OnboardingDraft()
    @State private var showCountryPicker = false
    @FocusState private var focusedField: Field?

    private enum Field: Hashable {
        case age, height, weight
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            progressBar

            ScrollView {
                stepContent
                    .padding(.horizontal, 24)
                    .padding(.top, 12)
                    .padding(.bottom, 20)
                    .id(step)
                    .transition(.asymmetric(
                        insertion: .move(edge: .trailing).combined(with: .opacity),
                        removal: .move(edge: .leading).combined(with: .opacity)
                    ))
            }
            .scrollDismissesKeyboard(.interactively)

            footer
        }
        .background(Theme.background)
        .preferredColorScheme(.dark)
        .sheet(isPresented: $showCountryPicker) {
            CountryPickerSheet(selected: draft.country) { country in
                draft.country = country
            }
        }
    }

    // MARK: - Chrome

    private var header: some View {
        HStack {
            if step > 0 {
                Button {
                    goBack()
                } label: {
                    Image(systemName: "arrow.left")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(Theme.text)
                        .frame(width: 44, height: 44)
                }
            } else {
                Color.clear.frame(width: 44, height: 44)
            }

            Spacer()
            Text("\(step + 1) of \(Self.totalSteps)")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Theme.textSecondary)
            Spacer()

            Color.clear.frame(width: 44, height: 44)
        }
        .padding(.horizontal, 16)
    }

    private var progressBar: some View {
        FuelProgressBar(
            progress: Double(step + 1) / Double(Self.totalSteps),
            height: 4
        )
        .padding(.horizontal, 20)
        .padding(.bottom, 8)
    }

    private var footer: some View {
        VStack(spacing: 0) {
            Divider().overlay(Theme.border)

            Button {
                if step == Self.totalSteps - 1 {
                    finish()
                } else {
                    goNext()
                }
            } label: {
                HStack(spacing: 8) {
                    if step == Self.totalSteps - 1 {
                        Image(systemName: "sparkles")
                            .font(.system(size: 17, weight: .semibold))
                        Text("Generate My Fuel Plan")
                            .font(.system(size: 17, weight: .bold))
                    } else {
                        Text(step == 0 ? "Get Started" : "Continue")
                            .font(.system(size: 16, weight: .bold))
                        Image(systemName: "arrow.right")
                            .font(.system(size: 16, weight: .semibold))
                    }
                }
                .foregroundStyle(canProceed ? Theme.background : Theme.textTertiary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(canProceed ? Theme.primary : Theme.surfaceElevated)
                .clipShape(.rect(cornerRadius: 16))
                .shadow(color: canProceed ? Theme.primary.opacity(0.25) : .clear, radius: 10, y: 4)
            }
            .buttonStyle(PressableButtonStyle(scale: 0.98))
            .disabled(!canProceed)
            .padding(.horizontal, 24)
            .padding(.top, 12)
        }
        .background(Theme.background)
    }

    // MARK: - Steps

    @ViewBuilder
    private var stepContent: some View {
        switch step {
        case 0: welcomeStep
        case 1: bodyStep
        case 2: footballStep
        case 3: seasonStep
        case 4: dietStep
        case 5: scheduleStep
        default: budgetStep
        }
    }

    private var welcomeStep: some View {
        VStack(spacing: 12) {
            Text("⚽")
                .font(.system(size: 64))
                .padding(.bottom, 8)
            Text("FuelUp")
                .font(.system(size: 36, weight: .heavy))
                .foregroundStyle(Theme.text)
            Text("AI nutrition built for footballers")
                .font(.system(size: 17))
                .foregroundStyle(Theme.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.bottom, 24)

            FuelCard(padding: 20, radius: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    featureLine("⚽", "Meal plans adapted to training & match days")
                    featureLine("🧠", "Learn why each meal fuels your performance")
                    featureLine("💪", "Built for performance, not weight loss")
                    featureLine("🏆", "Match day fueling timeline & recovery plans")
                }
            }
        }
        .padding(.top, 40)
        .frame(maxWidth: .infinity)
    }

    private func featureLine(_ icon: String, _ text: String) -> some View {
        HStack(spacing: 12) {
            Text(icon).font(.system(size: 20))
            Text(text)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(Theme.textSecondary)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(.vertical, 6)
    }

    private var bodyStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepTitle("Body Profile", "For calculating your fuel targets — not weight loss")

            VStack(alignment: .leading, spacing: 8) {
                Text("Gender").sectionLabelStyle()
                HStack(spacing: 8) {
                    ForEach(Gender.allCases) { gender in
                        OptionGridChip(
                            icon: gender.icon,
                            label: gender.label,
                            isSelected: draft.gender == gender
                        ) {
                            Haptics.light()
                            draft.gender = gender
                        }
                    }
                }
            }

            numberField("Age", placeholder: "e.g. 19", text: $draft.age, field: .age)

            HStack(spacing: 12) {
                numberField("Height (cm)", placeholder: "e.g. 178", text: $draft.height, field: .height)
                numberField("Weight (kg)", placeholder: "e.g. 72", text: $draft.weight, field: .weight)
            }
        }
    }

    private var footballStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepTitle("Your Football Profile", "So we can fuel the right position the right way")

            VStack(alignment: .leading, spacing: 8) {
                Text("Position").sectionLabelStyle()
                VStack(spacing: 8) {
                    ForEach(FootballPosition.allCases) { position in
                        OptionRowChip(
                            icon: position.icon,
                            label: position.label,
                            desc: position.desc,
                            isSelected: draft.position == position
                        ) {
                            Haptics.light()
                            draft.position = position
                        }
                    }
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Training Frequency").sectionLabelStyle()
                VStack(spacing: 8) {
                    ForEach(TrainingFrequency.allCases) { frequency in
                        OptionRowChip(
                            icon: frequency.icon,
                            label: frequency.label,
                            desc: frequency.desc,
                            isSelected: draft.trainingFrequency == frequency
                        ) {
                            Haptics.light()
                            draft.trainingFrequency = frequency
                        }
                    }
                }
            }
        }
    }

    private var seasonStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepTitle("Season & Goal", "Every option here is about performance, not the scale")

            VStack(alignment: .leading, spacing: 8) {
                Text("Current Season Phase").sectionLabelStyle()
                VStack(spacing: 8) {
                    ForEach(SeasonPhase.allCases) { phase in
                        OptionRowChip(
                            icon: phase.icon,
                            label: phase.label,
                            desc: phase.desc,
                            isSelected: draft.seasonPhase == phase
                        ) {
                            Haptics.light()
                            draft.seasonPhase = phase
                        }
                    }
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Performance Goal").sectionLabelStyle()
                VStack(spacing: 8) {
                    ForEach(PerformanceGoal.allCases) { goal in
                        OptionRowChip(
                            icon: goal.icon,
                            label: goal.label,
                            desc: goal.desc,
                            isSelected: draft.performanceGoal == goal
                        ) {
                            Haptics.light()
                            draft.performanceGoal = goal
                        }
                    }
                }
            }
        }
    }

    private var dietStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepTitle("Diet & Restrictions", "What you eat and what you avoid")

            VStack(alignment: .leading, spacing: 8) {
                Text("Diet Type").sectionLabelStyle()
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                    ForEach(DietType.allCases) { diet in
                        OptionGridChip(
                            icon: diet.icon,
                            label: diet.label,
                            isSelected: draft.dietType == diet
                        ) {
                            Haptics.light()
                            draft.dietType = diet
                        }
                    }
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Allergies & Restrictions").sectionLabelStyle()
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                    ForEach(Allergy.allCases) { allergy in
                        OptionGridChip(
                            icon: allergy.icon,
                            label: allergy.label,
                            isSelected: draft.allergies.contains(allergy)
                        ) {
                            toggleAllergy(allergy)
                        }
                    }
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Cooking Skill").sectionLabelStyle()
                VStack(spacing: 8) {
                    ForEach(CookingSkill.allCases) { skill in
                        OptionRowChip(
                            icon: skill.icon,
                            label: skill.label,
                            desc: skill.desc,
                            isSelected: draft.cookingSkill == skill
                        ) {
                            Haptics.light()
                            draft.cookingSkill = skill
                        }
                    }
                }
            }
        }
    }

    private var scheduleStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepTitle("Your Typical Week", "Tap each day to set its type — this shapes your fuel plan")

            VStack(spacing: 8) {
                ForEach(Array(Self.weekdayLabels.enumerated()), id: \.offset) { index, label in
                    let dayType = draft.weeklySchedule[index]
                    Button {
                        cycleDayType(at: index)
                    } label: {
                        HStack(spacing: 10) {
                            Text(label)
                                .font(.system(size: 16, weight: .bold))
                                .foregroundStyle(Theme.text)
                                .frame(width: 44, alignment: .leading)
                            Circle()
                                .fill(dayType.color)
                                .frame(width: 10, height: 10)
                            Text(dayType.shortLabel)
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(dayType.color)
                            Spacer()
                            Text(dayType.emoji)
                                .font(.system(size: 18))
                        }
                        .padding(14)
                        .background(dayType.color.opacity(0.12))
                        .clipShape(.rect(cornerRadius: 14))
                        .overlay {
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(dayType.color.opacity(0.4), lineWidth: 1.5)
                        }
                    }
                    .buttonStyle(PressableButtonStyle(scale: 0.99))
                }
            }

            FuelCard(radius: 14) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Day Types:").sectionLabelStyle().font(.system(size: 12, weight: .bold))
                    HStack(spacing: 16) {
                        ForEach(DayType.allCases) { type in
                            HStack(spacing: 6) {
                                Circle().fill(type.color).frame(width: 8, height: 8)
                                Text(type.shortLabel == "Match Day" ? "Match" : type.shortLabel)
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundStyle(Theme.textSecondary)
                            }
                        }
                    }
                    Text("Tap a day above to cycle through types")
                        .font(.system(size: 12).italic())
                        .foregroundStyle(Theme.textTertiary)
                }
            }
        }
    }

    private var budgetStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepTitle("Budget & Country", "For price comparison and local retailers")

            VStack(alignment: .leading, spacing: 8) {
                Text("Weekly Grocery Budget").sectionLabelStyle()
                FuelCard(padding: 20, radius: 16) {
                    VStack(spacing: 4) {
                        Text("€\(draft.weeklyBudget)/week")
                            .font(.system(size: 32, weight: .heavy))
                            .foregroundStyle(Theme.primary)
                        Text(String(format: "That's about €%.2f/day", Double(draft.weeklyBudget) / 7))
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.textSecondary)
                            .padding(.bottom, 12)

                        HStack(spacing: 12) {
                            stepperButton("−") {
                                draft.weeklyBudget = max(15, draft.weeklyBudget - 5)
                            }
                            FuelProgressBar(
                                progress: Double(draft.weeklyBudget - 15) / 65,
                                height: 8
                            )
                            stepperButton("+") {
                                draft.weeklyBudget = min(80, draft.weeklyBudget + 5)
                            }
                        }

                        HStack {
                            Text("€15")
                            Spacer()
                            Text("€80")
                        }
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Theme.textTertiary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Country").sectionLabelStyle()
                Button {
                    Haptics.light()
                    showCountryPicker = true
                } label: {
                    HStack {
                        if let country = Countries.option(named: draft.country) {
                            Text(country.flag).font(.system(size: 20))
                            Text(country.name)
                                .font(.system(size: 16))
                                .foregroundStyle(Theme.text)
                        } else {
                            Text("Select your country")
                                .font(.system(size: 16))
                                .foregroundStyle(Theme.textTertiary)
                        }
                        Spacer()
                        Image(systemName: "chevron.down")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(Theme.textTertiary)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)
                    .background(Theme.surfaceElevated)
                    .clipShape(.rect(cornerRadius: 14))
                    .overlay {
                        RoundedRectangle(cornerRadius: 14).stroke(Theme.border, lineWidth: 1.5)
                    }
                }
                .buttonStyle(PressableButtonStyle(scale: 0.99))
            }

            if draft.country.isEmpty {
                FuelCard(padding: 28, radius: 20) {
                    VStack(spacing: 10) {
                        Text("🇪🇺").font(.system(size: 48))
                        Text("27 EU Countries Supported")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundStyle(Theme.text)
                        Text("We'll show you local grocery prices so you can fuel up without breaking the bank.")
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.textSecondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                }
            } else {
                VStack(alignment: .leading, spacing: 6) {
                    Text("We'll show prices from \(draft.country) retailers")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Theme.primary)
                    Text(Countries.topRetailers(forCountryNamed: draft.country).joined(separator: ", "))
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Theme.text)
                }
                .padding(18)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Theme.primaryLight)
                .clipShape(.rect(cornerRadius: 16))
                .overlay {
                    RoundedRectangle(cornerRadius: 16).stroke(Theme.primary.opacity(0.3), lineWidth: 1)
                }
            }
        }
    }

    // MARK: - Building blocks

    private static let weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    private func stepTitle(_ title: String, _ subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 28, weight: .heavy))
                .foregroundStyle(Theme.text)
            Text(subtitle)
                .font(.system(size: 15))
                .foregroundStyle(Theme.textSecondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func numberField(
        _ label: String,
        placeholder: String,
        text: Binding<String>,
        field: Field
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label).sectionLabelStyle()
            TextField(placeholder, text: text)
                .keyboardType(.numberPad)
                .focused($focusedField, equals: field)
                .font(.system(size: 16))
                .foregroundStyle(Theme.text)
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .background(Theme.surfaceElevated)
                .clipShape(.rect(cornerRadius: 14))
                .overlay {
                    RoundedRectangle(cornerRadius: 14).stroke(Theme.border, lineWidth: 1.5)
                }
                .onChange(of: text.wrappedValue) { _, newValue in
                    let digits = newValue.filter(\.isNumber)
                    text.wrappedValue = String(digits.prefix(3))
                }
        }
        .frame(maxWidth: .infinity)
    }

    private func stepperButton(_ symbol: String, action: @escaping () -> Void) -> some View {
        Button {
            Haptics.light()
            action()
        } label: {
            Text(symbol)
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(Theme.primary)
                .frame(width: 44, height: 44)
                .background(Theme.surfaceElevated)
                .clipShape(.circle)
                .overlay {
                    Circle().stroke(Theme.border, lineWidth: 1.5)
                }
        }
        .buttonStyle(PressableButtonStyle())
    }

    // MARK: - Logic

    private var canProceed: Bool {
        switch step {
        case 0: true
        case 1:
            draft.gender != nil && !draft.age.isEmpty && !draft.height.isEmpty && !draft.weight.isEmpty
        case 2:
            draft.position != nil && draft.trainingFrequency != nil
        case 3:
            draft.seasonPhase != nil && draft.performanceGoal != nil
        case 4:
            draft.dietType != nil && !draft.allergies.isEmpty
        case 5:
            draft.weeklySchedule.count == 7
        default:
            !draft.country.isEmpty
        }
    }

    private func goNext() {
        guard step < Self.totalSteps - 1 else { return }
        Haptics.light()
        focusedField = nil
        withAnimation(.spring(response: 0.4, dampingFraction: 0.85)) {
            step += 1
        }
    }

    private func goBack() {
        guard step > 0 else { return }
        Haptics.light()
        focusedField = nil
        withAnimation(.spring(response: 0.4, dampingFraction: 0.85)) {
            step -= 1
        }
    }

    private func toggleAllergy(_ allergy: Allergy) {
        Haptics.light()
        if allergy == .none {
            draft.allergies = draft.allergies.contains(.none) ? [] : [.none]
            return
        }
        if draft.allergies.contains(.none) {
            draft.allergies = [allergy]
            return
        }
        if draft.allergies.contains(allergy) {
            draft.allergies.remove(allergy)
        } else {
            draft.allergies.insert(allergy)
        }
    }

    private func cycleDayType(at index: Int) {
        Haptics.light()
        let order: [DayType] = [.training, .match, .rest, .recovery]
        let current = draft.weeklySchedule[index]
        let currentIndex = order.firstIndex(of: current) ?? 0
        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
            draft.weeklySchedule[index] = order[(currentIndex + 1) % order.count]
        }
    }

    private func finish() {
        Haptics.success()

        var profile = profileStore.profile
        profile.gender = draft.gender ?? .other
        profile.age = Int(draft.age) ?? 18
        profile.height = Int(draft.height) ?? 170
        profile.weight = Int(draft.weight) ?? 70
        profile.position = draft.position ?? .centralMid
        profile.trainingFrequency = draft.trainingFrequency ?? .threeToFour
        profile.seasonPhase = draft.seasonPhase ?? .inSeason
        profile.performanceGoal = draft.performanceGoal ?? .general
        profile.dietType = draft.dietType ?? .balanced
        profile.allergies = draft.allergies.filter { $0 != .none }.sorted { $0.rawValue < $1.rawValue }
        profile.cookingSkill = draft.cookingSkill
        profile.weeklySchedule = draft.weeklySchedule
        profile.weeklyBudget = draft.weeklyBudget
        profile.country = draft.country

        profileStore.profile = profile
        budgetStore.syncBudget(with: draft.weeklyBudget)
        profileStore.completeOnboarding()
    }
}

/// Searchable EU country picker presented as a sheet.
struct CountryPickerSheet: View {
    let selected: String
    let onSelect: (String) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var search = ""

    private var filtered: [CountryOption] {
        guard !search.isEmpty else { return Countries.all }
        return Countries.all.filter {
            $0.name.localizedStandardContains(search)
        }
    }

    var body: some View {
        NavigationStack {
            List {
                ForEach(filtered) { country in
                    Button {
                        Haptics.light()
                        onSelect(country.name)
                        dismiss()
                    } label: {
                        HStack(spacing: 12) {
                            Text(country.flag).font(.system(size: 22))
                            Text(country.name)
                                .font(.system(size: 16))
                                .foregroundStyle(selected == country.name ? Theme.primary : Theme.text)
                            Spacer()
                            if selected == country.name {
                                Image(systemName: "checkmark")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundStyle(Theme.primary)
                            }
                        }
                    }
                    .listRowBackground(selected == country.name ? Theme.primaryLight : Theme.surface)
                }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .searchable(text: $search, prompt: "Search countries...")
            .navigationTitle("Select Country")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(Theme.primary)
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}
