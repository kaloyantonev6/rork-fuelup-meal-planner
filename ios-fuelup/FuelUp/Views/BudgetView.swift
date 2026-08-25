//
//  BudgetView.swift
//  FuelUp
//
//  Weekly grocery budget tracker with purchase log and history.
//

import SwiftUI

struct BudgetView: View {
    @Environment(ProfileStore.self) private var profileStore
    @Environment(BudgetStore.self) private var budget

    @State private var showAddPurchase = false
    @State private var showEditBudget = false
    @State private var showPremium = false
    @State private var expandedWeeks: Set<String> = []

    private var isPremium: Bool { profileStore.profile.isPremium }

    var body: some View {
        NavigationStack {
            Group {
                if isPremium {
                    trackerContent
                } else {
                    lockedContent
                }
            }
            .background(Theme.background)
            .navigationTitle("Budget")
            .toolbar {
                if isPremium {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            Haptics.light()
                            showEditBudget = true
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: "pencil").font(.system(size: 12, weight: .bold))
                                Text("Edit").font(.system(size: 13, weight: .semibold))
                            }
                            .foregroundStyle(Theme.primary)
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showAddPurchase) {
            AddPurchaseSheet { store, amount, note in
                budget.addPurchase(storeName: store, amount: amount, note: note)
            }
        }
        .sheet(isPresented: $showEditBudget) {
            EditBudgetSheet(current: budget.weeklyBudget) { newValue in
                budget.weeklyBudget = newValue
                profileStore.profile.weeklyBudget = Int(newValue)
            }
        }
        .sheet(isPresented: $showPremium) {
            PremiumView()
        }
    }

    // MARK: - Locked state

    private var lockedContent: some View {
        VStack(spacing: 12) {
            Spacer()

            Image(systemName: "lock.fill")
                .font(.system(size: 36))
                .foregroundStyle(Theme.textTertiary)
                .frame(width: 80, height: 80)
                .background(Theme.surfaceElevated)
                .clipShape(.circle)
                .padding(.bottom, 8)

            Text("Premium Feature")
                .font(.system(size: 22, weight: .heavy))
                .foregroundStyle(Theme.text)

            Text("Track your weekly grocery spending and stay on budget with the Budget Tracker. Set limits, log purchases, and see exactly where your money goes.")
                .font(.system(size: 14))
                .foregroundStyle(Theme.textSecondary)
                .multilineTextAlignment(.center)

            Button {
                Haptics.light()
                showPremium = true
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "crown.fill").font(.system(size: 14))
                    Text("Upgrade to Premium").font(.system(size: 15, weight: .bold))
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background {
                    LinearGradient(
                        colors: [Color(hex: "#1B9C4F"), Color(hex: "#3ACEA0")],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                }
                .clipShape(.rect(cornerRadius: 14))
            }
            .buttonStyle(PressableButtonStyle())
            .padding(.top, 8)

            Spacer()
        }
        .padding(.horizontal, 40)
    }

    // MARK: - Tracker

    private var trackerContent: some View {
        ScrollView {
            VStack(spacing: 16) {
                budgetCard
                summaryRow
                purchasesSection

                if !budget.weeklyHistory.isEmpty {
                    historySection
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 8)
            .padding(.bottom, 32)
        }
        .scrollIndicators(.hidden)
    }

    private var budgetCard: some View {
        FuelCard(padding: 20, radius: 20) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text(budget.currentWeekRange)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Theme.textSecondary)
                    Spacer()
                    Text(budget.statusLabel)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(budget.progressColor)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(budget.progressColor.opacity(0.15))
                        .clipShape(.capsule)
                }

                HStack(alignment: .lastTextBaseline, spacing: 4) {
                    Text(String(format: "€%.2f", budget.totalSpent))
                        .font(.system(size: 34, weight: .heavy))
                        .foregroundStyle(Theme.text)
                    Text("/")
                        .font(.system(size: 24, weight: .light))
                        .foregroundStyle(Theme.textTertiary)
                    Text(String(format: "€%.2f", budget.weeklyBudget))
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(Theme.textTertiary)
                }

                FuelProgressBar(
                    progress: min(budget.spentPercentage, 100) / 100,
                    color: budget.progressColor
                )

                Text(
                    budget.remaining >= 0
                        ? String(format: "€%.2f left this week", budget.remaining)
                        : String(format: "€%.2f over budget", abs(budget.remaining))
                )
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(budget.progressColor)
            }
        }
    }

    private var summaryRow: some View {
        HStack(spacing: 10) {
            summaryCard(
                icon: "clock",
                iconColor: Theme.primary,
                value: String(format: "€%.2f", budget.dailyAverage),
                label: "Daily Avg",
                meta: "Based on \(budget.daysElapsed) day\(budget.daysElapsed == 1 ? "" : "s")",
                metaColor: Theme.textTertiary
            )

            let overProjected = budget.projectedTotal > budget.weeklyBudget
            summaryCard(
                icon: overProjected ? "exclamationmark.triangle.fill" : "checkmark.circle.fill",
                iconColor: overProjected ? Theme.error : Theme.primary,
                value: String(format: "€%.2f", budget.projectedTotal),
                label: "Projected",
                meta: overProjected ? "May exceed" : "On track",
                metaColor: overProjected ? Theme.error : Theme.primary
            )

            summaryCard(
                icon: "chart.line.downtrend.xyaxis",
                iconColor: Theme.primary,
                value: String(format: "€%.2f", budget.costPerMeal),
                label: "Per Meal",
                meta: "This week",
                metaColor: Theme.textTertiary
            )
        }
    }

    private func summaryCard(
        icon: String,
        iconColor: Color,
        value: String,
        label: String,
        meta: String,
        metaColor: Color
    ) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 15))
                .foregroundStyle(iconColor)
            Text(value)
                .font(.system(size: 17, weight: .heavy))
                .foregroundStyle(Theme.text)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(label)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(Theme.textSecondary)
                .textCase(.uppercase)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
            Text(meta)
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(metaColor)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.8)
        }
        .padding(14)
        .frame(maxWidth: .infinity)
        .background(Theme.surface)
        .clipShape(.rect(cornerRadius: 16))
        .overlay {
            RoundedRectangle(cornerRadius: 16).stroke(Theme.border, lineWidth: 1)
        }
    }

    private var purchasesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Purchases")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(Theme.text)
                Spacer()
                Button {
                    Haptics.light()
                    showAddPurchase = true
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "plus").font(.system(size: 13, weight: .bold))
                        Text("Add").font(.system(size: 13, weight: .bold))
                    }
                    .foregroundStyle(Theme.background)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Theme.primary)
                    .clipShape(.capsule)
                }
                .buttonStyle(PressableButtonStyle(scale: 0.96))
            }

            if budget.purchases.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "wallet.bifold")
                        .font(.system(size: 28))
                        .foregroundStyle(Theme.textTertiary)
                    Text("No purchases yet")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Theme.text)
                    Text("Tap \"Add\" to log your first grocery purchase this week.")
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.textSecondary)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: 240)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
            } else {
                ForEach(budget.purchases) { purchase in
                    purchaseRow(purchase)
                }
            }
        }
    }

    private func purchaseRow(_ purchase: Purchase) -> some View {
        let dayColors: [Color] = [
            Theme.primary, Color(hex: "#3b82f6"), Color(hex: "#f59e0b"),
            Theme.error, Color(hex: "#8b5cf6"), Color(hex: "#f97316"), Color(hex: "#ec4899"),
        ]
        let date = DateFormatter.storageDay.date(from: purchase.date) ?? Date()
        let weekday = Calendar.current.component(.weekday, from: date) - 1
        let accent = dayColors[max(0, min(weekday, dayColors.count - 1))]

        let formatter = DateFormatter()
        formatter.dateFormat = "EEE, MMM d"

        return HStack {
            Rectangle()
                .fill(accent)
                .frame(width: 4)

            VStack(alignment: .leading, spacing: 4) {
                Text(purchase.storeName)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Theme.text)
                HStack(spacing: 6) {
                    Text(formatter.string(from: date))
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Theme.textSecondary)
                    if let note = purchase.note, !note.isEmpty {
                        Text("• \(note)")
                            .font(.system(size: 12))
                            .foregroundStyle(Theme.textTertiary)
                            .lineLimit(1)
                    }
                }
            }
            .padding(.vertical, 14)

            Spacer(minLength: 8)

            VStack(alignment: .trailing, spacing: 6) {
                Text(String(format: "€%.2f", purchase.amount))
                    .font(.system(size: 16, weight: .heavy))
                    .foregroundStyle(Theme.text)
                Button {
                    Haptics.light()
                    withAnimation {
                        budget.deletePurchase(id: purchase.id)
                    }
                } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.textTertiary)
                }
            }
            .padding(.trailing, 14)
            .padding(.vertical, 14)
        }
        .background(Theme.surface)
        .clipShape(.rect(cornerRadius: 14))
        .overlay {
            RoundedRectangle(cornerRadius: 14).stroke(Theme.border, lineWidth: 1)
        }
    }

    private var historySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Past Weeks")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(Theme.text)
                .padding(.top, 12)

            ForEach(budget.weeklyHistory) { week in
                let isExpanded = expandedWeeks.contains(week.weekStart)
                let status = week.status

                Button {
                    Haptics.light()
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                        if isExpanded {
                            expandedWeeks.remove(week.weekStart)
                        } else {
                            expandedWeeks.insert(week.weekStart)
                        }
                    }
                } label: {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(week.rangeLabel)
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundStyle(Theme.text)
                                HStack(spacing: 8) {
                                    Text(String(format: "€%.2f / €%.2f", week.totalSpent, week.budget))
                                        .font(.system(size: 12, weight: .medium))
                                        .foregroundStyle(Theme.textSecondary)
                                    Text(status.label)
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundStyle(status.color)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 2)
                                        .background(status.color.opacity(0.15))
                                        .clipShape(.capsule)
                                }
                            }
                            Spacer()
                            Image(systemName: "chevron.down")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(Theme.textTertiary)
                                .rotationEffect(.degrees(isExpanded ? 180 : 0))
                        }

                        FuelProgressBar(
                            progress: min(week.percentage, 100) / 100,
                            height: 4,
                            color: status.color
                        )

                        if isExpanded {
                            Divider().overlay(Theme.borderLight)
                            Text("\(week.purchaseCount) purchase\(week.purchaseCount == 1 ? "" : "s") • Avg €\(String(format: "%.2f", week.totalSpent / Double(max(week.purchaseCount, 1))))/purchase")
                                .font(.system(size: 12))
                                .foregroundStyle(Theme.textSecondary)
                        }
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Theme.surface)
                    .clipShape(.rect(cornerRadius: 14))
                    .overlay {
                        RoundedRectangle(cornerRadius: 14).stroke(Theme.border, lineWidth: 1)
                    }
                }
                .buttonStyle(PressableButtonStyle(scale: 0.995))
            }
        }
    }
}

// MARK: - Sheets

private struct AddPurchaseSheet: View {
    let onAdd: (String, Double, String?) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var storeName = ""
    @State private var amount = ""
    @State private var note = ""
    @State private var showError = false
    @FocusState private var focused: Field?

    private enum Field: Hashable {
        case store, amount, note
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    labeledField("Store Name", placeholder: "e.g. Lidl, Aldi, Rewe...", text: $storeName, field: .store)
                    labeledField("Amount (€)", placeholder: "0.00", text: $amount, field: .amount, keyboard: .decimalPad)
                    labeledField("Note (optional)", placeholder: "e.g. weekly shop, snacks...", text: $note, field: .note)

                    Button {
                        submit()
                    } label: {
                        Text("Add Purchase")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(Theme.background)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Theme.primary)
                            .clipShape(.rect(cornerRadius: 14))
                    }
                    .buttonStyle(PressableButtonStyle(scale: 0.98))
                    .padding(.top, 4)
                }
                .padding(24)
            }
            .background(Theme.background)
            .navigationTitle("Add Purchase")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Theme.textSecondary)
                }
            }
            .alert("Invalid Input", isPresented: $showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text("Please enter a store name and a valid amount.")
            }
        }
        .presentationDetents([.medium, .large])
        .presentationContentInteraction(.scrolls)
        .preferredColorScheme(.dark)
        .onAppear { focused = .store }
    }

    private func labeledField(
        _ label: String,
        placeholder: String,
        text: Binding<String>,
        field: Field,
        keyboard: UIKeyboardType = .default
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).sectionLabelStyle()
            TextField(placeholder, text: text)
                .keyboardType(keyboard)
                .focused($focused, equals: field)
                .font(.system(size: 15))
                .foregroundStyle(Theme.text)
                .padding(14)
                .background(Theme.surfaceElevated)
                .clipShape(.rect(cornerRadius: 12))
                .overlay {
                    RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1)
                }
        }
    }

    private func submit() {
        let trimmed = storeName.trimmingCharacters(in: .whitespaces)
        let normalized = amount.replacingOccurrences(of: ",", with: ".")
        guard !trimmed.isEmpty, let value = Double(normalized), value > 0 else {
            Haptics.warning()
            showError = true
            return
        }
        Haptics.medium()
        onAdd(trimmed, value, note.trimmingCharacters(in: .whitespaces))
        dismiss()
    }
}

private struct EditBudgetSheet: View {
    let current: Double
    let onSave: (Double) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var value = ""
    @FocusState private var focused: Bool

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                Text("Weekly Budget").sectionLabelStyle()

                HStack(spacing: 6) {
                    Text("€")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(Theme.text)
                    TextField("50", text: $value)
                        .keyboardType(.decimalPad)
                        .focused($focused)
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(Theme.text)
                        .padding(14)
                        .background(Theme.surfaceElevated)
                        .clipShape(.rect(cornerRadius: 12))
                        .overlay {
                            RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1)
                        }
                }

                Button {
                    let normalized = value.replacingOccurrences(of: ",", with: ".")
                    guard let parsed = Double(normalized), parsed > 0 else {
                        Haptics.warning()
                        return
                    }
                    Haptics.light()
                    onSave(parsed)
                    dismiss()
                } label: {
                    Text("Save")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Theme.background)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Theme.primary)
                        .clipShape(.rect(cornerRadius: 14))
                }
                .buttonStyle(PressableButtonStyle(scale: 0.98))

                Spacer()
            }
            .padding(24)
            .background(Theme.background)
            .navigationTitle("Set Weekly Budget")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Theme.textSecondary)
                }
            }
        }
        .presentationDetents([.height(280)])
        .preferredColorScheme(.dark)
        .onAppear {
            value = String(format: "%.0f", current)
            focused = true
        }
    }
}
