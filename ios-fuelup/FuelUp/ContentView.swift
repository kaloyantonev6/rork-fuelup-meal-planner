//
//  ContentView.swift
//  FuelUp
//
//  Root view: routes between onboarding and the main tab experience.
//

import SwiftUI

struct ContentView: View {
    @Environment(ProfileStore.self) private var profileStore
    @Environment(NotificationService.self) private var notifications
    @Environment(DayProgressStore.self) private var progress
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        Group {
            if profileStore.hasOnboarded {
                MainTabView()
                    .transition(.opacity.combined(with: .scale(scale: 1.02)))
            } else {
                OnboardingView()
                    .transition(.opacity)
            }
        }
        .animation(.spring(response: 0.5, dampingFraction: 0.9), value: profileStore.hasOnboarded)
        .background(Theme.background)
        .preferredColorScheme(.dark)
        .task(id: profileStore.hasOnboarded) {
            guard profileStore.hasOnboarded else { return }
            await notifications.reschedule(for: profileStore.profile)
        }
        .onChange(of: scenePhase) { _, newPhase in
            guard newPhase == .active else { return }
            // Roll over hydration/completion if the day changed while backgrounded.
            progress.refresh()
            let profile = profileStore.profile
            Task {
                await notifications.reschedule(for: profile)
            }
        }
    }
}
