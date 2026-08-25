//
//  OptionChip.swift
//  FuelUp
//
//  Selectable chips used across onboarding and the profile editors.
//

import SwiftUI

/// A full-width selectable row with an icon, title and optional description.
struct OptionRowChip: View {
    let icon: String
    let label: String
    var desc: String?
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                if !icon.isEmpty {
                    Text(icon)
                        .font(.system(size: 18))
                }
                VStack(alignment: .leading, spacing: 1) {
                    Text(label)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(isSelected ? Theme.background : Theme.text)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                    if let desc {
                        Text(desc)
                            .font(.system(size: 11))
                            .foregroundStyle(isSelected ? Theme.background.opacity(0.75) : Theme.textTertiary)
                            .lineLimit(2)
                            .multilineTextAlignment(.leading)
                    }
                }
                Spacer(minLength: 4)
                if isSelected {
                    Image(systemName: "checkmark")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(isSelected ? Theme.background : Theme.primary)
                        .frame(width: 22, height: 22)
                        .background(Theme.background.opacity(isSelected ? 0.15 : 0))
                        .clipShape(.circle)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(isSelected ? Theme.primary : Theme.surface)
            .clipShape(.rect(cornerRadius: 14))
            .overlay {
                RoundedRectangle(cornerRadius: 14)
                    .stroke(isSelected ? Theme.primary : Theme.border, lineWidth: 1.5)
            }
        }
        .buttonStyle(PressableButtonStyle())
    }
}

/// A compact grid chip with icon above/next to a short label.
struct OptionGridChip: View {
    let icon: String
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                if !icon.isEmpty {
                    Text(icon)
                        .font(.system(size: 17))
                }
                Text(label)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(isSelected ? Theme.background : Theme.text)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                Spacer(minLength: 0)
                if isSelected {
                    Image(systemName: "checkmark")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(Theme.background)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(isSelected ? Theme.primary : Theme.surface)
            .clipShape(.rect(cornerRadius: 14))
            .overlay {
                RoundedRectangle(cornerRadius: 14)
                    .stroke(isSelected ? Theme.primary : Theme.border, lineWidth: 1.5)
            }
        }
        .buttonStyle(PressableButtonStyle())
    }
}

/// Scales and dims content while pressed, matching the RN `Pressable` feel.
struct PressableButtonStyle: ButtonStyle {
    var scale: CGFloat = 0.97
    var opacity: Double = 0.85

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? scale : 1)
            .opacity(configuration.isPressed ? opacity : 1)
            .animation(.spring(response: 0.28, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

/// A small read-only pill used for the fuel profile summary.
struct InfoPill: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.system(size: 12, weight: .semibold))
            .foregroundStyle(Theme.primary)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(Theme.surfaceElevated)
            .clipShape(.capsule)
    }
}

/// A coloured badge, e.g. the day-type indicator.
struct DayTypeBadge: View {
    let dayType: DayType
    var compact: Bool = false

    var body: some View {
        HStack(spacing: 6) {
            Text(dayType.emoji)
                .font(.system(size: compact ? 11 : 14))
            Text(dayType.label)
                .font(.system(size: compact ? 11 : 13, weight: .bold))
                .foregroundStyle(dayType.color)
        }
        .padding(.horizontal, compact ? 9 : 10)
        .padding(.vertical, compact ? 4 : 5)
        .background(dayType.color.opacity(0.15))
        .clipShape(.capsule)
        .overlay {
            Capsule().stroke(dayType.color.opacity(0.5), lineWidth: compact ? 1.2 : 1.5)
        }
    }
}
