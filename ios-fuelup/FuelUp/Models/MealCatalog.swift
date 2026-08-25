//
//  MealCatalog.swift
//  FuelUp
//
//  Football-specific meal catalog and the plan generator that maps meals
//  onto the day's fuel slots, scaled to the player's calorie targets.
//

import Foundation

nonisolated struct CatalogMeal: Identifiable, Sendable {
    let id: String
    let name: String
    /// Calories for the reference serving.
    let calories: Int
    let proteinPct: Double
    let carbsPct: Double
    let fatPct: Double
    let prepTime: Int
    let emoji: String
    let fuelReason: String
    let ingredients: [String]
    let slots: [MealSlot]
    let diets: [DietType]
}

nonisolated struct GeneratedMeal: Identifiable, Sendable {
    let id: String
    let slotLabel: String
    let timeLabel: String
    let name: String
    let emoji: String
    let calories: Int
    let protein: Int
    let carbs: Int
    let fat: Int
    let prepTime: Int
    let fuelReason: String
    let ingredients: [String]
}

nonisolated struct GeneratedPlan: Sendable {
    let dayType: DayType
    let meals: [GeneratedMeal]
    let targetCalories: Int
    let targetProtein: Int
    let targetCarbs: Int
    let targetFat: Int

    var totalCalories: Int { meals.reduce(0) { $0 + $1.calories } }
    var totalProtein: Int { meals.reduce(0) { $0 + $1.protein } }
    var totalCarbs: Int { meals.reduce(0) { $0 + $1.carbs } }
    var totalFat: Int { meals.reduce(0) { $0 + $1.fat } }

    /// Unique ingredients across the plan, for the shopping summary.
    var shoppingList: [String] {
        var seen = Set<String>()
        var result: [String] = []
        for meal in meals {
            for ingredient in meal.ingredients where !seen.contains(ingredient.lowercased()) {
                seen.insert(ingredient.lowercased())
                result.append(ingredient)
            }
        }
        return result
    }
}

nonisolated enum MealCatalog {
    static let all: [CatalogMeal] = [
        .init(
            id: "fm_1", name: "Footballer's Overnight Oats", calories: 520,
            proteinPct: 0.20, carbsPct: 0.60, fatPct: 0.20, prepTime: 10, emoji: "🥣",
            fuelReason: "Slow-release carbs top off glycogen before a session without weighing you down.",
            ingredients: ["Rolled Oats", "Greek Yogurt", "Banana", "Honey", "Mixed Berries"],
            slots: [.breakfast], diets: [.balanced, .vegetarian, .mediterranean, .halal]
        ),
        .init(
            id: "fm_2", name: "Pre-Match Pasta with Chicken", calories: 680,
            proteinPct: 0.24, carbsPct: 0.58, fatPct: 0.18, prepTime: 25, emoji: "🍝",
            fuelReason: "Low-fibre, high-carb and easy to digest — the classic pre-kickoff plate.",
            ingredients: ["Pasta", "Chicken Breast", "Tomato Passata", "Olive Oil", "Basil"],
            slots: [.preMatchMeal, .preTrainingMeal], diets: [.balanced, .mediterranean, .halal]
        ),
        .init(
            id: "fm_3", name: "Banana & PB Energy Toast", calories: 260,
            proteinPct: 0.14, carbsPct: 0.60, fatPct: 0.26, prepTime: 5, emoji: "🍌",
            fuelReason: "Fast carbs plus a little fat for a steady top-up 90 minutes out.",
            ingredients: ["Wholegrain Bread", "Almond Butter", "Banana", "Honey"],
            slots: [.preMatchSnack, .preTrainingSnack], diets: [.balanced, .vegetarian, .vegan, .halal]
        ),
        .init(
            id: "fm_4", name: "Electrolyte Water", calories: 0,
            proteinPct: 0, carbsPct: 0, fatPct: 0, prepTime: 1, emoji: "💧",
            fuelReason: "Sodium helps you retain fluid so you start the session properly hydrated.",
            ingredients: ["Water", "Electrolyte Tablet"],
            slots: [.hydration], diets: DietType.allCases
        ),
        .init(
            id: "fm_5", name: "Orange Slices & Sports Drink", calories: 110,
            proteinPct: 0.03, carbsPct: 0.92, fatPct: 0.05, prepTime: 2, emoji: "🍊",
            fuelReason: "Quick sugars at the break keep second-half sprint output high.",
            ingredients: ["Orange", "Sports Drink"],
            slots: [.halfTime], diets: DietType.allCases
        ),
        .init(
            id: "fm_6", name: "Recovery Chocolate Smoothie", calories: 430,
            proteinPct: 0.27, carbsPct: 0.55, fatPct: 0.18, prepTime: 5, emoji: "🥤",
            fuelReason: "A 3:1 carb-to-protein ratio inside the 60-minute recovery window.",
            ingredients: ["Milk", "Cocoa Powder", "Banana", "Whey Protein", "Oats"],
            slots: [.postMatch, .postTraining], diets: [.balanced, .vegetarian, .halal]
        ),
        .init(
            id: "fm_7", name: "Salmon, Sweet Potato & Greens", calories: 620,
            proteinPct: 0.30, carbsPct: 0.42, fatPct: 0.28, prepTime: 30, emoji: "🐟",
            fuelReason: "Omega-3s calm post-match inflammation while carbs reload the tank.",
            ingredients: ["Salmon Fillet", "Sweet Potato", "Broccoli", "Olive Oil", "Lemon"],
            slots: [.evening], diets: [.balanced, .pescatarian, .mediterranean, .halal]
        ),
        .init(
            id: "fm_8", name: "High-Protein Training Wrap", calories: 560,
            proteinPct: 0.28, carbsPct: 0.48, fatPct: 0.24, prepTime: 15, emoji: "🌯",
            fuelReason: "Balanced carbs and protein that sit lightly before pitch work.",
            ingredients: ["Tortilla Wrap", "Chicken Breast", "Greek Yogurt", "Spinach", "Cherry Tomatoes"],
            slots: [.preTrainingMeal, .preMatchMeal], diets: [.balanced, .mediterranean, .halal]
        ),
        .init(
            id: "fm_9", name: "Recovery Berry Protein Bowl", calories: 420,
            proteinPct: 0.28, carbsPct: 0.50, fatPct: 0.22, prepTime: 8, emoji: "🫐",
            fuelReason: "Polyphenols from berries plus protein speed up muscle repair.",
            ingredients: ["Greek Yogurt", "Mixed Berries", "Whey Protein", "Chia Seeds", "Honey"],
            slots: [.breakfast, .midMorningSnack], diets: [.balanced, .vegetarian, .mediterranean, .halal]
        ),
        .init(
            id: "fm_10", name: "Greek Yogurt with Nuts", calories: 280,
            proteinPct: 0.30, carbsPct: 0.32, fatPct: 0.38, prepTime: 3, emoji: "🥜",
            fuelReason: "Casein protein trickles in slowly, keeping repair going between meals.",
            ingredients: ["Greek Yogurt", "Walnuts", "Honey"],
            slots: [.midMorningSnack, .afternoonSnack], diets: [.balanced, .vegetarian, .mediterranean, .halal]
        ),
        .init(
            id: "fm_11", name: "Grilled Chicken & Grain Salad", calories: 590,
            proteinPct: 0.32, carbsPct: 0.44, fatPct: 0.24, prepTime: 20, emoji: "🥗",
            fuelReason: "Lean protein and whole grains for a lighter non-training day.",
            ingredients: ["Chicken Breast", "Quinoa", "Cucumber", "Cherry Tomatoes", "Feta Cheese"],
            slots: [.preTrainingMeal], diets: [.balanced, .mediterranean, .halal]
        ),
        .init(
            id: "fm_12", name: "Apple & Almonds", calories: 230,
            proteinPct: 0.12, carbsPct: 0.48, fatPct: 0.40, prepTime: 1, emoji: "🍎",
            fuelReason: "Simple, portable and no heavy fats to slow you down.",
            ingredients: ["Apple", "Almonds"],
            slots: [.afternoonSnack, .midMorningSnack], diets: DietType.allCases
        ),
        .init(
            id: "fm_13", name: "Anti-Inflammatory Salmon Bowl", calories: 610,
            proteinPct: 0.31, carbsPct: 0.40, fatPct: 0.29, prepTime: 28, emoji: "🍲",
            fuelReason: "Turmeric, greens and omega-3s target soreness on recovery days.",
            ingredients: ["Salmon Fillet", "Quinoa", "Spinach", "Turmeric", "Olive Oil"],
            slots: [.evening], diets: [.balanced, .pescatarian, .mediterranean, .halal]
        ),
        .init(
            id: "fm_14", name: "Tofu & Rice Power Bowl", calories: 570,
            proteinPct: 0.24, carbsPct: 0.54, fatPct: 0.22, prepTime: 22, emoji: "🍚",
            fuelReason: "Plant protein with plenty of carbs to refuel without animal products.",
            ingredients: ["Tofu", "Brown Rice", "Broccoli", "Soy Sauce", "Sesame Oil"],
            slots: [.preTrainingMeal, .evening], diets: [.vegan, .vegetarian, .balanced]
        ),
        .init(
            id: "fm_15", name: "Lentil & Vegetable Stew", calories: 480,
            proteinPct: 0.24, carbsPct: 0.56, fatPct: 0.20, prepTime: 35, emoji: "🍛",
            fuelReason: "Iron and slow carbs — great for endurance across a heavy week.",
            ingredients: ["Lentils", "Carrot", "Onion", "Tomato Passata", "Olive Oil"],
            slots: [.evening, .preTrainingMeal], diets: [.vegan, .vegetarian, .balanced, .mediterranean]
        ),
        .init(
            id: "fm_16", name: "Training Session", calories: 0,
            proteinPct: 0, carbsPct: 0, fatPct: 0, prepTime: 0, emoji: "⚽",
            fuelReason: "Sip 150–250ml of fluid every 15–20 minutes throughout the session.",
            ingredients: ["Water"],
            slots: [.trainingSession], diets: DietType.allCases
        ),
    ]

    /// Meals matching a slot and the player's diet, falling back gracefully.
    static func candidates(for slot: MealSlot, diet: DietType) -> [CatalogMeal] {
        let bySlot = all.filter { $0.slots.contains(slot) }
        let byDiet = bySlot.filter { $0.diets.contains(diet) }
        if !byDiet.isEmpty { return byDiet }
        if !bySlot.isEmpty { return bySlot }
        return all
    }
}

nonisolated enum MealPlanGenerator {
    /// Build a plan for the day, scaling each catalog meal to its share of the
    /// player's calorie target so the totals line up with the timeline.
    static func generate(profile: UserProfile, dayType: DayType, mealsPerDay: Int) -> GeneratedPlan {
        let targets = NutritionEngine.dayTargets(profile: profile, dayType: dayType)
        let template = FuelTimeline.template(for: dayType)
        let entries = FuelTimeline.generate(
            sessionTime: profile.sessionTime(for: dayType),
            template: template
        )

        // Only real meals count toward the plan; hydration and session slots are context.
        var mealEntries = entries.filter(\.isMeal)

        // Respect the player's meals-per-day preference by trimming the smallest snacks.
        if mealEntries.count > mealsPerDay {
            let ranked = mealEntries.sorted { $0.caloriePct > $1.caloriePct }
            let kept = Set(ranked.prefix(mealsPerDay).map(\.index))
            mealEntries = mealEntries.filter { kept.contains($0.index) }
        }

        var usedIds = Set<String>()
        var meals: [GeneratedMeal] = []

        for entry in mealEntries {
            let candidates = MealCatalog.candidates(for: entry.mealSlot, diet: profile.dietType)
            // Prefer a meal we have not already used today.
            let choice = candidates.first { !usedIds.contains($0.id) } ?? candidates.first
            guard let meal = choice else { continue }
            usedIds.insert(meal.id)

            // Scale the reference serving to this slot's share of today's calories.
            let slotCalories = max(80, Int((Double(targets.calories) * entry.caloriePct).rounded()))

            meals.append(
                GeneratedMeal(
                    id: "\(entry.index)_\(meal.id)",
                    slotLabel: entry.label,
                    timeLabel: entry.timeLabel,
                    name: meal.name,
                    emoji: meal.emoji,
                    calories: slotCalories,
                    protein: Int((Double(slotCalories) * meal.proteinPct / 4).rounded()),
                    carbs: Int((Double(slotCalories) * meal.carbsPct / 4).rounded()),
                    fat: Int((Double(slotCalories) * meal.fatPct / 9).rounded()),
                    prepTime: meal.prepTime,
                    fuelReason: meal.fuelReason,
                    ingredients: meal.ingredients
                )
            )
        }

        return GeneratedPlan(
            dayType: dayType,
            meals: meals,
            targetCalories: targets.calories,
            targetProtein: targets.protein,
            targetCarbs: targets.carbs,
            targetFat: targets.fat
        )
    }
}
