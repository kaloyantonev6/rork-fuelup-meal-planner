//
//  ShoppingData.swift
//  FuelUp
//
//  Shopping list, retailer and budget models plus their seed data.
//

import Foundation

nonisolated struct ShoppingItem: Identifiable, Codable, Equatable, Sendable {
    let id: String
    let name: String
    let amount: String
    let unit: String
    let category: String
    var checked: Bool
    let bestPrice: Double
    let originalPrice: Double
    let retailer: String
    let discount: Int

    var savings: Double { max(0, originalPrice - bestPrice) }
}

nonisolated struct Retailer: Identifiable, Hashable, Sendable {
    let id: String
    let name: String
    let logo: String
    let discountCount: Int
}

nonisolated struct Purchase: Identifiable, Codable, Equatable, Sendable {
    let id: String
    var storeName: String
    var amount: Double
    /// Stored as "yyyy-MM-dd".
    var date: String
    var note: String?
}

/// A completed week's budget summary shown in the history list.
nonisolated struct WeeklyBudgetSummary: Identifiable, Sendable {
    let weekStart: String
    let weekEnd: String
    let budget: Double
    let totalSpent: Double
    let purchaseCount: Int

    var id: String { weekStart }

    var percentage: Double {
        budget > 0 ? (totalSpent / budget) * 100 : 0
    }
}

nonisolated enum SeedData {
    static let shoppingList: [ShoppingItem] = [
        .init(id: "s1", name: "Quinoa", amount: "200", unit: "g", category: "Grains", checked: false, bestPrice: 1.89, originalPrice: 2.49, retailer: "Lidl", discount: 24),
        .init(id: "s2", name: "Cherry Tomatoes", amount: "150", unit: "g", category: "Vegetables", checked: false, bestPrice: 1.29, originalPrice: 1.49, retailer: "Aldi", discount: 13),
        .init(id: "s3", name: "Cucumber", amount: "1", unit: "pc", category: "Vegetables", checked: false, bestPrice: 0.49, originalPrice: 0.69, retailer: "Lidl", discount: 29),
        .init(id: "s4", name: "Chickpeas (canned)", amount: "400", unit: "g", category: "Legumes", checked: false, bestPrice: 0.59, originalPrice: 0.89, retailer: "Aldi", discount: 34),
        .init(id: "s5", name: "Feta Cheese", amount: "200", unit: "g", category: "Dairy", checked: false, bestPrice: 1.49, originalPrice: 1.99, retailer: "Kaufland", discount: 25),
        .init(id: "s6", name: "Rolled Oats", amount: "500", unit: "g", category: "Grains", checked: false, bestPrice: 0.99, originalPrice: 1.29, retailer: "Aldi", discount: 23),
        .init(id: "s7", name: "Greek Yogurt", amount: "400", unit: "g", category: "Dairy", checked: false, bestPrice: 1.19, originalPrice: 1.59, retailer: "Lidl", discount: 25),
        .init(id: "s8", name: "Mixed Berries (frozen)", amount: "300", unit: "g", category: "Fruits", checked: false, bestPrice: 2.29, originalPrice: 3.19, retailer: "Kaufland", discount: 28),
        .init(id: "s9", name: "Chicken Breast", amount: "500", unit: "g", category: "Protein", checked: false, bestPrice: 3.99, originalPrice: 5.49, retailer: "Lidl", discount: 27),
        .init(id: "s10", name: "Sweet Potato", amount: "500", unit: "g", category: "Vegetables", checked: false, bestPrice: 1.29, originalPrice: 1.79, retailer: "Edeka", discount: 28),
        .init(id: "s11", name: "Broccoli", amount: "300", unit: "g", category: "Vegetables", checked: false, bestPrice: 0.99, originalPrice: 1.29, retailer: "Aldi", discount: 23),
        .init(id: "s12", name: "Apple", amount: "4", unit: "pc", category: "Fruits", checked: false, bestPrice: 1.49, originalPrice: 1.99, retailer: "Penny", discount: 25),
        .init(id: "s13", name: "Almond Butter", amount: "250", unit: "g", category: "Nuts", checked: false, bestPrice: 3.49, originalPrice: 4.29, retailer: "Kaufland", discount: 19),
        .init(id: "s14", name: "Olive Oil", amount: "500", unit: "ml", category: "Oils", checked: false, bestPrice: 3.79, originalPrice: 4.99, retailer: "Lidl", discount: 24),
    ]

    static let retailers: [Retailer] = [
        .init(id: "r1", name: "Lidl", logo: "🏪", discountCount: 42),
        .init(id: "r2", name: "Aldi", logo: "🛒", discountCount: 38),
        .init(id: "r3", name: "Kaufland", logo: "🏬", discountCount: 31),
        .init(id: "r4", name: "Edeka", logo: "🛍️", discountCount: 27),
        .init(id: "r5", name: "Penny", logo: "💰", discountCount: 35),
        .init(id: "r6", name: "REWE", logo: "🧺", discountCount: 29),
    ]

    /// Category display order for the cart.
    static let categoryOrder = [
        "Protein", "Grains", "Vegetables", "Fruits", "Dairy", "Legumes", "Nuts", "Oils",
    ]
}

nonisolated extension DateFormatter {
    /// Shared "yyyy-MM-dd" formatter used for storage keys.
    static let storageDay: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.locale = Locale(identifier: "en_US_POSIX")
        return formatter
    }()
}
