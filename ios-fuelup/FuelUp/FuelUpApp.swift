//
//  FuelUpApp.swift
//  FuelUp
//
//  AI nutrition for footballers.
//

import SwiftUI

@main
struct FuelUpApp: App {
    @State private var profileStore = ProfileStore()
    @State private var progressStore = DayProgressStore()
    @State private var budgetStore = BudgetStore()
    @State private var notifications = NotificationService()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(profileStore)
                .environment(progressStore)
                .environment(budgetStore)
                .environment(notifications)
        }
    }
}
