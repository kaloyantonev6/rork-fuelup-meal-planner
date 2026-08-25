//
//  DayFuelPlanView.swift
//  FuelUp
//
//  The day's fueling timeline with completion tracking and celebrations.
//

import SwiftUI

struct DayFuelPlanView: View {
    let dayType: DayType

    @Environment(ProfileStore.self) private var profileStore
    @Environment(DayProgressStore.self) private var progress
    @Environment(NotificationService.self) private var notifications
    @Environment(\.dismiss) private var dismiss

    @State private var sessionTime = ""
    @State private var showTimePicker = false
    @State private var celebration: Celebration?
    @State private var didAppear = false

    private struct Celebration: Identifiable {
        let id = UUID()
        let title: String
        let body: String
    }

    private var profile: UserProfile { profileStore.profile }
    private var template: TimelineTemplate { FuelTimeline.template(for: dayType) }

    private var timeline: [TimelineEntry] {
        FuelTimeline.generate(sessionTime: effectiveSessionTime, template: template)
    }

    private var effectiveSessionTime: String {
        sessionTime.isEmpty ? profile.sessionTime(for: dayType) : sessionTime
    }

    private var activeIndex: Int {
        FuelTimeline.activeIndex(template: template, sessionTime: effectiveSessionTime)
    }

    private var targets: DayTargets {
        NutritionEngine.dayTargets(profile: profile, dayType: dayType)
    }

    private var plannedCalories: Int {
        timeline.reduce(0) { $0 + Int((Double(targets.calories) * $1.caloriePct).rounded()) }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                header
                timelineSection
                summaryCard
                hydrationNote
            }
            .padding(.bottom, 32)
            .opacity(didAppear ? 1 : 0)
        }
        .background(Theme.background)
        .scrollIndicators(.hidden)
        .navigationTitle(dayType.planTitle)
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(dayType.headerGradient.first ?? Theme.background, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .task {
            sessionTime = profile.sessionTime(for: dayType)
            progress.refresh()
            withAnimation(.easeOut(duration: 0.4)) {
                didAppear = true
            }
        }
        .sheet(isPresented: $showTimePicker) {
            SessionTimePicker(
                dayType: dayType,
                initialTime: effectiveSessionTime
            ) { newTime in
                saveSessionTime(newTime)
            }
        }
        .alert(celebration?.title ?? "", isPresented: .constant(celebration != nil)) {
            Button("Keep tracking") {
                Haptics.light()
                celebration = nil
            }
        } message: {
            Text(celebration?.body ?? "")
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(spacing: 14) {
            HStack {
                HStack(spacing: 14) {
                    Image(systemName: dayType.symbol)
                        .font(.system(size: 20))
                        .foregroundStyle(dayType.color)
                        .frame(width: 44, height: 44)
                        .background(dayType.color.opacity(0.2))
                        .clipShape(.rect(cornerRadius: 12))

                    VStack(alignment: .leading, spacing: 0) {
                        Text(dayType.sessionLabel)
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.white.opacity(0.6))
                            .kerning(1)
                        Text(effectiveSessionTime)
                            .font(.system(size: 28, weight: .heavy))
                            .foregroundStyle(.white)
                    }
                }

                Spacer()

                if dayType.hasEditableSession {
                    Button {
                        Haptics.light()
                        showTimePicker = true
                    } label: {
                        HStack(spacing: 5) {
                            Image(systemName: "pencil")
                                .font(.system(size: 12, weight: .bold))
                            Text("Edit")
                                .font(.system(size: 13, weight: .bold))
                        }
                        .foregroundStyle(Theme.primary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Theme.primary.opacity(0.15))
                        .clipShape(.rect(cornerRadius: 12))
                        .overlay {
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Theme.primary.opacity(0.4), lineWidth: 1)
                        }
                    }
                    .buttonStyle(PressableButtonStyle())
                }
            }
            .padding(16)
            .background(Color.white.opacity(0.08))
            .clipShape(.rect(cornerRadius: 16))
            .overlay {
                RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.12), lineWidth: 1)
            }

            HStack(spacing: 0) {
                VStack(spacing: 2) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(dayType.accentColor)
                    Text("\(targets.calories)")
                        .font(.system(size: 18, weight: .heavy))
                        .foregroundStyle(.white)
                    Text("kcal target")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.5))
                        .textCase(.uppercase)
                }
                .frame(maxWidth: .infinity)

                divider

                VStack(spacing: 2) {
                    Text("\(targets.protein)g P")
                    Text("\(targets.carbs)g C")
                    Text("\(targets.fat)g F")
                }
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)

                divider

                VStack(spacing: 2) {
                    HStack(spacing: 0) {
                        Text("\(progress.completedCount)")
                            .font(.system(size: 18, weight: .heavy))
                            .foregroundStyle(Theme.primary)
                        Text("/\(timeline.count)")
                            .font(.system(size: 14, weight: .heavy))
                            .foregroundStyle(Theme.textTertiary)
                    }
                    Text("fuel points")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.5))
                        .textCase(.uppercase)
                }
                .frame(maxWidth: .infinity)
            }
            .padding(.vertical, 12)
            .padding(.horizontal, 16)
            .background(Color.white.opacity(0.06))
            .clipShape(.rect(cornerRadius: 14))

            if dayType != profileStore.todayDayType {
                Text("Today is a \(profileStore.todayDayType.shortLabel.lowercased()) day. You are planning a \(dayType.shortLabel.lowercased()) day.")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Theme.recovery)
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Theme.recovery.opacity(0.12))
                    .clipShape(.rect(cornerRadius: 12))
                    .overlay {
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Theme.recovery.opacity(0.3), lineWidth: 1)
                    }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 20)
        .background {
            LinearGradient(colors: dayType.headerGradient, startPoint: .top, endPoint: .bottom)
        }
    }

    private var divider: some View {
        Rectangle()
            .fill(Color.white.opacity(0.12))
            .frame(width: 1, height: 30)
    }

    // MARK: - Timeline

    private var timelineSection: some View {
        VStack(spacing: 0) {
            ForEach(timeline) { entry in
                TimelineRow(
                    entry: entry,
                    isFirst: entry.index == 0,
                    isLast: entry.index == timeline.count - 1,
                    isActive: entry.index == activeIndex,
                    isPast: entry.index < activeIndex,
                    isCompleted: progress.isCompleted(entry.index),
                    calories: Int((Double(targets.calories) * entry.caloriePct).rounded()),
                    accentColor: dayType.accentColor
                ) {
                    toggle(entry)
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 20)
    }

    private var summaryCard: some View {
        FuelCard(padding: 18, radius: 16) {
            VStack(alignment: .leading, spacing: 14) {
                Text("Daily Fuel Summary").sectionLabelStyle().font(.system(size: 14, weight: .bold))

                HStack {
                    summaryItem("\(plannedCalories)", "planned kcal", Theme.text)
                    Spacer()
                    summaryItem("\(targets.calories)", "target kcal", Theme.text)
                    Spacer()
                    let coverage = targets.calories > 0
                        ? Int((Double(plannedCalories) / Double(targets.calories) * 100).rounded())
                        : 0
                    summaryItem("\(coverage)%", "coverage", Theme.primary)
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
    }

    private func summaryItem(_ value: String, _ label: String, _ color: Color) -> some View {
        VStack(spacing: 3) {
            Text(value)
                .font(.system(size: 22, weight: .heavy))
                .foregroundStyle(color)
            Text(label)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(Theme.textTertiary)
        }
    }

    private var hydrationNote: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "drop.fill")
                .font(.system(size: 16))
                .foregroundStyle(Theme.primary)
            VStack(alignment: .leading, spacing: 4) {
                Text("\(dayType.sessionName) Hydration")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(Theme.primary)
                Text(template.hydrationNote)
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.primary.opacity(0.1))
        .clipShape(.rect(cornerRadius: 14))
        .overlay {
            RoundedRectangle(cornerRadius: 14).stroke(Theme.primary.opacity(0.3), lineWidth: 1)
        }
        .padding(.horizontal, 20)
        .padding(.top, 16)
    }

    // MARK: - Actions

    private func toggle(_ entry: TimelineEntry) {
        Haptics.light()
        let didComplete = withAnimation(.spring(response: 0.35, dampingFraction: 0.6)) {
            progress.toggle(entry.index)
        }
        guard didComplete else { return }

        Haptics.success()
        celebration = makeCelebration(for: entry.index)
    }

    /// Build the celebration copy. Only the final session gets the "last fuel
    /// session" message; everything else points at the next one.
    private func makeCelebration(for index: Int) -> Celebration {
        let name = profile.celebrationName
        let entries = timeline

        if index == entries.count - 1 {
            return Celebration(
                title: "Well done, \(name)! 🎉",
                body: "That was your last fuel session of the day. Recovery starts now — rest up and refuel for tomorrow!"
            )
        }

        let nextEntry = entries.first { $0.index > index && !progress.isCompleted($0.index) }

        guard let nextEntry else {
            return Celebration(
                title: "You're on fire, \(name)! 🔥",
                body: "All remaining fuel sessions are already checked off. You're ahead of the game today!"
            )
        }

        let fraction = entries.count > 1 ? Double(index) / Double(entries.count - 1) : 0
        let title: String
        if fraction < 0.35 {
            title = "Great start, \(name)! 🚀"
        } else if fraction < 0.7 {
            title = "Keep it up, \(name)! 💪"
        } else {
            title = "Strong finish, \(name)! 🔥"
        }

        let body: String
        if let date = FuelTimeline.date(
            forEntryAt: nextEntry.index,
            template: template,
            sessionTime: effectiveSessionTime
        ) {
            let phrase = FuelTimeline.formatDuration(date.timeIntervalSinceNow)
            body = "Your next fuel session, \(nextEntry.label), is \(phrase). Keep it up and see you there!"
        } else {
            body = "Your next fuel session, \(nextEntry.label), is coming up. Keep it up and see you there!"
        }

        return Celebration(title: title, body: body)
    }

    private func saveSessionTime(_ newTime: String) {
        Haptics.light()
        sessionTime = newTime
        switch dayType {
        case .match:
            profileStore.profile.defaultKickoffTime = newTime
        case .training:
            profileStore.profile.defaultTrainingTime = newTime
        case .rest, .recovery:
            break
        }

        let profile = profileStore.profile
        Task {
            await notifications.reschedule(for: profile)
        }
    }
}

// MARK: - Timeline row

private struct TimelineRow: View {
    let entry: TimelineEntry
    let isFirst: Bool
    let isLast: Bool
    let isActive: Bool
    let isPast: Bool
    let isCompleted: Bool
    let calories: Int
    let accentColor: Color
    let onTap: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            rail
            card
        }
    }

    private var rail: some View {
        VStack(spacing: 0) {
            Rectangle()
                .fill(isPast ? Theme.primary.opacity(0.4) : Theme.border)
                .frame(width: 2, height: 16)
                .opacity(isFirst ? 0 : 1)

            node

            Rectangle()
                .fill(isPast || isActive ? Theme.primary.opacity(0.4) : Theme.border)
                .frame(width: 2)
                .frame(maxHeight: .infinity)
                .opacity(isLast ? 0 : 1)
        }
        .frame(width: 32)
    }

    private var node: some View {
        ZStack {
            Circle()
                .fill(nodeFill)
                .frame(width: 28, height: 28)
                .overlay {
                    Circle().stroke(nodeStroke, lineWidth: nodeStrokeWidth)
                }
                .shadow(
                    color: (isActive || isCompleted) ? Theme.primary.opacity(0.5) : .clear,
                    radius: 8
                )

            if isCompleted {
                Image(systemName: "checkmark")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(Theme.background)
                    .transition(.scale.combined(with: .opacity))
            } else if isActive {
                Circle()
                    .fill(Theme.background)
                    .frame(width: 8, height: 8)
            }
        }
    }

    private var nodeFill: Color {
        if isCompleted || isActive { return Theme.primary }
        if isPast { return Theme.primary.opacity(0.4) }
        return Theme.surfaceElevated
    }

    private var nodeStroke: Color {
        (isCompleted || isActive || isPast) ? .clear : Theme.primary.opacity(0.5)
    }

    private var nodeStrokeWidth: CGFloat {
        (isCompleted || isActive || isPast) ? 0 : 2
    }

    private var card: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    HStack(spacing: 6) {
                        Image(systemName: "clock")
                            .font(.system(size: 12))
                            .foregroundStyle(isActive ? Theme.primary : Theme.textTertiary)
                        Text(entry.timeLabel)
                            .font(.system(size: 15, weight: .heavy))
                            .foregroundStyle(timeColor)
                        Text(entry.offsetLabel)
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(Theme.textTertiary)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 1)
                            .background(Theme.surfaceElevated)
                            .clipShape(.rect(cornerRadius: 6))
                    }
                    Spacer(minLength: 4)
                    HStack(spacing: 10) {
                        Text(entry.mealSlot.icon)
                            .font(.system(size: 22))
                        AnimatedCheckbox(isChecked: isCompleted)
                    }
                }

                Text(entry.label)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(labelColor)
                    .multilineTextAlignment(.leading)

                Text(entry.description)
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
                    .multilineTextAlignment(.leading)

                HStack(alignment: .center, spacing: 8) {
                    HStack(spacing: 4) {
                        Image(systemName: calories > 0 ? "flame.fill" : "drop.fill")
                            .font(.system(size: 11))
                            .foregroundStyle(calories > 0 ? accentColor : Theme.primary)
                        Text(calories > 0 ? "~\(calories) kcal" : "0 kcal")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(Theme.text)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Theme.surfaceElevated)
                    .clipShape(.rect(cornerRadius: 8))

                    Spacer(minLength: 4)

                    Text(isCompleted ? "Completed ✓" : entry.example)
                        .font(.system(size: 12).italic())
                        .foregroundStyle(isCompleted ? Theme.primary : Theme.textTertiary)
                        .multilineTextAlignment(.trailing)
                        .lineLimit(2)
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(cardBackground)
            .clipShape(.rect(cornerRadius: 14))
            .overlay {
                RoundedRectangle(cornerRadius: 14).stroke(cardBorder, lineWidth: 1)
            }
            .opacity(isPast && !isCompleted ? 0.6 : 1)
        }
        .buttonStyle(PressableButtonStyle(scale: 0.995, opacity: 0.92))
        .padding(.bottom, 10)
    }

    private var timeColor: Color {
        if isCompleted || isActive { return Theme.primary }
        if isPast { return Theme.textTertiary }
        return Theme.text
    }

    private var labelColor: Color {
        if isCompleted || isActive { return Theme.primary }
        if isPast { return Theme.textSecondary }
        return Theme.text
    }

    private var cardBackground: Color {
        if isCompleted { return Theme.primary.opacity(0.08) }
        if isActive { return Theme.primaryLight }
        return Theme.surface
    }

    private var cardBorder: Color {
        if isCompleted { return Theme.primary.opacity(0.4) }
        if isActive { return Theme.primary }
        return Theme.border
    }
}

/// Spring-animated circular checkbox.
private struct AnimatedCheckbox: View {
    let isChecked: Bool

    var body: some View {
        ZStack {
            Circle()
                .fill(isChecked ? Theme.primary : Theme.surfaceElevated)
                .frame(width: 24, height: 24)
                .overlay {
                    Circle().stroke(
                        isChecked ? Theme.primary : Theme.primary.opacity(0.5),
                        lineWidth: 2
                    )
                }

            Image(systemName: "checkmark")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(Theme.background)
                .scaleEffect(isChecked ? 1 : 0.1)
                .opacity(isChecked ? 1 : 0)
        }
        .scaleEffect(isChecked ? 1 : 0.94)
        .animation(.spring(response: 0.32, dampingFraction: 0.55), value: isChecked)
    }
}

// MARK: - Session time picker

private struct SessionTimePicker: View {
    let dayType: DayType
    let initialTime: String
    let onSave: (String) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var hour = 15
    @State private var minute = 0

    private static let quickTimes: [(label: String, hour: Int, minute: Int)] = [
        ("10:00", 10, 0), ("12:00", 12, 0), ("15:00", 15, 0),
        ("17:00", 17, 0), ("19:00", 19, 0), ("20:45", 20, 45),
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                HStack(alignment: .center, spacing: 20) {
                    stepperColumn(label: "Hour", value: String(format: "%02d", hour)) {
                        hour = (hour + 23) % 24
                    } onIncrement: {
                        hour = (hour + 1) % 24
                    }

                    Text(":")
                        .font(.system(size: 36, weight: .heavy))
                        .foregroundStyle(Theme.textSecondary)
                        .padding(.top, 24)

                    stepperColumn(label: "Minute", value: String(format: "%02d", minute)) {
                        minute = (minute + 45) % 60
                    } onIncrement: {
                        minute = (minute + 15) % 60
                    }
                }

                LazyVGrid(
                    columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3),
                    spacing: 8
                ) {
                    ForEach(Self.quickTimes, id: \.label) { quick in
                        let isSelected = hour == quick.hour && minute == quick.minute
                        Button {
                            Haptics.light()
                            hour = quick.hour
                            minute = quick.minute
                        } label: {
                            Text(quick.label)
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(isSelected ? Theme.primary : Theme.textSecondary)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(isSelected ? Theme.primaryLight : Theme.surfaceElevated)
                                .clipShape(.rect(cornerRadius: 12))
                                .overlay {
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(isSelected ? Theme.primary : Theme.border, lineWidth: 1.5)
                                }
                        }
                        .buttonStyle(PressableButtonStyle())
                    }
                }

                Button {
                    onSave(FuelTimeline.formatTime(hour: hour, minute: minute))
                    dismiss()
                } label: {
                    Text("Save \(dayType.sessionName) Time")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Theme.background)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Theme.primary)
                        .clipShape(.rect(cornerRadius: 14))
                        .shadow(color: Theme.primary.opacity(0.25), radius: 10, y: 4)
                }
                .buttonStyle(PressableButtonStyle(scale: 0.98))

                Spacer()
            }
            .padding(24)
            .background(Theme.background)
            .navigationTitle("Set \(dayType.sessionName) Time")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Theme.textSecondary)
                }
            }
        }
        .presentationDetents([.medium])
        .preferredColorScheme(.dark)
        .onAppear {
            let parsed = FuelTimeline.parseTime(initialTime)
            hour = parsed.hour
            minute = parsed.minute
        }
    }

    private func stepperColumn(
        label: String,
        value: String,
        onDecrement: @escaping () -> Void,
        onIncrement: @escaping () -> Void
    ) -> some View {
        VStack(spacing: 10) {
            Text(label)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(Theme.textSecondary)
                .textCase(.uppercase)

            HStack(spacing: 12) {
                stepperButton("−") {
                    Haptics.light()
                    onDecrement()
                }
                Text(value)
                    .font(.system(size: 34, weight: .heavy))
                    .foregroundStyle(Theme.text)
                    .frame(minWidth: 56)
                    .contentTransition(.numericText())
                stepperButton("+") {
                    Haptics.light()
                    onIncrement()
                }
            }
        }
    }

    private func stepperButton(_ symbol: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(symbol)
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(Theme.primary)
                .frame(width: 40, height: 40)
                .background(Theme.surfaceElevated)
                .clipShape(.circle)
                .overlay {
                    Circle().stroke(Theme.border, lineWidth: 1.5)
                }
        }
        .buttonStyle(PressableButtonStyle())
    }
}
