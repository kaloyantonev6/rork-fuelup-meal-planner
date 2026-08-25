//
//  FuelTimeline.swift
//  FuelUp
//
//  Day-type aware fueling timeline templates and helpers.
//  Mirrors `expo/utils/timeline.ts`.
//

import Foundation

nonisolated enum MealSlot: String, Codable, Sendable {
    case breakfast
    case preMatchMeal = "pre_match_meal"
    case preMatchSnack = "pre_match_snack"
    case hydration
    case halfTime = "half_time"
    case postMatch = "post_match"
    case evening
    case preTrainingMeal = "pre_training_meal"
    case preTrainingSnack = "pre_training_snack"
    case trainingSession = "training_session"
    case postTraining = "post_training"
    case midMorningSnack = "mid_morning_snack"
    case afternoonSnack = "afternoon_snack"

    var icon: String {
        switch self {
        case .breakfast: "🍳"
        case .preMatchMeal: "🍝"
        case .preMatchSnack: "🍌"
        case .hydration: "💧"
        case .halfTime: "🍊"
        case .postMatch: "🥤"
        case .evening: "🍽️"
        case .preTrainingMeal: "🍚"
        case .preTrainingSnack: "🍌"
        case .trainingSession: "⚽"
        case .postTraining: "🥤"
        case .midMorningSnack: "🥜"
        case .afternoonSnack: "🍎"
        }
    }
}

/// A single point on the day's fueling timeline before time resolution.
nonisolated struct TimelineSlot: Sendable {
    let offsetLabel: String
    let label: String
    let description: String
    let caloriePct: Double
    let example: String
    let mealSlot: MealSlot
    /// Hours relative to the session for match/training days, or absolute hour for rest/recovery.
    let offset: Double
}

/// A timeline entry with its resolved clock label.
nonisolated struct TimelineEntry: Identifiable, Sendable {
    let index: Int
    let offsetLabel: String
    let timeLabel: String
    let label: String
    let description: String
    let caloriePct: Double
    let example: String
    let mealSlot: MealSlot

    var id: Int { index }

    /// Whether this entry carries calories (and therefore deserves a reminder).
    var isMeal: Bool { caloriePct > 0 }
}

nonisolated struct TimelineTemplate: Sendable {
    let dayType: DayType
    let slots: [TimelineSlot]
    let hydrationNote: String

    /// Index of the half-time slot on match days, which has no fixed clock offset.
    static let matchHalfTimeIndex = 4
    /// Minutes after kickoff that half-time occurs.
    static let halfTimeOffsetMinutes = 45
}

nonisolated enum FuelTimeline {
    static func template(for dayType: DayType) -> TimelineTemplate {
        switch dayType {
        case .match: matchTemplate
        case .training: trainingTemplate
        case .rest: restTemplate
        case .recovery: recoveryTemplate
        }
    }

    // MARK: - Templates

    private static let matchTemplate = TimelineTemplate(
        dayType: .match,
        slots: [
            .init(offsetLabel: "-7h", label: "Breakfast", description: "High-carb, moderate protein, low fat", caloriePct: 0.22, example: "Oatmeal with banana, honey & berries", mealSlot: .breakfast, offset: -7),
            .init(offsetLabel: "-4h", label: "Pre-Match Meal", description: "Carb-rich, easily digestible, low fiber", caloriePct: 0.28, example: "Pasta with chicken & light tomato sauce", mealSlot: .preMatchMeal, offset: -4),
            .init(offsetLabel: "-1.5h", label: "Pre-Match Snack", description: "Quick energy, easy on stomach", caloriePct: 0.08, example: "Banana + energy bar", mealSlot: .preMatchSnack, offset: -1.5),
            .init(offsetLabel: "-30min", label: "Hydration", description: "400-500ml water with electrolytes", caloriePct: 0, example: "Water + electrolyte tablet", mealSlot: .hydration, offset: -0.5),
            .init(offsetLabel: "HT", label: "Half-Time Fuel", description: "Quick carbs, small amount", caloriePct: 0.04, example: "Orange slices + sip of sports drink", mealSlot: .halfTime, offset: 0),
            .init(offsetLabel: "+2h", label: "Post-Match Recovery", description: "3:1 carb-to-protein ratio, within 60 min", caloriePct: 0.20, example: "Chocolate milk + rice with chicken", mealSlot: .postMatch, offset: 2),
            .init(offsetLabel: "+5h", label: "Evening Meal", description: "Balanced recovery dinner", caloriePct: 0.18, example: "Salmon, sweet potato, steamed vegetables", mealSlot: .evening, offset: 5),
        ],
        hydrationNote: "Start hydrating 24h before kickoff. Aim for 500ml 2 hours before, then 250ml 30 min before. Sip at half-time."
    )

    private static let trainingTemplate = TimelineTemplate(
        dayType: .training,
        slots: [
            .init(offsetLabel: "-8h", label: "Breakfast", description: "High-carb, moderate protein to fuel the day", caloriePct: 0.20, example: "Footballer's overnight oats with berries", mealSlot: .breakfast, offset: -8),
            .init(offsetLabel: "-4h", label: "Pre-Training Meal", description: "Balanced carbs + protein, easy to digest", caloriePct: 0.25, example: "High-protein training day wrap + rice", mealSlot: .preTrainingMeal, offset: -4),
            .init(offsetLabel: "-1.5h", label: "Pre-Training Snack", description: "Quick energy, light on the stomach", caloriePct: 0.08, example: "Banana & PB energy toast", mealSlot: .preTrainingSnack, offset: -1.5),
            .init(offsetLabel: "-30min", label: "Hydration", description: "400-500ml water + electrolytes", caloriePct: 0, example: "Water + electrolyte tablet", mealSlot: .hydration, offset: -0.5),
            .init(offsetLabel: "Session", label: "Training Session", description: "Your main pitch work. Sip fluids throughout.", caloriePct: 0, example: "Sip 150-250ml every 15-20 min", mealSlot: .trainingSession, offset: 0),
            .init(offsetLabel: "+1h", label: "Post-Training Recovery", description: "20-25g protein + carbs within 60 min", caloriePct: 0.25, example: "Recovery chocolate smoothie + rice bowl", mealSlot: .postTraining, offset: 1),
            .init(offsetLabel: "+4h", label: "Evening Meal", description: "Balanced dinner to replenish glycogen", caloriePct: 0.22, example: "Salmon, quinoa and roasted vegetables", mealSlot: .evening, offset: 4),
        ],
        hydrationNote: "Start hydrating 2 hours before training. Aim for 5-7ml/kg body weight about 2h before the session."
    )

    private static let restTemplate = TimelineTemplate(
        dayType: .rest,
        slots: [
            .init(offsetLabel: "07:00", label: "Breakfast", description: "Steady energy, anti-inflammatory where possible", caloriePct: 0.25, example: "Recovery berry protein bowl", mealSlot: .breakfast, offset: 7),
            .init(offsetLabel: "10:00", label: "Mid-Morning Snack", description: "Light protein + fiber", caloriePct: 0.10, example: "Greek yogurt with nuts", mealSlot: .midMorningSnack, offset: 10),
            .init(offsetLabel: "13:00", label: "Lunch", description: "Balanced macros, lighter than training day", caloriePct: 0.30, example: "Grilled chicken salad with whole grains", mealSlot: .preTrainingMeal, offset: 13),
            .init(offsetLabel: "16:00", label: "Afternoon Snack", description: "Sustained energy, no heavy fats", caloriePct: 0.10, example: "Apple + handful of almonds", mealSlot: .afternoonSnack, offset: 16),
            .init(offsetLabel: "19:00", label: "Dinner", description: "Recovery-focused, protein + vegetables", caloriePct: 0.25, example: "Anti-inflammatory salmon bowl", mealSlot: .evening, offset: 19),
        ],
        hydrationNote: "Rest days still need 2-3L fluid. Keep a bottle nearby and sip steadily."
    )

    private static let recoveryTemplate = TimelineTemplate(
        dayType: .recovery,
        slots: [
            .init(offsetLabel: "07:00", label: "Breakfast", description: "Anti-inflammatory, protein-rich start", caloriePct: 0.25, example: "Recovery berry protein bowl", mealSlot: .breakfast, offset: 7),
            .init(offsetLabel: "10:00", label: "Mid-Morning Snack", description: "Protein + polyphenols", caloriePct: 0.10, example: "Tart cherry juice + handful of nuts", mealSlot: .midMorningSnack, offset: 10),
            .init(offsetLabel: "13:00", label: "Lunch", description: "High-protein, micronutrient-dense", caloriePct: 0.30, example: "Salmon, quinoa and leafy greens", mealSlot: .preTrainingMeal, offset: 13),
            .init(offsetLabel: "16:00", label: "Afternoon Snack", description: "Light carbs + protein", caloriePct: 0.10, example: "Greek yogurt with berries", mealSlot: .afternoonSnack, offset: 16),
            .init(offsetLabel: "19:00", label: "Dinner", description: "Omega-3 rich, anti-inflammatory dinner", caloriePct: 0.25, example: "Grilled mackerel with sweet potato", mealSlot: .evening, offset: 19),
        ],
        hydrationNote: "Recovery days need extra fluid to help clear soreness. Aim for 2.5-3L."
    )

    // MARK: - Time helpers

    /// Parse an "HH:mm" string into hour and minute components.
    static func parseTime(_ value: String) -> (hour: Int, minute: Int) {
        let parts = value.split(separator: ":")
        let hour = parts.count > 0 ? Int(parts[0]) ?? 15 : 15
        let minute = parts.count > 1 ? Int(parts[1]) ?? 0 : 0
        return (hour, minute)
    }

    /// Format hour/minute into a normalised "HH:mm" string.
    static func formatTime(hour: Int, minute: Int) -> String {
        let h = ((hour % 24) + 24) % 24
        let m = ((minute % 60) + 60) % 60
        return String(format: "%02d:%02d", h, m)
    }

    /// Total minutes from midnight for a timeline slot.
    private static func minutes(
        forSlotAt index: Int,
        template: TimelineTemplate,
        sessionMinutes: Int
    ) -> Int? {
        guard index < template.slots.count else { return nil }
        let slot = template.slots[index]

        if template.dayType == .match, index == TimelineTemplate.matchHalfTimeIndex {
            return sessionMinutes + TimelineTemplate.halfTimeOffsetMinutes
        }
        if template.dayType == .rest || template.dayType == .recovery {
            return Int(slot.offset) * 60
        }
        return sessionMinutes + Int((slot.offset * 60).rounded())
    }

    /// Build the resolved timeline for a session time.
    static func generate(sessionTime: String, template: TimelineTemplate) -> [TimelineEntry] {
        let parsed = parseTime(sessionTime)
        let sessionMinutes = parsed.hour * 60 + parsed.minute

        return template.slots.enumerated().map { index, slot in
            let timeLabel: String
            if template.dayType == .match, index == TimelineTemplate.matchHalfTimeIndex {
                timeLabel = "Half-Time"
            } else if let mins = minutes(forSlotAt: index, template: template, sessionMinutes: sessionMinutes) {
                timeLabel = formatTime(hour: mins / 60, minute: mins % 60)
            } else {
                timeLabel = slot.offsetLabel
            }

            return TimelineEntry(
                index: index,
                offsetLabel: slot.offsetLabel,
                timeLabel: timeLabel,
                label: slot.label,
                description: slot.description,
                caloriePct: slot.caloriePct,
                example: slot.example,
                mealSlot: slot.mealSlot
            )
        }
    }

    /// Index of the timeline entry that is currently active given the wall clock.
    static func activeIndex(template: TimelineTemplate, sessionTime: String, now: Date = Date()) -> Int {
        let calendar = Calendar.current
        let nowMinutes = calendar.component(.hour, from: now) * 60 + calendar.component(.minute, from: now)
        let parsed = parseTime(sessionTime)
        let sessionMinutes = parsed.hour * 60 + parsed.minute

        let entryMinutes = template.slots.indices.compactMap {
            minutes(forSlotAt: $0, template: template, sessionMinutes: sessionMinutes)
        }
        guard !entryMinutes.isEmpty else { return 0 }

        var active = 0
        for (index, mins) in entryMinutes.enumerated() where nowMinutes >= mins {
            active = index
        }
        if let last = entryMinutes.last, nowMinutes > last + 30 {
            active = template.slots.count - 1
        }
        return active
    }

    /// Resolve a timeline entry to a concrete `Date` today, or nil for non-clock slots.
    static func date(
        forEntryAt index: Int,
        template: TimelineTemplate,
        sessionTime: String,
        now: Date = Date()
    ) -> Date? {
        let parsed = parseTime(sessionTime)
        let sessionMinutes = parsed.hour * 60 + parsed.minute
        guard let mins = minutes(forSlotAt: index, template: template, sessionMinutes: sessionMinutes) else {
            return nil
        }
        return Calendar.current.date(
            bySettingHour: (mins / 60) % 24,
            minute: mins % 60,
            second: 0,
            of: now
        )
    }

    /// Friendly "in 2h 15m" / "in 40 min" phrasing for a time interval.
    static func formatDuration(_ interval: TimeInterval) -> String {
        let mins = max(0, Int((interval / 60).rounded()))
        if mins <= 0 { return "soon" }
        if mins < 60 { return "in \(mins) min" }
        let hours = mins / 60
        let remainder = mins % 60
        if remainder == 0 { return "in \(hours)h" }
        return "in \(hours)h \(remainder)m"
    }
}
