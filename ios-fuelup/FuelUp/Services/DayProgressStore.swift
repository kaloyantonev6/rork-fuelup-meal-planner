//
//  DayProgressStore.swift
//  FuelUp
//
//  Tracks per-day fuel session completion and hydration.
//  Both reset automatically when the calendar day changes.
//

import Foundation
import Observation

@Observable
final class DayProgressStore {
    private enum Keys {
        static let completedPrefix = "fuelup_completed_sessions_"
        static let hydration = "fuelup_hydration_v1"
    }

    private let defaults: UserDefaults

    /// Indices of completed fuel sessions for the current day.
    private(set) var completedIndices: Set<Int> = []
    /// Millilitres of water logged today.
    private(set) var hydrationMl: Int = 0

    private var loadedDayKey: String

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        self.loadedDayKey = DateFormatter.storageDay.string(from: Date())
        load()
    }

    /// Storage key for today's completed sessions.
    private var completedKey: String {
        Keys.completedPrefix + DateFormatter.storageDay.string(from: Date())
    }

    /// Re-read state, rolling over if the day changed while the app was backgrounded.
    func refresh() {
        let today = DateFormatter.storageDay.string(from: Date())
        if today != loadedDayKey {
            loadedDayKey = today
        }
        load()
    }

    private func load() {
        if let stored = defaults.array(forKey: completedKey) as? [Int] {
            completedIndices = Set(stored)
        } else {
            completedIndices = []
        }

        let today = DateFormatter.storageDay.string(from: Date())
        if let record = defaults.dictionary(forKey: Keys.hydration),
           let date = record["date"] as? String,
           let intake = record["intakeMl"] as? Int,
           date == today {
            hydrationMl = intake
        } else {
            hydrationMl = 0
            persistHydration()
        }
    }

    // MARK: - Completion

    func isCompleted(_ index: Int) -> Bool {
        completedIndices.contains(index)
    }

    /// Toggle a session and report whether it became complete.
    @discardableResult
    func toggle(_ index: Int) -> Bool {
        let willComplete = !completedIndices.contains(index)
        if willComplete {
            completedIndices.insert(index)
        } else {
            completedIndices.remove(index)
        }
        defaults.set(Array(completedIndices).sorted(), forKey: completedKey)
        return willComplete
    }

    var completedCount: Int { completedIndices.count }

    // MARK: - Hydration

    /// Add a 250ml glass of water.
    func addWater(ml: Int = 250) {
        hydrationMl += ml
        persistHydration()
    }

    private func persistHydration() {
        let today = DateFormatter.storageDay.string(from: Date())
        defaults.set(["date": today, "intakeMl": hydrationMl], forKey: Keys.hydration)
    }
}
