//
//  NotificationService.swift
//  FuelUp
//
//  Schedules local reminders 15 minutes before each fuel session.
//  Mirrors `expo/providers/NotificationProvider.tsx`.
//

import Foundation
import Observation
import UserNotifications

@Observable
final class NotificationService {
    /// Minutes before each meal that the reminder fires.
    static let leadMinutes = 15

    private let center = UNUserNotificationCenter.current()
    private var lastScheduledKey = ""

    /// Whether the OS has granted notification permission.
    private(set) var authorizationDenied = false

    /// Request permission, returning whether reminders can be scheduled.
    func requestAuthorization() async -> Bool {
        do {
            let settings = await center.notificationSettings()
            switch settings.authorizationStatus {
            case .authorized, .provisional, .ephemeral:
                authorizationDenied = false
                return true
            case .denied:
                authorizationDenied = true
                return false
            case .notDetermined:
                let granted = try await center.requestAuthorization(options: [.alert, .sound])
                authorizationDenied = !granted
                return granted
            @unknown default:
                return false
            }
        } catch {
            print("[Notifications] Authorization failed: \(error.localizedDescription)")
            return false
        }
    }

    /// Cancel everything we scheduled.
    func cancelAll() {
        center.removeAllPendingNotificationRequests()
        lastScheduledKey = ""
    }

    /// Reschedule today's meal reminders for the given profile.
    func reschedule(for profile: UserProfile) async {
        cancelAll()

        guard profile.mealRemindersEnabled else { return }
        guard await requestAuthorization() else {
            print("[Notifications] Permission not granted — skipping scheduling")
            return
        }

        let dayType = profile.todayDayType
        let sessionTime = profile.sessionTime(for: dayType)
        let template = FuelTimeline.template(for: dayType)
        let entries = FuelTimeline.generate(sessionTime: sessionTime, template: template)

        let todayKey = "\(dayType.rawValue)_\(sessionTime)_\(DateFormatter.storageDay.string(from: Date()))"
        guard lastScheduledKey != todayKey else { return }
        lastScheduledKey = todayKey

        var scheduled = 0
        for entry in entries {
            // Skip hydration and session slots — they carry no calories.
            guard entry.isMeal else { continue }
            guard let mealDate = FuelTimeline.date(
                forEntryAt: entry.index,
                template: template,
                sessionTime: sessionTime
            ) else { continue }

            let triggerDate = mealDate.addingTimeInterval(-Double(Self.leadMinutes) * 60)
            guard triggerDate > Date() else { continue }

            let content = UNMutableNotificationContent()
            content.title = "⚽ FuelUp — Meal Reminder"
            content.body = "\(entry.label) starts in \(Self.leadMinutes) minutes"
            content.sound = .default

            let components = Calendar.current.dateComponents([.hour, .minute], from: triggerDate)
            let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
            let request = UNNotificationRequest(
                identifier: "fuelup_meal_\(entry.index)_\(dayType.rawValue)",
                content: content,
                trigger: trigger
            )

            do {
                try await center.add(request)
                scheduled += 1
            } catch {
                print("[Notifications] Failed to schedule \(entry.label): \(error.localizedDescription)")
            }
        }

        print("[Notifications] Scheduled \(scheduled) meal reminders for \(dayType.rawValue) day")
    }
}
