//
//  GeneratedPlanSheet.swift
//  FuelUp
//
//  Results view shown after generating a fuel plan.
//

import SwiftUI

struct GeneratedPlanSheet: View {
    let profile: UserProfile
    let dayType: DayType
    let mealsPerDay: Int

    @Environment(\.dismiss) private var dismiss
    @State private var expandedMealID: String?

    private var plan: GeneratedPlan {
        MealPlanGenerator.generate(profile: profile, dayType: dayType, mealsPerDay: mealsPerDay)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                let plan = plan

                VStack(spacing: 16) {
                    summaryCard(plan)

                    VStack(alignment: .leading, spacing: 10) {
                        Text("Your Fuel Sessions").sectionLabelStyle()

                        ForEach(plan.meals) { meal in
                            mealCard(meal)
                        }
                    }

                    shoppingCard(plan)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 16)
            }
            .background(Theme.background)
            .scrollIndicators(.hidden)
            .navigationTitle("\(dayType.emoji) \(dayType.label) Plan")
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

    private func summaryCard(_ plan: GeneratedPlan) -> some View {
        FuelCard(radius: 16) {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Text("Plan Summary")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Theme.text)
                    Spacer()
                    DayTypeBadge(dayType: dayType, compact: true)
                }

                HStack(spacing: 8) {
                    macroBox("\(plan.totalCalories)", "of \(plan.targetCalories) kcal", Theme.primary)
                    macroBox("\(plan.totalProtein)g", "of \(plan.targetProtein)g P", Theme.match)
                    macroBox("\(plan.totalCarbs)g", "of \(plan.targetCarbs)g C", Theme.recovery)
                    macroBox("\(plan.totalFat)g", "of \(plan.targetFat)g F", Theme.macroFat)
                }

                let coverage = plan.targetCalories > 0
                    ? Double(plan.totalCalories) / Double(plan.targetCalories)
                    : 0

                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text("Target coverage")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Theme.textSecondary)
                        Spacer()
                        Text("\(Int((coverage * 100).rounded()))%")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(Theme.primary)
                    }
                    FuelProgressBar(progress: coverage, height: 8)
                }
            }
        }
    }

    private func macroBox(_ value: String, _ label: String, _ color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 17, weight: .heavy))
                .foregroundStyle(color)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(label)
                .font(.system(size: 9, weight: .semibold))
                .foregroundStyle(Theme.textSecondary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 4)
        .frame(maxWidth: .infinity)
        .background(color.opacity(0.12))
        .clipShape(.rect(cornerRadius: 12))
    }

    private func mealCard(_ meal: GeneratedMeal) -> some View {
        let isExpanded = expandedMealID == meal.id

        return Button {
            Haptics.light()
            withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                expandedMealID = isExpanded ? nil : meal.id
            }
        } label: {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 12) {
                    Text(meal.emoji)
                        .font(.system(size: 24))
                        .frame(width: 44, height: 44)
                        .background(Theme.surfaceElevated)
                        .clipShape(.rect(cornerRadius: 12))

                    VStack(alignment: .leading, spacing: 3) {
                        HStack(spacing: 6) {
                            Text(meal.timeLabel)
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(Theme.primary)
                            Text(meal.slotLabel)
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(Theme.textTertiary)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 1)
                                .background(Theme.surfaceElevated)
                                .clipShape(.rect(cornerRadius: 6))
                        }
                        Text(meal.name)
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(Theme.text)
                            .multilineTextAlignment(.leading)
                    }

                    Spacer(minLength: 4)
                    Image(systemName: "chevron.down")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(Theme.textTertiary)
                        .rotationEffect(.degrees(isExpanded ? 180 : 0))
                }

                HStack(spacing: 8) {
                    macroTag("🔥 \(meal.calories)")
                    macroTag("\(meal.protein)g P")
                    macroTag("\(meal.carbs)g C")
                    macroTag("\(meal.fat)g F")
                    if meal.prepTime > 0 {
                        macroTag("⏱ \(meal.prepTime)m")
                    }
                }

                if isExpanded {
                    VStack(alignment: .leading, spacing: 10) {
                        Divider().overlay(Theme.borderLight)

                        VStack(alignment: .leading, spacing: 4) {
                            Text("Why this fuels you")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(Theme.primary)
                                .textCase(.uppercase)
                            Text(meal.fuelReason)
                                .font(.system(size: 13))
                                .foregroundStyle(Theme.textSecondary)
                                .fixedSize(horizontal: false, vertical: true)
                                .multilineTextAlignment(.leading)
                        }

                        VStack(alignment: .leading, spacing: 4) {
                            Text("Ingredients")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(Theme.textSecondary)
                                .textCase(.uppercase)
                            Text(meal.ingredients.joined(separator: " · "))
                                .font(.system(size: 13))
                                .foregroundStyle(Theme.text)
                                .fixedSize(horizontal: false, vertical: true)
                                .multilineTextAlignment(.leading)
                        }
                    }
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
        .buttonStyle(PressableButtonStyle(scale: 0.995, opacity: 0.95))
    }

    private func macroTag(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 11, weight: .bold))
            .foregroundStyle(Theme.text)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Theme.surfaceElevated)
            .clipShape(.rect(cornerRadius: 8))
    }

    private func shoppingCard(_ plan: GeneratedPlan) -> some View {
        FuelCard(radius: 16) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 8) {
                    Image(systemName: "cart.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.primary)
                    Text("Shopping List")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Theme.text)
                    Spacer()
                    Text("\(plan.shoppingList.count) items")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Theme.textTertiary)
                }

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 6) {
                    ForEach(plan.shoppingList, id: \.self) { item in
                        HStack(spacing: 6) {
                            Circle().fill(Theme.primary).frame(width: 4, height: 4)
                            Text(item)
                                .font(.system(size: 12))
                                .foregroundStyle(Theme.textSecondary)
                                .lineLimit(1)
                                .minimumScaleFactor(0.8)
                            Spacer(minLength: 0)
                        }
                    }
                }
            }
        }
    }
}
