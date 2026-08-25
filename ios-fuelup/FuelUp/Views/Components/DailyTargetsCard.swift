//
//  DailyTargetsCard.swift
//  FuelUp
//
//  Shows the BMR → TDEE → daily calorie chain plus macro breakdown.
//

import SwiftUI

struct DailyTargetsCard: View {
    let profile: UserProfile
    let dayType: DayType

    private var targets: DailyTargets {
        NutritionEngine.dailyTargets(profile: profile, dayType: dayType)
    }

    var body: some View {
        let targets = targets

        FuelCard(radius: 16) {
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .center) {
                    Text("📊 Today's Fuel Targets")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Theme.text)
                    Spacer(minLength: 8)
                    Text(targets.dayTypeLabel)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(Theme.primary)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Theme.primaryLight)
                        .clipShape(.capsule)
                        .overlay {
                            Capsule().stroke(Theme.primary.opacity(0.3), lineWidth: 1)
                        }
                }
                .padding(.bottom, 10)

                // BMR → TDEE → target chain
                (
                    Text("BMR: \(targets.bmr) kcal → TDEE: \(targets.tdee) kcal → ")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(Theme.textTertiary)
                    + Text("\(targets.calories) kcal/day")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(Theme.primary)
                )
                .padding(.bottom, 8)

                Text("⚽ \(targets.positionLabel)")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(Theme.text)
                    .padding(.bottom, 14)

                HStack(spacing: 8) {
                    statBox("\(targets.calories)", "kcal/day", Theme.primary, Theme.primaryLight)
                    statBox("\(targets.protein)g", "Protein", Theme.match, Theme.match.opacity(0.12))
                    statBox("\(targets.carbs)g", "Carbs", Theme.recovery, Theme.recovery.opacity(0.12))
                    statBox("\(targets.fat)g", "Fat", Theme.macroFat, Theme.macroFat.opacity(0.12))
                }
                .padding(.bottom, 14)

                HStack(spacing: 8) {
                    Spacer()
                    extraText(icon: "🥬", label: "Fiber:", value: "\(targets.fiber)g/day")
                    Circle()
                        .fill(Theme.textTertiary)
                        .frame(width: 4, height: 4)
                    extraText(icon: "💧", label: "Water:", value: String(format: "%.1fL/day", targets.waterLiters))
                    Spacer()
                }
                .padding(.vertical, 8)
                .padding(.horizontal, 12)
                .frame(maxWidth: .infinity)
                .background(Theme.surfaceElevated)
                .clipShape(.rect(cornerRadius: 10))

                if !targets.notes.isEmpty {
                    Divider()
                        .overlay(Theme.borderLight)
                        .padding(.top, 12)

                    Text("Why These Targets?")
                        .sectionLabelStyle()
                        .font(.system(size: 12, weight: .bold))
                        .padding(.top, 12)
                        .padding(.bottom, 8)

                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(targets.notes, id: \.self) { note in
                            HStack(alignment: .top, spacing: 8) {
                                Circle()
                                    .fill(Theme.primary)
                                    .frame(width: 5, height: 5)
                                    .padding(.top, 5)
                                Text(note)
                                    .font(.system(size: 13))
                                    .foregroundStyle(Theme.textSecondary)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }
                }
            }
        }
    }

    private func statBox(_ value: String, _ label: String, _ color: Color, _ background: Color) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 19, weight: .heavy))
                .foregroundStyle(color)
                .minimumScaleFactor(0.7)
                .lineLimit(1)
            Text(label)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(Theme.textSecondary)
                .textCase(.uppercase)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .padding(.vertical, 14)
        .padding(.horizontal, 4)
        .frame(maxWidth: .infinity)
        .background(background)
        .clipShape(.rect(cornerRadius: 12))
    }

    private func extraText(icon: String, label: String, value: String) -> some View {
        (
            Text("\(icon) \(label) ")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(Theme.textSecondary)
            + Text(value)
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(Theme.text)
        )
        .lineLimit(1)
        .minimumScaleFactor(0.8)
    }
}

#Preview {
    ScrollView {
        DailyTargetsCard(profile: .default, dayType: .match)
            .padding()
    }
    .background(Theme.background)
}
