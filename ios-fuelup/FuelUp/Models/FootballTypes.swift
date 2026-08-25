//
//  FootballTypes.swift
//  FuelUp
//
//  Football-specific domain enums shared across the app.
//

import SwiftUI

nonisolated enum Gender: String, Codable, CaseIterable, Identifiable, Sendable {
    case male, female, other

    var id: String { rawValue }

    var label: String {
        switch self {
        case .male: "Male"
        case .female: "Female"
        case .other: "Other"
        }
    }

    var icon: String {
        switch self {
        case .male: "♂️"
        case .female: "♀️"
        case .other: "⚧️"
        }
    }
}

nonisolated enum FootballPosition: String, Codable, CaseIterable, Identifiable, Sendable {
    case goalkeeper
    case centreBack = "centre_back"
    case fullBack = "full_back"
    case defensiveMid = "defensive_mid"
    case centralMid = "central_mid"
    case attackingMid = "attacking_mid"
    case winger
    case striker

    var id: String { rawValue }

    var label: String {
        switch self {
        case .goalkeeper: "Goalkeeper"
        case .centreBack: "Centre-Back"
        case .fullBack: "Full-Back / Wing-Back"
        case .defensiveMid: "Defensive Midfielder"
        case .centralMid: "Central Midfielder"
        case .attackingMid: "Attacking Mid / No. 10"
        case .winger: "Winger"
        case .striker: "Striker"
        }
    }

    /// Shorter label used in compact pills and targets cards.
    var shortLabel: String {
        switch self {
        case .goalkeeper: "Goalkeeper"
        case .centreBack: "Centre-Back"
        case .fullBack: "Full-Back"
        case .defensiveMid: "Defensive Midfielder"
        case .centralMid: "Central Midfielder"
        case .attackingMid: "Attacking Midfielder"
        case .winger: "Winger"
        case .striker: "Striker"
        }
    }

    var icon: String {
        switch self {
        case .goalkeeper: "🧤"
        case .centreBack: "🛡️"
        case .fullBack: "🏃"
        case .defensiveMid: "⚙️"
        case .centralMid: "🎯"
        case .attackingMid: "🎨"
        case .winger: "⚡"
        case .striker: "🔥"
        }
    }

    var desc: String {
        switch self {
        case .goalkeeper: "Reactions & power"
        case .centreBack: "Strength & aerial duels"
        case .fullBack: "Endurance & crossing"
        case .defensiveMid: "Engine & ball winning"
        case .centralMid: "Box-to-box coverage"
        case .attackingMid: "Creativity & vision"
        case .winger: "Sprint speed & dribbling"
        case .striker: "Explosiveness & finishing"
        }
    }

    /// Extra calories burned on training/match days for this position.
    var calorieBoost: Int {
        switch self {
        case .goalkeeper: 150
        case .centreBack: 175
        case .fullBack: 350
        case .defensiveMid: 275
        case .centralMid: 300
        case .attackingMid: 300
        case .winger: 375
        case .striker: 275
        }
    }
}

nonisolated enum TrainingFrequency: String, Codable, CaseIterable, Identifiable, Sendable {
    case oneToTwo = "1-2"
    case threeToFour = "3-4"
    case fiveToSix = "5-6"
    case daily

    var id: String { rawValue }

    var label: String {
        switch self {
        case .oneToTwo: "1–2× per week"
        case .threeToFour: "3–4× per week"
        case .fiveToSix: "5–6× per week"
        case .daily: "Daily + matches"
        }
    }

    var icon: String {
        self == .daily ? "🔥" : "📅"
    }

    var desc: String {
        switch self {
        case .oneToTwo: "Light training schedule"
        case .threeToFour: "Regular training load"
        case .fiveToSix: "High training frequency"
        case .daily: "Elite-level commitment"
        }
    }

    /// Activity multiplier applied to BMR to reach TDEE.
    var activityMultiplier: Double {
        switch self {
        case .oneToTwo: 1.375
        case .threeToFour: 1.55
        case .fiveToSix: 1.725
        case .daily: 1.9
        }
    }
}

nonisolated enum SeasonPhase: String, Codable, CaseIterable, Identifiable, Sendable {
    case preSeason = "pre_season"
    case inSeason = "in_season"
    case offSeason = "off_season"
    case injuryRecovery = "injury_recovery"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .preSeason: "Pre-Season"
        case .inSeason: "In-Season"
        case .offSeason: "Off-Season"
        case .injuryRecovery: "Injury Recovery"
        }
    }

    var icon: String {
        switch self {
        case .preSeason: "🏋️"
        case .inSeason: "⚽"
        case .offSeason: "🏖️"
        case .injuryRecovery: "🩹"
        }
    }

    var desc: String {
        switch self {
        case .preSeason: "Building fitness & strength"
        case .inSeason: "Active competition period"
        case .offSeason: "Recovery & maintenance"
        case .injuryRecovery: "Healing & rehabilitation"
        }
    }

    var calorieAdjustment: Double {
        switch self {
        case .preSeason: 1.1
        case .inSeason: 1.0
        case .offSeason: 0.92
        case .injuryRecovery: 0.95
        }
    }
}

nonisolated enum PerformanceGoal: String, Codable, CaseIterable, Identifiable, Sendable {
    case leanFast = "lean_fast"
    case endurance
    case musclePower = "muscle_power"
    case injuryRecovery = "injury_recovery"
    case general

    var id: String { rawValue }

    var label: String {
        switch self {
        case .leanFast: "Get leaner & faster"
        case .endurance: "Build match endurance"
        case .musclePower: "Gain muscle & power"
        case .injuryRecovery: "Recover from injury"
        case .general: "General performance"
        }
    }

    var icon: String {
        switch self {
        case .leanFast: "⚡"
        case .endurance: "🏃"
        case .musclePower: "💪"
        case .injuryRecovery: "🩹"
        case .general: "🎯"
        }
    }

    var desc: String {
        switch self {
        case .leanFast: "Drop weight, gain speed"
        case .endurance: "Last 90 minutes and beyond"
        case .musclePower: "Get stronger for duels"
        case .injuryRecovery: "Fuel healing & return"
        case .general: "Overall match-day fueling"
        }
    }
}

nonisolated enum DayType: String, Codable, CaseIterable, Identifiable, Sendable {
    case training, match, rest, recovery

    var id: String { rawValue }

    var label: String {
        switch self {
        case .training: "Training Day"
        case .match: "Match Day"
        case .rest: "Rest Day"
        case .recovery: "Recovery Day"
        }
    }

    /// Compact label used in the weekly schedule editor.
    var shortLabel: String {
        switch self {
        case .training: "Training"
        case .match: "Match Day"
        case .rest: "Rest"
        case .recovery: "Recovery"
        }
    }

    var emoji: String {
        switch self {
        case .training: "🟢"
        case .match: "🔴"
        case .rest: "⚪"
        case .recovery: "🟡"
        }
    }

    var subtitle: String {
        switch self {
        case .training: "Eat to perform."
        case .match: "Fuel for the pitch!"
        case .rest: "Recover & refuel."
        case .recovery: "Repair & rebuild."
        }
    }

    var color: Color {
        switch self {
        case .training: Theme.training
        case .match: Theme.match
        case .rest: Theme.rest
        case .recovery: Theme.recovery
        }
    }

    /// SF Symbol representing this day type.
    var symbol: String {
        switch self {
        case .training: "dumbbell.fill"
        case .match: "trophy.fill"
        case .rest: "moon.fill"
        case .recovery: "heart.fill"
        }
    }

    var planTitle: String {
        switch self {
        case .training: "Training Day Fuel Plan"
        case .match: "Match Day Fuel Plan"
        case .rest: "Rest Day Fuel Plan"
        case .recovery: "Recovery Day Fuel Plan"
        }
    }

    var planSubtitle: String {
        switch self {
        case .training: "Timeline your eating around today's session"
        case .match: "Timeline your eating around kickoff"
        case .rest: "Lighter day, steady recovery"
        case .recovery: "Repair & rebuild with anti-inflammatory foods"
        }
    }

    /// Gradient behind the day fuel plan header.
    var headerGradient: [Color] {
        switch self {
        case .training: [Color(hex: "#0f2f1a"), Color(hex: "#0f3d2a"), Theme.background]
        case .match: [Color(hex: "#3a1a1a"), Color(hex: "#2a1212"), Theme.background]
        case .rest: [Color(hex: "#1f2229"), Color(hex: "#1a1d23"), Theme.background]
        case .recovery: [Color(hex: "#2a1d0f"), Color(hex: "#1f1a12"), Theme.background]
        }
    }

    /// Gradient used on the home screen day fuel plan card.
    var cardGradient: [Color] {
        switch self {
        case .training: [Color(hex: "#0f2f1a"), Color(hex: "#0f3d2a")]
        case .match: [Color(hex: "#3a1a1a"), Color(hex: "#2a1212")]
        case .rest: [Color(hex: "#1f2229"), Color(hex: "#1a1d23")]
        case .recovery: [Color(hex: "#2a1d0f"), Color(hex: "#1f1a12")]
        }
    }

    /// Accent used for calorie/flame details inside the plan.
    var accentColor: Color {
        self == .rest ? Theme.primary : color
    }

    /// TDEE multiplier for this day type.
    var calorieMultiplier: Double {
        switch self {
        case .rest: 0.9
        case .training: 1.15
        case .match: 1.3
        case .recovery: 1.1
        }
    }

    /// Macro split percentages (protein, carbs, fat).
    var macroSplit: (protein: Double, carbs: Double, fat: Double) {
        switch self {
        case .rest: (30, 40, 30)
        case .training: (25, 50, 25)
        case .match: (20, 60, 20)
        case .recovery: (30, 45, 25)
        }
    }

    /// Additional litres of water on top of the body-weight baseline.
    var waterBonus: Double {
        switch self {
        case .rest: 0
        case .training: 0.75
        case .match: 1.0
        case .recovery: 0.5
        }
    }

    /// Label shown above the session time in the plan header.
    var sessionLabel: String {
        switch self {
        case .match: "KICKOFF"
        case .training: "TRAINING"
        case .rest, .recovery: "DAY"
        }
    }

    /// Human label for hydration copy and time picker titles.
    var sessionName: String {
        switch self {
        case .match: "Kickoff"
        case .training: "Training"
        case .rest: "Rest"
        case .recovery: "Recovery"
        }
    }

    /// Whether this day has a user-editable session time.
    var hasEditableSession: Bool {
        self == .match || self == .training
    }
}

nonisolated enum CookingSkill: String, Codable, CaseIterable, Identifiable, Sendable {
    case beginner, intermediate, advanced

    var id: String { rawValue }

    var label: String {
        switch self {
        case .beginner: "Beginner"
        case .intermediate: "Intermediate"
        case .advanced: "Advanced"
        }
    }

    var icon: String {
        switch self {
        case .beginner: "🍳"
        case .intermediate: "👨‍🍳"
        case .advanced: "🔥"
        }
    }

    var desc: String {
        switch self {
        case .beginner: "I can boil water and follow simple steps"
        case .intermediate: "I'm comfortable with basic cooking techniques"
        case .advanced: "I enjoy complex recipes and new techniques"
        }
    }
}

nonisolated enum CookTimeFilter: String, Codable, CaseIterable, Identifiable, Sendable {
    case any
    case under15 = "under_15"
    case under30 = "under_30"
    case under45 = "under_45"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .any: "Any time"
        case .under15: "Under 15 min"
        case .under30: "Under 30 min"
        case .under45: "Under 45 min"
        }
    }

    var icon: String {
        switch self {
        case .any: "♾️"
        case .under15: "⚡"
        case .under30: "⏱"
        case .under45: "🕐"
        }
    }
}

nonisolated enum DietType: String, Codable, CaseIterable, Identifiable, Sendable {
    case balanced, vegetarian, vegan, pescatarian, mediterranean, halal

    var id: String { rawValue }

    var label: String {
        switch self {
        case .balanced: "Balanced"
        case .vegetarian: "Vegetarian"
        case .vegan: "Vegan"
        case .pescatarian: "Pescatarian"
        case .mediterranean: "Mediterranean"
        case .halal: "Halal"
        }
    }

    var icon: String {
        switch self {
        case .balanced: "🍽️"
        case .vegetarian: "🥬"
        case .vegan: "🌱"
        case .pescatarian: "🐟"
        case .mediterranean: "🫒"
        case .halal: "🕌"
        }
    }
}

nonisolated enum Allergy: String, Codable, CaseIterable, Identifiable, Sendable {
    case gluten, dairy, nuts, soy, eggs, shellfish, none

    var id: String { rawValue }

    var label: String {
        switch self {
        case .gluten: "Gluten"
        case .dairy: "Dairy"
        case .nuts: "Nuts"
        case .soy: "Soy"
        case .eggs: "Eggs"
        case .shellfish: "Shellfish"
        case .none: "None"
        }
    }

    var icon: String {
        switch self {
        case .gluten: "🌾"
        case .dairy: "🥛"
        case .nuts: "🥜"
        case .soy: "🫘"
        case .eggs: "🥚"
        case .shellfish: "🦐"
        case .none: "✅"
        }
    }
}

nonisolated enum KitchenEquipment: String, Codable, CaseIterable, Identifiable, Sendable {
    case oven, microwave, stovetop
    case airFryer = "air_fryer"
    case grill, blender

    var id: String { rawValue }

    var label: String {
        switch self {
        case .oven: "Oven"
        case .microwave: "Microwave"
        case .stovetop: "Stovetop"
        case .airFryer: "Air Fryer"
        case .grill: "Grill"
        case .blender: "Blender"
        }
    }

    var icon: String {
        switch self {
        case .oven: "🔥"
        case .microwave: "📡"
        case .stovetop: "🍳"
        case .airFryer: "🌀"
        case .grill: "🥩"
        case .blender: "🥤"
        }
    }
}

/// An EU country with its flag, used for retailer price localisation.
nonisolated struct CountryOption: Identifiable, Hashable, Sendable {
    let code: String
    let name: String
    let flag: String

    var id: String { code }
}

nonisolated enum Countries {
    static let all: [CountryOption] = [
        .init(code: "AT", name: "Austria", flag: "🇦🇹"),
        .init(code: "BE", name: "Belgium", flag: "🇧🇪"),
        .init(code: "BG", name: "Bulgaria", flag: "🇧🇬"),
        .init(code: "HR", name: "Croatia", flag: "🇭🇷"),
        .init(code: "CY", name: "Cyprus", flag: "🇨🇾"),
        .init(code: "CZ", name: "Czech Republic", flag: "🇨🇿"),
        .init(code: "DK", name: "Denmark", flag: "🇩🇰"),
        .init(code: "EE", name: "Estonia", flag: "🇪🇪"),
        .init(code: "FI", name: "Finland", flag: "🇫🇮"),
        .init(code: "FR", name: "France", flag: "🇫🇷"),
        .init(code: "DE", name: "Germany", flag: "🇩🇪"),
        .init(code: "GR", name: "Greece", flag: "🇬🇷"),
        .init(code: "HU", name: "Hungary", flag: "🇭🇺"),
        .init(code: "IE", name: "Ireland", flag: "🇮🇪"),
        .init(code: "IT", name: "Italy", flag: "🇮🇹"),
        .init(code: "LV", name: "Latvia", flag: "🇱🇻"),
        .init(code: "LT", name: "Lithuania", flag: "🇱🇹"),
        .init(code: "LU", name: "Luxembourg", flag: "🇱🇺"),
        .init(code: "MT", name: "Malta", flag: "🇲🇹"),
        .init(code: "NL", name: "Netherlands", flag: "🇳🇱"),
        .init(code: "PL", name: "Poland", flag: "🇵🇱"),
        .init(code: "PT", name: "Portugal", flag: "🇵🇹"),
        .init(code: "RO", name: "Romania", flag: "🇷🇴"),
        .init(code: "SK", name: "Slovakia", flag: "🇸🇰"),
        .init(code: "SI", name: "Slovenia", flag: "🇸🇮"),
        .init(code: "ES", name: "Spain", flag: "🇪🇸"),
        .init(code: "SE", name: "Sweden", flag: "🇸🇪"),
    ]

    static func option(named name: String) -> CountryOption? {
        all.first { $0.name == name }
    }

    /// Top discount retailers per country, used for the onboarding preview.
    static func topRetailers(forCountryNamed name: String) -> [String] {
        switch name {
        case "Germany": ["Lidl", "Aldi", "Penny"]
        case "France": ["Lidl", "Leclerc", "Carrefour"]
        case "Spain": ["Lidl", "Mercadona", "Dia"]
        case "Italy": ["Lidl", "Eurospin", "Conad"]
        case "Netherlands": ["Lidl", "Albert Heijn", "Jumbo"]
        case "Belgium": ["Lidl", "Colruyt", "Delhaize"]
        case "Austria": ["Hofer", "Lidl", "Billa"]
        case "Poland": ["Lidl", "Biedronka", "Netto"]
        case "Portugal": ["Lidl", "Pingo Doce", "Continente"]
        case "Ireland": ["Lidl", "Aldi", "Tesco"]
        case "Sweden": ["Lidl", "Willys", "ICA"]
        case "Denmark": ["Netto", "Lidl", "Rema 1000"]
        case "Finland": ["Lidl", "S-market", "K-Market"]
        case "Greece": ["Lidl", "AB Vassilopoulos", "Sklavenitis"]
        case "Czech Republic": ["Lidl", "Kaufland", "Penny"]
        default: ["Lidl", "Aldi", "Local Supermarket"]
        }
    }
}
