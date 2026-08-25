//
//  HydrationCard.swift
//  FuelUp
//
//  Daily hydration tracker with a glass tally and day-type aware target.
//

import SwiftUI

struct HydrationCard: View {
    let profile: UserProfile
    let dayType: DayType

    @Environment(DayProgressStore.self) private var progress

    private var targetLiters: Double {
        NutritionEngine.waterTarget(weight: profile.weight, dayType: dayType)
    }

    private var targetMl: Int {
        Int((targetLiters * 1000).rounded())
    }

    private var fraction: Double {
        targetMl > 0 ? min(Double(progress.hydrationMl) / Double(targetMl), 1) : 0
    }

    private var glasses: Int {
        progress.hydrationMl / 250
    }

    private var glassSlots: Int {
        min(max(glasses + 1, 8), 12)
    }

    var body: some View {
        FuelCard(radius: 16) {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    HStack(spacing: 8) {
                        Image(systemName: "drop.fill")
                            .font(.system(size: 16))
                            .foregroundStyle(Theme.primary)
                        Text("Hydration")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(Theme.text)
                    }
                    Spacer()
                    Button {
                        Haptics.light()
                        progress.addWater()
                    } label: {
                        Text("+ 250ml")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(Theme.background)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(Theme.primary)
                            .clipShape(.capsule)
                    }
                    .buttonStyle(PressableButtonStyle(scale: 0.95, opacity: 0.8))
                }

                HStack(alignment: .center, spacing: 16) {
                    ZStack {
                        FuelProgressRing(
                            progress: fraction,
                            size: 84,
                            lineWidth: 8,
                            color: Theme.primary
                        )
                        VStack(spacing: 0) {
                            Text(String(format: "%.1f", Double(progress.hydrationMl) / 1000))
                                .font(.system(size: 20, weight: .heavy))
                                .foregroundStyle(Theme.text)
                            Text(String(format: "/ %.1f L", targetLiters))
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundStyle(Theme.textSecondary)
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        LazyVGrid(
                            columns: Array(repeating: GridItem(.flexible(), spacing: 2), count: 6),
                            spacing: 4
                        ) {
                            ForEach(0..<glassSlots, id: \.self) { index in
                                Button {
                                    Haptics.light()
                                    progress.addWater()
                                } label: {
                                    Text(index < glasses ? "💧" : "🥤")
                                        .font(.system(size: 17))
                                        .opacity(index < glasses ? 1 : 0.4)
                                }
                                .buttonStyle(PressableButtonStyle(scale: 0.85, opacity: 0.7))
                            }
                        }

                        if dayType == .match {
                            Text("Start hydrating 24h before kickoff. Aim for clear/light yellow urine.")
                                .font(.system(size: 11))
                                .foregroundStyle(Theme.textTertiary)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
            }
        }
    }
}
