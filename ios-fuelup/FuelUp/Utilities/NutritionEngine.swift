//
//  NutritionEngine.swift
//  FuelUp
//
//  Calorie and macro engine with position boosts, day-type multipliers,
//  and season adjustments. Mirrors `expo/utils/dailyTargets.ts`.
//

import Foundation

/// Day-specific calorie and macro targets.
nonisolated struct DayTargets: Sendable, Equatable {
    let dayType: DayType
    let calories: Int
    let protein: Int
    let carbs: Int
    let fat: Int
    let waterLiters: Double
}

/// Full targets payload including the BMR → TDEE chain and coaching notes.
nonisolated struct DailyTargets: Sendable, Equatable {
    let bmr: Int
    let tdee: Int
    let calories: Int
    let protein: Int
    let carbs: Int
    let fat: Int
    let fiber: Int
    let waterLiters: Double
    let positionLabel: String
    let dayTypeLabel: String
    let notes: [String]
}

nonisolated enum NutritionEngine {

    /// Mifflin-St Jeor basal metabolic rate.
    static func basalMetabolicRate(gender: Gender, weight: Int, height: Int, age: Int) -> Double {
        let base = 10 * Double(weight) + 6.25 * Double(height) - 5 * Double(age)
        return gender == .female ? base - 161 : base + 5
    }

    /// Daily water target in litres: body weight baseline plus a day-type bonus.
    static func waterTarget(weight: Int, dayType: DayType) -> Double {
        let base = Double(weight) * 0.033
        return ((base + dayType.waterBonus) * 10).rounded() / 10
    }

    /// Recommended daily fiber based on age and gender.
    static func fiberTarget(gender: Gender, age: Int) -> Int {
        if gender == .female {
            return age >= 50 ? 21 : 25
        }
        return age >= 50 ? 30 : 38
    }

    /// Core calculation used by the meal plan and the day fuel plan.
    static func dayTargets(profile: UserProfile, dayType: DayType) -> DayTargets {
        let weight = profile.weight > 0 ? profile.weight : 70
        let height = profile.height > 0 ? profile.height : 170
        let age = profile.age > 0 ? profile.age : 20

        let bmr = basalMetabolicRate(gender: profile.gender, weight: weight, height: height, age: age)
        let tdee = (bmr * profile.trainingFrequency.activityMultiplier).rounded()

        // The position boost only applies when the player is actually on the pitch.
        let positionBoost = (dayType == .training || dayType == .match)
            ? Double(profile.position.calorieBoost)
            : 0

        let calories = Int(
            (tdee * dayType.calorieMultiplier * profile.seasonPhase.calorieAdjustment + positionBoost).rounded()
        )

        let split = dayType.macroSplit
        let protein = Int((Double(calories) * split.protein / 100 / 4).rounded())
        let carbs = Int((Double(calories) * split.carbs / 100 / 4).rounded())
        let fat = Int((Double(calories) * split.fat / 100 / 9).rounded())

        return DayTargets(
            dayType: dayType,
            calories: calories,
            protein: protein,
            carbs: carbs,
            fat: fat,
            waterLiters: waterTarget(weight: weight, dayType: dayType)
        )
    }

    /// Targets plus the explanatory chain and coaching notes shown in the UI.
    static func dailyTargets(profile: UserProfile, dayType: DayType) -> DailyTargets {
        let weight = profile.weight > 0 ? profile.weight : 70
        let height = profile.height > 0 ? profile.height : 170
        let age = profile.age > 0 ? profile.age : 20

        let bmr = basalMetabolicRate(gender: profile.gender, weight: weight, height: height, age: age)
        let tdee = (bmr * profile.trainingFrequency.activityMultiplier).rounded()
        let targets = dayTargets(profile: profile, dayType: dayType)

        return DailyTargets(
            bmr: Int(bmr.rounded()),
            tdee: Int(tdee),
            calories: targets.calories,
            protein: targets.protein,
            carbs: targets.carbs,
            fat: targets.fat,
            fiber: fiberTarget(gender: profile.gender, age: age),
            waterLiters: targets.waterLiters,
            positionLabel: profile.position.shortLabel,
            dayTypeLabel: dayType.label,
            notes: notes(profile: profile, dayType: dayType)
        )
    }

    /// Up to three coaching notes explaining why the targets look the way they do.
    private static func notes(profile: UserProfile, dayType: DayType) -> [String] {
        var result: [String] = []
        let age = profile.age > 0 ? profile.age : 20

        if age >= 16 && age <= 19 {
            result.append("Teen athlete: your body is still developing — prioritize adequate calories and calcium.")
        }
        if age >= 20 && age <= 24 {
            result.append("Peak performance window: maintain consistent fueling to maximize training adaptations.")
        }

        switch dayType {
        case .match:
            result.append("Match day: carb-heavy fueling maximizes glycogen stores for 90 minutes of effort.")
            if profile.position == .winger || profile.position == .fullBack {
                result.append("High-intensity position: you'll burn more sprints — extra carbs are critical.")
            }
        case .training:
            result.append("Training day: balanced macros with slightly higher carbs to fuel the session.")
        case .recovery:
            result.append("Recovery day: high protein + anti-inflammatory foods (salmon, berries, leafy greens).")
        case .rest:
            result.append("Rest day: lower calories, but don't skip protein — your muscles rebuild on off days.")
        }

        if profile.seasonPhase == .preSeason {
            result.append("Pre-season: higher calorie intake supports fitness building and muscle gain.")
        }
        if profile.seasonPhase == .injuryRecovery {
            result.append("Injury recovery: protein-heavy, anti-inflammatory foods to speed tissue repair.")
        }

        return Array(result.prefix(3))
    }
}

/// Rotating evidence-based performance tips shown on the dashboard.
nonisolated enum PerformanceTips {
    static let all: [String] = [
        "Carb-load 24–48h before match day, not just the night before.",
        "Caffeine 30–60 min before kickoff can improve sprint performance.",
        "Post-match: eat within 30 minutes. A 3:1 carb-to-protein ratio speeds recovery.",
        "Dehydration of just 2% body weight can reduce sprint speed by up to 10%.",
        "Iron deficiency is common in young players — eat red meat, spinach, or fortified cereals.",
        "Tart cherry juice can reduce muscle soreness by up to 50% after matches.",
        "Avoid high-fiber and high-fat meals within 3 hours of kickoff — they slow digestion.",
        "Creatine (3–5g/day) is one of the most studied supplements for repeated sprint performance.",
        "Sleep 8–10 hours on nights before matches. Poor sleep impairs reaction time more than alcohol.",
        "Your muscles store ~500g of glycogen. It takes 24–48h of carb-rich eating to fully reload.",
        "Protein needs for footballers: 1.4–1.7g per kg body weight per day.",
        "Dark-colored urine before training? You're already dehydrated. Drink 500ml in the next hour.",
        "Beetroot juice 2–3 hours before exercise may improve endurance by boosting nitric oxide.",
        "Omega-3 from fish (salmon, mackerel) reduces inflammation and speeds recovery between matches.",
    ]

    /// Deterministic tip for a given day so it rotates daily but stays stable.
    static func tip(for date: Date) -> String {
        let day = Calendar.current.ordinality(of: .day, in: .era, for: date) ?? 0
        return all[day % all.count]
    }
}
