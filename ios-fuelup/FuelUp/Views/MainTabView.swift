//
//  MainTabView.swift
//  FuelUp
//
//  Root tab navigation: Fuel, Budget, Profile.
//

import SwiftUI

struct MainTabView: View {
    @State private var selection: Tab = .fuel

    enum Tab: Hashable {
        case fuel, budget, profile
    }

    var body: some View {
        TabView(selection: $selection) {
            HomeView()
                .tag(Tab.fuel)
                .tabItem {
                    Label("Fuel", systemImage: "house.fill")
                }

            BudgetView()
                .tag(Tab.budget)
                .tabItem {
                    Label("Budget", systemImage: "wallet.bifold.fill")
                }

            ProfileView()
                .tag(Tab.profile)
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
        }
        .tint(Theme.primary)
        .preferredColorScheme(.dark)
    }
}
