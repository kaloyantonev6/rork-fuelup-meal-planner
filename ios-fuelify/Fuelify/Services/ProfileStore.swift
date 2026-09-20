//
//  ProfileStore.swift
//  Fuelify
//
//  Owns the persisted player profile and onboarding state.
//

import Foundation
import Observation

@Observable
final class ProfileStore {
    private enum Keys {
        static let profile = "fuelify_profile_v1"
        static let onboarded = "fuelify_onboarded_v1"
        // Pre-rebrand keys — still read so existing installs keep their data.
        static let legacyProfile = "fuelup_profile_v1"
        static let legacyOnboarded = "fuelup_onboarded_v1"
    }

    private let defaults: UserDefaults

    var profile: UserProfile {
        didSet {
            guard profile != oldValue else { return }
            persistProfile()
        }
    }

    var hasOnboarded: Bool {
        didSet {
            guard hasOnboarded != oldValue else { return }
            defaults.set(hasOnboarded, forKey: Keys.onboarded)
        }
    }

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults

        if let data = defaults.data(forKey: Keys.profile) ?? defaults.data(forKey: Keys.legacyProfile),
           let decoded = try? JSONDecoder().decode(UserProfile.self, from: data) {
            self.profile = decoded
        } else {
            self.profile = .default
        }
        self.hasOnboarded = defaults.object(forKey: Keys.onboarded) != nil
            ? defaults.bool(forKey: Keys.onboarded)
            : defaults.bool(forKey: Keys.legacyOnboarded)
    }

    /// Today's day type from the weekly schedule.
    var todayDayType: DayType {
        profile.todayDayType
    }

    /// Targets for today.
    var todayTargets: DailyTargets {
        NutritionEngine.dailyTargets(profile: profile, dayType: todayDayType)
    }

    func completeOnboarding() {
        hasOnboarded = true
    }

    /// Reset the profile and return to onboarding.
    func signOut() {
        profile = .default
        hasOnboarded = false
    }

    /// Persist a picked profile image into the documents directory and store its path.
    func saveProfileImage(_ data: Data) {
        let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let url = directory.appendingPathComponent("profile-image.jpg")
        do {
            try data.write(to: url, options: .atomic)
            // Store just the filename so the path survives container changes between launches.
            profile.profileImagePath = url.lastPathComponent
        } catch {
            print("[ProfileStore] Failed to save profile image: \(error.localizedDescription)")
        }
    }

    /// Resolve the stored profile image filename to a full URL.
    var profileImageURL: URL? {
        guard let name = profile.profileImagePath, !name.isEmpty else { return nil }
        let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let url = directory.appendingPathComponent(name)
        return FileManager.default.fileExists(atPath: url.path) ? url : nil
    }

    private func persistProfile() {
        do {
            let data = try JSONEncoder().encode(profile)
            defaults.set(data, forKey: Keys.profile)
        } catch {
            print("[ProfileStore] Failed to persist profile: \(error.localizedDescription)")
        }
    }
}
