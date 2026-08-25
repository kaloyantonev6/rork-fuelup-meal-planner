//
//  UserProfile.swift
//  FuelUp
//
//  The persisted player profile that drives every fuel calculation.
//

import Foundation

nonisolated struct UserProfile: Codable, Equatable, Sendable {
    // Identity & body
    var name: String
    var age: Int
    var gender: Gender
    var weight: Int
    var height: Int

    /// Local file URL string for a picked profile picture.
    var profileImagePath: String?

    // Notifications
    var mealRemindersEnabled: Bool

    // Football profile
    var position: FootballPosition
    var trainingFrequency: TrainingFrequency
    var seasonPhase: SeasonPhase
    var performanceGoal: PerformanceGoal
    /// Seven entries, Monday through Sunday.
    var weeklySchedule: [DayType]
    /// "HH:mm"
    var defaultKickoffTime: String
    /// "HH:mm"
    var defaultTrainingTime: String

    // Diet
    var dietType: DietType
    var allergies: [Allergy]
    var cookingSkill: CookingSkill
    var maxCookTime: CookTimeFilter
    var noCookOnly: Bool
    var maxFiveIngredients: Bool
    var kitchenEquipment: [KitchenEquipment]

    // Budget & location
    var weeklyBudget: Int
    var country: String

    // Subscription
    var isPremium: Bool

    static let `default` = UserProfile(
        name: "",
        age: 18,
        gender: .other,
        weight: 70,
        height: 170,
        profileImagePath: nil,
        mealRemindersEnabled: true,
        position: .centralMid,
        trainingFrequency: .threeToFour,
        seasonPhase: .inSeason,
        performanceGoal: .general,
        weeklySchedule: [.training, .training, .rest, .training, .training, .match, .recovery],
        defaultKickoffTime: "15:00",
        defaultTrainingTime: "18:00",
        dietType: .balanced,
        allergies: [],
        cookingSkill: .beginner,
        maxCookTime: .any,
        noCookOnly: false,
        maxFiveIngredients: false,
        kitchenEquipment: [.stovetop, .oven, .microwave, .blender],
        weeklyBudget: 35,
        country: "",
        isPremium: false
    )

    /// First name used in greetings and celebration copy.
    var firstName: String {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return "there" }
        return trimmed.split(separator: " ").first.map(String.init) ?? trimmed
    }

    /// Name used in celebration popups, defaults to "player".
    var celebrationName: String {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return "player" }
        return trimmed.split(separator: " ").first.map(String.init) ?? trimmed
    }

    /// The day type for a given date, resolved from the weekly schedule.
    /// The schedule is Monday-first, while `Calendar` weekdays are Sunday-first.
    func dayType(for date: Date) -> DayType {
        guard weeklySchedule.count == 7 else { return .rest }
        let weekday = Calendar.current.component(.weekday, from: date) // 1 = Sunday
        let index = weekday == 1 ? 6 : weekday - 2
        return weeklySchedule[index]
    }

    /// Today's day type.
    var todayDayType: DayType {
        dayType(for: Date())
    }

    /// The session time string to use for a given day type.
    func sessionTime(for dayType: DayType) -> String {
        switch dayType {
        case .match: defaultKickoffTime
        case .training: defaultTrainingTime
        case .rest, .recovery: "12:00"
        }
    }
}
