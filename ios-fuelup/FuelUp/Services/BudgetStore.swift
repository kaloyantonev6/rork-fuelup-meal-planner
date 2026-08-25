//
//  BudgetStore.swift
//  FuelUp
//
//  Weekly grocery budget tracking with purchase logging and history.
//

import Foundation
import Observation
import SwiftUI

@Observable
final class BudgetStore {
    private enum Keys {
        static let budget = "fuelup_weekly_budget_v1"
        static let purchases = "fuelup_purchases_v1"
    }

    private let defaults: UserDefaults

    var weeklyBudget: Double {
        didSet {
            guard weeklyBudget != oldValue else { return }
            defaults.set(weeklyBudget, forKey: Keys.budget)
        }
    }

    private(set) var allPurchases: [Purchase] = []

    init(defaults: UserDefaults = .standard, fallbackBudget: Double = 35) {
        self.defaults = defaults
        let stored = defaults.double(forKey: Keys.budget)
        self.weeklyBudget = stored > 0 ? stored : fallbackBudget

        if let data = defaults.data(forKey: Keys.purchases),
           let decoded = try? JSONDecoder().decode([Purchase].self, from: data) {
            self.allPurchases = decoded
        }
    }

    // MARK: - Week boundaries

    /// Monday-anchored start of the week containing `date`.
    private func weekStart(for date: Date) -> Date {
        var calendar = Calendar(identifier: .gregorian)
        calendar.firstWeekday = 2 // Monday
        let components = calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)
        return calendar.date(from: components) ?? calendar.startOfDay(for: date)
    }

    private var currentWeekStart: Date { weekStart(for: Date()) }

    private var currentWeekEnd: Date {
        Calendar.current.date(byAdding: .day, value: 6, to: currentWeekStart) ?? currentWeekStart
    }

    /// Human-readable range for the current week, e.g. "Aug 12 – Aug 18".
    var currentWeekRange: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        return "\(formatter.string(from: currentWeekStart)) – \(formatter.string(from: currentWeekEnd))"
    }

    private func date(fromStorage value: String) -> Date? {
        DateFormatter.storageDay.date(from: value)
    }

    // MARK: - Current week

    /// Purchases in the current week, newest first.
    var purchases: [Purchase] {
        let start = currentWeekStart
        let end = currentWeekEnd
        return allPurchases
            .filter { purchase in
                guard let date = date(fromStorage: purchase.date) else { return false }
                return date >= start && date <= Calendar.current.date(byAdding: .day, value: 1, to: end)!
            }
            .sorted { $0.date > $1.date }
    }

    var totalSpent: Double {
        purchases.reduce(0) { $0 + $1.amount }
    }

    var remaining: Double { weeklyBudget - totalSpent }

    var spentPercentage: Double {
        weeklyBudget > 0 ? (totalSpent / weeklyBudget) * 100 : 0
    }

    /// Colour reflecting how close the player is to their limit.
    var progressColor: Color {
        if spentPercentage > 100 { return Theme.error }
        if spentPercentage > 85 { return Theme.warning }
        return Theme.primary
    }

    var statusLabel: String {
        if spentPercentage > 100 { return "Over Budget" }
        if spentPercentage > 85 { return "Almost Full" }
        if spentPercentage > 60 { return "Getting Close" }
        return "On Track"
    }

    /// Days elapsed in the current week, at least one.
    var daysElapsed: Int {
        let days = Calendar.current.dateComponents([.day], from: currentWeekStart, to: Date()).day ?? 0
        return max(1, min(7, days + 1))
    }

    var dailyAverage: Double {
        totalSpent / Double(daysElapsed)
    }

    var projectedTotal: Double {
        dailyAverage * 7
    }

    /// Rough per-meal cost assuming four fuel sessions a day.
    var costPerMeal: Double {
        let meals = Double(daysElapsed * 4)
        return meals > 0 ? totalSpent / meals : 0
    }

    // MARK: - History

    /// Completed weeks before the current one, newest first.
    var weeklyHistory: [WeeklyBudgetSummary] {
        let currentStart = currentWeekStart
        var grouped: [Date: [Purchase]] = [:]

        for purchase in allPurchases {
            guard let date = date(fromStorage: purchase.date) else { continue }
            let start = weekStart(for: date)
            guard start < currentStart else { continue }
            grouped[start, default: []].append(purchase)
        }

        return grouped
            .map { start, items in
                let end = Calendar.current.date(byAdding: .day, value: 6, to: start) ?? start
                return WeeklyBudgetSummary(
                    weekStart: DateFormatter.storageDay.string(from: start),
                    weekEnd: DateFormatter.storageDay.string(from: end),
                    budget: weeklyBudget,
                    totalSpent: items.reduce(0) { $0 + $1.amount },
                    purchaseCount: items.count
                )
            }
            .sorted { $0.weekStart > $1.weekStart }
    }

    // MARK: - Mutations

    func addPurchase(storeName: String, amount: Double, note: String?) {
        let purchase = Purchase(
            id: UUID().uuidString,
            storeName: storeName,
            amount: amount,
            date: DateFormatter.storageDay.string(from: Date()),
            note: note?.isEmpty == true ? nil : note
        )
        allPurchases.append(purchase)
        persist()
    }

    func deletePurchase(id: String) {
        allPurchases.removeAll { $0.id == id }
        persist()
    }

    /// Keep the budget in sync when the player edits it during onboarding or in their profile.
    func syncBudget(with weeklyBudgetFromProfile: Int) {
        let value = Double(weeklyBudgetFromProfile)
        if weeklyBudget != value {
            weeklyBudget = value
        }
    }

    private func persist() {
        do {
            let data = try JSONEncoder().encode(allPurchases)
            defaults.set(data, forKey: Keys.purchases)
        } catch {
            print("[BudgetStore] Failed to persist purchases: \(error.localizedDescription)")
        }
    }
}

nonisolated extension WeeklyBudgetSummary {
    /// Status label and colour for the history row.
    var status: (label: String, color: Color) {
        if percentage > 100 { return ("Over budget", Theme.error) }
        if percentage > 85 { return ("On budget", Theme.warning) }
        return ("Under budget", Theme.primary)
    }

    /// Human range label, e.g. "Aug 5 – Aug 11".
    var rangeLabel: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        guard
            let start = DateFormatter.storageDay.date(from: weekStart),
            let end = DateFormatter.storageDay.date(from: weekEnd)
        else { return weekStart }
        return "\(formatter.string(from: start)) – \(formatter.string(from: end))"
    }
}
