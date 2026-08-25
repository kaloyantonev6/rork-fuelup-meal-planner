//
//  Theme.swift
//  FuelUp
//
//  Design tokens mirroring the FuelUp dark performance theme.
//

import SwiftUI

nonisolated extension Color {
    /// Create a color from a hex string such as "#2dd4a8" or "2dd4a8".
    init(hex: String) {
        let cleaned = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var value: UInt64 = 0
        Scanner(string: cleaned).scanHexInt64(&value)
        let r, g, b, a: Double
        switch cleaned.count {
        case 3:
            r = Double((value >> 8) & 0xF) / 15
            g = Double((value >> 4) & 0xF) / 15
            b = Double(value & 0xF) / 15
            a = 1
        case 6:
            r = Double((value >> 16) & 0xFF) / 255
            g = Double((value >> 8) & 0xFF) / 255
            b = Double(value & 0xFF) / 255
            a = 1
        case 8:
            r = Double((value >> 24) & 0xFF) / 255
            g = Double((value >> 16) & 0xFF) / 255
            b = Double((value >> 8) & 0xFF) / 255
            a = Double(value & 0xFF) / 255
        default:
            r = 1; g = 1; b = 1; a = 1
        }
        self.init(.sRGB, red: r, green: g, blue: b, opacity: a)
    }
}

/// Central color palette. Mirrors `expo/constants/colors.ts`.
nonisolated enum Theme {
    // Dark theme base
    static let background = Color(hex: "#0F1115")
    static let surface = Color(hex: "#1A1D23")
    static let surfaceElevated = Color(hex: "#242830")
    static let border = Color(hex: "#2A2E38")
    static let borderLight = Color(hex: "#242830")

    // Text
    static let text = Color.white
    static let textSecondary = Color(hex: "#9CA3AF")
    static let textTertiary = Color(hex: "#6B7280")

    // Primary accent — teal
    static let primary = Color(hex: "#2dd4a8")
    static let primaryDark = Color(hex: "#22c997")
    static let primaryLight = Color(hex: "#1a3a32")

    // Day type accents
    static let match = Color(hex: "#ef4444")
    static let training = Color(hex: "#22c55e")
    static let rest = Color(hex: "#6B7280")
    static let recovery = Color(hex: "#f59e0b")

    // Status
    static let error = Color(hex: "#EF4444")
    static let success = Color(hex: "#22c55e")
    static let warning = Color(hex: "#F59E0B")

    // Premium
    static let premiumGold = Color(hex: "#D4A44C")
    static let premiumGoldLight = Color(hex: "#F0D68A")

    // Macro accents
    static let macroFat = Color(hex: "#A78BFA")

    /// Standard card corner radius used across the app.
    static let cardRadius: CGFloat = 12
    /// Standard card inner padding.
    static let cardPadding: CGFloat = 16
}

/// A reusable dark surface card matching the app's card styling.
struct FuelCard<Content: View>: View {
    var padding: CGFloat = Theme.cardPadding
    var radius: CGFloat = 16
    var borderColor: Color = Theme.border
    var background: Color = Theme.surface
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(background)
            .clipShape(.rect(cornerRadius: radius))
            .overlay {
                RoundedRectangle(cornerRadius: radius)
                    .stroke(borderColor, lineWidth: 1)
            }
    }
}

nonisolated extension View {
    /// Uppercase section label styling used throughout the app.
    func sectionLabelStyle() -> some View {
        self
            .font(.system(size: 13, weight: .bold))
            .foregroundStyle(Theme.textSecondary)
            .textCase(.uppercase)
            .kerning(0.5)
    }
}
