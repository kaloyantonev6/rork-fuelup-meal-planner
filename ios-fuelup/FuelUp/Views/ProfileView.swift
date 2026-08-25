//
//  ProfileView.swift
//  FuelUp
//
//  Player profile with photo picker, football settings and app preferences.
//

import PhotosUI
import SwiftUI

struct ProfileView: View {
    @Environment(ProfileStore.self) private var profileStore
    @Environment(BudgetStore.self) private var budgetStore
    @Environment(NotificationService.self) private var notifications

    @State private var showPremium = false
    @State private var footballExpanded = false
    @State private var dietExpanded = false
    @State private var photoItem: PhotosPickerItem?
    @State private var editor: EditorField?
    @State private var showSignOutConfirm = false

    /// Fields that open a dedicated editor sheet.
    private enum EditorField: String, Identifiable {
        case name, age, weight, height
        case gender, position, trainingFrequency, seasonPhase, performanceGoal
        case dietType, cookingSkill, maxCookTime, allergies, kitchenEquipment, country

        var id: String { rawValue }

        var title: String {
            switch self {
            case .name: "Edit Name"
            case .age: "Edit Age"
            case .weight: "Edit Weight"
            case .height: "Edit Height"
            case .gender: "Gender"
            case .position: "Football Position"
            case .trainingFrequency: "Training Frequency"
            case .seasonPhase: "Season Phase"
            case .performanceGoal: "Performance Goal"
            case .dietType: "Diet Type"
            case .cookingSkill: "Cooking Skill"
            case .maxCookTime: "Max Cook Time"
            case .allergies: "Allergies"
            case .kitchenEquipment: "Kitchen Equipment"
            case .country: "Country"
            }
        }
    }

    private var profile: UserProfile { profileStore.profile }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    header

                    if !profile.isPremium {
                        premiumBanner
                    }

                    footballSection
                    dietSection
                    DailyTargetsCard(profile: profile, dayType: profileStore.todayDayType)
                    settingsSection
                    signOutButton

                    Text("FuelUp AI v1.0.0")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.textTertiary)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 32)
            }
            .background(Theme.background)
            .scrollIndicators(.hidden)
            .navigationTitle("Profile")
        }
        .sheet(isPresented: $showPremium) {
            PremiumView()
        }
        .sheet(item: $editor) { field in
            editorSheet(for: field)
        }
        .onChange(of: photoItem) { _, newItem in
            guard let newItem else { return }
            Task {
                if let data = try? await newItem.loadTransferable(type: Data.self) {
                    profileStore.saveProfileImage(data)
                    Haptics.success()
                }
            }
        }
        .confirmationDialog(
            "Sign out of FuelUp?",
            isPresented: $showSignOutConfirm,
            titleVisibility: .visible
        ) {
            Button("Sign Out", role: .destructive) {
                Haptics.medium()
                profileStore.signOut()
                notifications.cancelAll()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This clears your profile and returns you to onboarding.")
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(spacing: 8) {
            PhotosPicker(selection: $photoItem, matching: .images) {
                ZStack(alignment: .bottomTrailing) {
                    if let url = profileStore.profileImageURL,
                       let data = try? Data(contentsOf: url),
                       let image = UIImage(data: data) {
                        Image(uiImage: image)
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: 72, height: 72)
                            .clipShape(.circle)
                    } else {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [Color(hex: "#1B5E3A"), Color(hex: "#2D8B56")],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 72, height: 72)
                            .overlay {
                                Text("⚽").font(.system(size: 30))
                            }
                    }

                    Image(systemName: "camera.fill")
                        .font(.system(size: 11))
                        .foregroundStyle(Theme.background)
                        .frame(width: 26, height: 26)
                        .background(Theme.primary)
                        .clipShape(.circle)
                        .overlay {
                            Circle().stroke(Theme.background, lineWidth: 2)
                        }
                }
            }
            .buttonStyle(PressableButtonStyle())

            Text(profile.name.isEmpty ? "FuelUp Player" : profile.name)
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(Theme.text)

            Text("\(profile.position.icon) \(profile.position.label)")
                .font(.system(size: 14))
                .foregroundStyle(Theme.textSecondary)
        }
        .padding(.top, 8)
    }

    private var premiumBanner: some View {
        Button {
            Haptics.light()
            showPremium = true
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "crown.fill")
                    .font(.system(size: 20))
                    .foregroundStyle(.white)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Upgrade to Premium")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.white)
                    Text("From €2.92/month — unlock match day tools")
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.8))
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                }
                Spacer(minLength: 4)
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.7))
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background {
                LinearGradient(
                    colors: [Theme.premiumGold, Color(hex: "#B8862D")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            }
            .clipShape(.rect(cornerRadius: 16))
        }
        .buttonStyle(PressableButtonStyle())
    }

    // MARK: - Sections

    private var footballSection: some View {
        VStack(spacing: 10) {
            folderHeader(
                icon: "figure.australian.football",
                title: "Football Profile",
                subtitle: "Performance settings",
                isExpanded: footballExpanded
            ) {
                withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                    footballExpanded.toggle()
                }
            }

            if footballExpanded {
                VStack(spacing: 0) {
                    prefRow("Name", profile.name.isEmpty ? "Not set" : profile.name, "person.fill", Theme.primary) { editor = .name }
                    rowDivider
                    prefRow("Gender", profile.gender.label, "person.fill", Color(hex: "#8B5CF6")) { editor = .gender }
                    rowDivider
                    prefRow("Age", "\(profile.age) years", "flame.fill", Theme.error) { editor = .age }
                    rowDivider
                    prefRow("Weight", "\(profile.weight) kg", "scalemass.fill", Color(hex: "#6366F1")) { editor = .weight }
                    rowDivider
                    prefRow("Height", "\(profile.height) cm", "ruler.fill", Color(hex: "#8B5CF6")) { editor = .height }
                    rowDivider
                    prefRow("Position", profile.position.label, "figure.run", Theme.warning) { editor = .position }
                    rowDivider
                    prefRow("Training Frequency", profile.trainingFrequency.label, "bolt.fill", Theme.error) { editor = .trainingFrequency }
                    rowDivider
                    prefRow("Season Phase", profile.seasonPhase.label, "target", Theme.primary) { editor = .seasonPhase }
                    rowDivider
                    prefRow("Performance Goal", profile.performanceGoal.label, "target", Theme.primary) { editor = .performanceGoal }
                    rowDivider
                    prefRow("Country", profile.country.isEmpty ? "Not set" : profile.country, "mappin.and.ellipse", Theme.success) { editor = .country }
                }
                .background(Theme.surface)
                .clipShape(.rect(cornerRadius: 14))
                .overlay {
                    RoundedRectangle(cornerRadius: 14).stroke(Theme.border, lineWidth: 1)
                }
            }
        }
    }

    private var dietSection: some View {
        VStack(spacing: 10) {
            folderHeader(
                icon: "fork.knife",
                title: "Diet & Kitchen",
                subtitle: "Meal generation settings",
                isExpanded: dietExpanded
            ) {
                withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                    dietExpanded.toggle()
                }
            }

            if dietExpanded {
                VStack(spacing: 0) {
                    prefRow("Diet Type", profile.dietType.label, "leaf.fill", Theme.primary) { editor = .dietType }
                    rowDivider
                    prefRow("Cooking Skill", profile.cookingSkill.label, "frying.pan.fill", Theme.warning) { editor = .cookingSkill }
                    rowDivider
                    prefRow("Max Cook Time", profile.maxCookTime.label, "clock.fill", Color(hex: "#3B82F6")) { editor = .maxCookTime }
                    rowDivider

                    switchRow(
                        title: "No-Cook Only",
                        subtitle: "Assembly-only meals",
                        icon: "frying.pan.fill",
                        iconColor: Theme.success,
                        isOn: Binding(
                            get: { profile.noCookOnly },
                            set: { profileStore.profile.noCookOnly = $0 }
                        )
                    )
                    rowDivider
                    switchRow(
                        title: "Simple Meals Only",
                        subtitle: "Max 5 ingredients",
                        icon: "sparkles",
                        iconColor: Theme.premiumGold,
                        isOn: Binding(
                            get: { profile.maxFiveIngredients },
                            set: { profileStore.profile.maxFiveIngredients = $0 }
                        )
                    )
                    rowDivider
                    prefRow(
                        "Kitchen Equipment",
                        profile.kitchenEquipment.isEmpty
                            ? "Not set"
                            : profile.kitchenEquipment.map(\.label).joined(separator: ", "),
                        "wrench.and.screwdriver.fill",
                        Color(hex: "#64748B")
                    ) { editor = .kitchenEquipment }
                    rowDivider
                    prefRow(
                        "Allergies",
                        profile.allergies.isEmpty ? "None" : profile.allergies.map(\.label).joined(separator: ", "),
                        "exclamationmark.triangle.fill",
                        Theme.error
                    ) { editor = .allergies }
                }
                .background(Theme.surface)
                .clipShape(.rect(cornerRadius: 14))
                .overlay {
                    RoundedRectangle(cornerRadius: 14).stroke(Theme.border, lineWidth: 1)
                }
            }
        }
    }

    private var settingsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Settings")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(Theme.text)

            VStack(spacing: 0) {
                switchRow(
                    title: "Meal Reminders",
                    subtitle: "Get notified 15 min before each meal",
                    icon: "bell.fill",
                    iconColor: Theme.primary,
                    isOn: Binding(
                        get: { profile.mealRemindersEnabled },
                        set: { newValue in
                            Haptics.light()
                            profileStore.profile.mealRemindersEnabled = newValue
                            let updated = profileStore.profile
                            Task {
                                await notifications.reschedule(for: updated)
                            }
                        }
                    )
                )

                if notifications.authorizationDenied && profile.mealRemindersEnabled {
                    rowDivider
                    HStack(spacing: 10) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.warning)
                        Text("Notifications are turned off for FuelUp. Enable them in iOS Settings to get reminders.")
                            .font(.system(size: 12))
                            .foregroundStyle(Theme.textSecondary)
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 0)
                    }
                    .padding(14)
                }
            }
            .background(Theme.surface)
            .clipShape(.rect(cornerRadius: 14))
            .overlay {
                RoundedRectangle(cornerRadius: 14).stroke(Theme.border, lineWidth: 1)
            }
        }
    }

    private var signOutButton: some View {
        Button {
            Haptics.light()
            showSignOutConfirm = true
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "rectangle.portrait.and.arrow.right")
                    .font(.system(size: 15))
                Text("Sign Out")
                    .font(.system(size: 15, weight: .semibold))
            }
            .foregroundStyle(Theme.error)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(Theme.surface)
            .clipShape(.rect(cornerRadius: 14))
            .overlay {
                RoundedRectangle(cornerRadius: 14).stroke(Theme.error.opacity(0.35), lineWidth: 1)
            }
        }
        .buttonStyle(PressableButtonStyle(scale: 0.98))
    }

    // MARK: - Building blocks

    private var rowDivider: some View {
        Divider()
            .overlay(Theme.borderLight)
            .padding(.horizontal, 14)
    }

    private func folderHeader(
        icon: String,
        title: String,
        subtitle: String,
        isExpanded: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button {
            Haptics.light()
            action()
        } label: {
            HStack {
                HStack(spacing: 12) {
                    Image(systemName: icon)
                        .font(.system(size: 18))
                        .foregroundStyle(Theme.primary)
                        .frame(width: 40, height: 40)
                        .background(Theme.primaryLight)
                        .clipShape(.rect(cornerRadius: 12))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(title)
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(Theme.text)
                        Text(subtitle)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(Theme.textTertiary)
                    }
                }
                Spacer()
                Image(systemName: "chevron.down")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.textTertiary)
                    .rotationEffect(.degrees(isExpanded ? 180 : 0))
            }
            .padding(14)
            .background(Theme.surface)
            .clipShape(.rect(cornerRadius: 14))
            .overlay {
                RoundedRectangle(cornerRadius: 14).stroke(Theme.border, lineWidth: 1)
            }
        }
        .buttonStyle(PressableButtonStyle(scale: 0.995))
    }

    private func prefRow(
        _ label: String,
        _ value: String,
        _ icon: String,
        _ iconColor: Color,
        action: @escaping () -> Void
    ) -> some View {
        Button {
            Haptics.light()
            action()
        } label: {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 15))
                    .foregroundStyle(iconColor)
                    .frame(width: 34, height: 34)
                    .background(Theme.surfaceElevated)
                    .clipShape(.rect(cornerRadius: 10))

                VStack(alignment: .leading, spacing: 1) {
                    Text(label)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Theme.textSecondary)
                    Text(value)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Theme.text)
                        .lineLimit(1)
                        .multilineTextAlignment(.leading)
                }

                Spacer(minLength: 8)
                Image(systemName: "pencil")
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.textTertiary)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
    }

    private func switchRow(
        title: String,
        subtitle: String,
        icon: String,
        iconColor: Color,
        isOn: Binding<Bool>
    ) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 15))
                .foregroundStyle(iconColor)
                .frame(width: 34, height: 34)
                .background(Theme.surfaceElevated)
                .clipShape(.rect(cornerRadius: 10))

            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.text)
                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.textTertiary)
                    .lineLimit(2)
            }

            Spacer(minLength: 8)
            Toggle("", isOn: isOn)
                .labelsHidden()
                .tint(Theme.primary)
        }
        .padding(14)
    }

    // MARK: - Editors

    @ViewBuilder
    private func editorSheet(for field: EditorField) -> some View {
        switch field {
        case .name:
            TextEditorSheet(title: field.title, initial: profile.name, placeholder: "Your name", isNumeric: false) {
                profileStore.profile.name = $0
            }
        case .age:
            TextEditorSheet(title: field.title, initial: "\(profile.age)", placeholder: "e.g. 19", suffix: "years", isNumeric: true) {
                if let value = Int($0), value > 0 { profileStore.profile.age = value }
            }
        case .weight:
            TextEditorSheet(title: field.title, initial: "\(profile.weight)", placeholder: "e.g. 72", suffix: "kg", isNumeric: true) {
                if let value = Int($0), value > 0 { profileStore.profile.weight = value }
            }
        case .height:
            TextEditorSheet(title: field.title, initial: "\(profile.height)", placeholder: "e.g. 178", suffix: "cm", isNumeric: true) {
                if let value = Int($0), value > 0 { profileStore.profile.height = value }
            }
        case .gender:
            SingleSelectSheet(
                title: field.title,
                options: Gender.allCases.map { .init(id: $0.rawValue, icon: $0.icon, label: $0.label, desc: nil) },
                selectedID: profile.gender.rawValue
            ) { id in
                if let value = Gender(rawValue: id) { profileStore.profile.gender = value }
            }
        case .position:
            SingleSelectSheet(
                title: field.title,
                options: FootballPosition.allCases.map { .init(id: $0.rawValue, icon: $0.icon, label: $0.label, desc: $0.desc) },
                selectedID: profile.position.rawValue
            ) { id in
                if let value = FootballPosition(rawValue: id) { profileStore.profile.position = value }
            }
        case .trainingFrequency:
            SingleSelectSheet(
                title: field.title,
                options: TrainingFrequency.allCases.map { .init(id: $0.rawValue, icon: $0.icon, label: $0.label, desc: $0.desc) },
                selectedID: profile.trainingFrequency.rawValue
            ) { id in
                if let value = TrainingFrequency(rawValue: id) { profileStore.profile.trainingFrequency = value }
            }
        case .seasonPhase:
            SingleSelectSheet(
                title: field.title,
                options: SeasonPhase.allCases.map { .init(id: $0.rawValue, icon: $0.icon, label: $0.label, desc: $0.desc) },
                selectedID: profile.seasonPhase.rawValue
            ) { id in
                if let value = SeasonPhase(rawValue: id) { profileStore.profile.seasonPhase = value }
            }
        case .performanceGoal:
            SingleSelectSheet(
                title: field.title,
                options: PerformanceGoal.allCases.map { .init(id: $0.rawValue, icon: $0.icon, label: $0.label, desc: $0.desc) },
                selectedID: profile.performanceGoal.rawValue
            ) { id in
                if let value = PerformanceGoal(rawValue: id) { profileStore.profile.performanceGoal = value }
            }
        case .dietType:
            SingleSelectSheet(
                title: field.title,
                options: DietType.allCases.map { .init(id: $0.rawValue, icon: $0.icon, label: $0.label, desc: nil) },
                selectedID: profile.dietType.rawValue
            ) { id in
                if let value = DietType(rawValue: id) { profileStore.profile.dietType = value }
            }
        case .cookingSkill:
            SingleSelectSheet(
                title: field.title,
                options: CookingSkill.allCases.map { .init(id: $0.rawValue, icon: $0.icon, label: $0.label, desc: $0.desc) },
                selectedID: profile.cookingSkill.rawValue
            ) { id in
                if let value = CookingSkill(rawValue: id) { profileStore.profile.cookingSkill = value }
            }
        case .maxCookTime:
            SingleSelectSheet(
                title: field.title,
                options: CookTimeFilter.allCases.map { .init(id: $0.rawValue, icon: $0.icon, label: $0.label, desc: nil) },
                selectedID: profile.maxCookTime.rawValue
            ) { id in
                if let value = CookTimeFilter(rawValue: id) { profileStore.profile.maxCookTime = value }
            }
        case .allergies:
            MultiSelectSheet(
                title: field.title,
                options: Allergy.allCases.map { .init(id: $0.rawValue, icon: $0.icon, label: $0.label, desc: nil) },
                selectedIDs: Set(profile.allergies.map(\.rawValue)),
                exclusiveID: Allergy.none.rawValue
            ) { ids in
                profileStore.profile.allergies = Allergy.allCases
                    .filter { ids.contains($0.rawValue) && $0 != .none }
            }
        case .kitchenEquipment:
            MultiSelectSheet(
                title: field.title,
                options: KitchenEquipment.allCases.map { .init(id: $0.rawValue, icon: $0.icon, label: $0.label, desc: nil) },
                selectedIDs: Set(profile.kitchenEquipment.map(\.rawValue)),
                exclusiveID: nil
            ) { ids in
                profileStore.profile.kitchenEquipment = KitchenEquipment.allCases.filter { ids.contains($0.rawValue) }
            }
        case .country:
            CountryPickerSheet(selected: profile.country) { name in
                profileStore.profile.country = name
            }
        }
    }
}

// MARK: - Editor sheets

/// A generic option used by the select sheets.
nonisolated struct SelectOption: Identifiable, Sendable {
    let id: String
    let icon: String
    let label: String
    let desc: String?
}

private struct TextEditorSheet: View {
    let title: String
    let initial: String
    let placeholder: String
    var suffix: String?
    let isNumeric: Bool
    let onSave: (String) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var value = ""
    @FocusState private var focused: Bool

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                HStack {
                    TextField(placeholder, text: $value)
                        .keyboardType(isNumeric ? .numberPad : .default)
                        .focused($focused)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(Theme.text)
                        .padding(.vertical, 16)
                    if let suffix {
                        Text(suffix)
                            .font(.system(size: 16, weight: .medium))
                            .foregroundStyle(Theme.textSecondary)
                    }
                }
                .padding(.horizontal, 16)
                .background(Theme.surfaceElevated)
                .clipShape(.rect(cornerRadius: 14))
                .overlay {
                    RoundedRectangle(cornerRadius: 14).stroke(Theme.border, lineWidth: 1.5)
                }

                Button {
                    Haptics.light()
                    onSave(value.trimmingCharacters(in: .whitespaces))
                    dismiss()
                } label: {
                    Text("Save")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Theme.background)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Theme.primary)
                        .clipShape(.rect(cornerRadius: 14))
                }
                .buttonStyle(PressableButtonStyle(scale: 0.98))

                Spacer()
            }
            .padding(20)
            .background(Theme.background)
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark")
                            .foregroundStyle(Theme.textSecondary)
                    }
                }
            }
        }
        .presentationDetents([.height(240)])
        .preferredColorScheme(.dark)
        .onAppear {
            value = initial
            focused = true
        }
        .onChange(of: value) { _, newValue in
            guard isNumeric else { return }
            value = String(newValue.filter(\.isNumber).prefix(3))
        }
    }
}

private struct SingleSelectSheet: View {
    let title: String
    let options: [SelectOption]
    let selectedID: String
    let onSelect: (String) -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 8) {
                    ForEach(options) { option in
                        OptionRowChip(
                            icon: option.icon,
                            label: option.label,
                            desc: option.desc,
                            isSelected: option.id == selectedID
                        ) {
                            Haptics.light()
                            onSelect(option.id)
                            dismiss()
                        }
                    }
                }
                .padding(20)
            }
            .background(Theme.background)
            .scrollIndicators(.hidden)
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark")
                            .foregroundStyle(Theme.textSecondary)
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationContentInteraction(.scrolls)
        .preferredColorScheme(.dark)
    }
}

private struct MultiSelectSheet: View {
    let title: String
    let options: [SelectOption]
    let selectedIDs: Set<String>
    /// An option that clears all others when chosen, e.g. "None".
    let exclusiveID: String?
    let onDone: (Set<String>) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var selection: Set<String> = []

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                        ForEach(options) { option in
                            OptionGridChip(
                                icon: option.icon,
                                label: option.label,
                                isSelected: selection.contains(option.id)
                            ) {
                                toggle(option.id)
                            }
                        }
                    }

                    Button {
                        Haptics.light()
                        onDone(selection)
                        dismiss()
                    } label: {
                        Text("Done")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(Theme.background)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Theme.primary)
                            .clipShape(.rect(cornerRadius: 14))
                    }
                    .buttonStyle(PressableButtonStyle(scale: 0.98))
                }
                .padding(20)
            }
            .background(Theme.background)
            .scrollIndicators(.hidden)
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
        }
        .presentationDetents([.medium, .large])
        .presentationContentInteraction(.scrolls)
        .preferredColorScheme(.dark)
        .onAppear {
            selection = selectedIDs.isEmpty && exclusiveID != nil
                ? [exclusiveID!]
                : selectedIDs
        }
    }

    private func toggle(_ id: String) {
        Haptics.light()
        if let exclusiveID {
            if id == exclusiveID {
                selection = selection.contains(exclusiveID) ? [] : [exclusiveID]
                return
            }
            if selection.contains(exclusiveID) {
                selection = [id]
                return
            }
        }
        if selection.contains(id) {
            selection.remove(id)
        } else {
            selection.insert(id)
        }
    }
}
