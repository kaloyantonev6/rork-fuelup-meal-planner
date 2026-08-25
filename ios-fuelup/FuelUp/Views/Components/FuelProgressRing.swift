//
//  FuelProgressRing.swift
//  FuelUp
//
//  Animated circular progress ring for daily fuel completion.
//

import SwiftUI

struct FuelProgressRing: View {
    let progress: Double
    var size: CGFloat = 92
    var lineWidth: CGFloat = 9
    var color: Color = Theme.primary
    var trackColor: Color = Theme.surfaceElevated

    @State private var isPulsing = false

    /// Bouncy spring for the arc fill: overshoots slightly past the new value
    /// before settling, so a checked meal feels like it "snaps" into place.
    private static let fillSpring = Animation.spring(response: 0.7, dampingFraction: 0.72)

    private var clamped: Double {
        min(max(progress, 0), 1)
    }

    var body: some View {
        ZStack {
            Circle()
                .stroke(trackColor, lineWidth: lineWidth)

            Circle()
                .trim(from: 0, to: clamped)
                .stroke(
                    color,
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(Self.fillSpring, value: clamped)
        }
        .frame(width: size, height: size)
        .scaleEffect(isPulsing ? 1.07 : 1)
        .shadow(color: color.opacity(isPulsing ? 0.55 : 0), radius: isPulsing ? 12 : 0)
        .onChange(of: clamped, initial: false) { oldValue, newValue in
            // Only celebrate forward progress; unchecking should just settle back.
            guard newValue > oldValue else { return }
            pulse()
        }
    }

    /// Brief scale-up with a colored glow that eases back out, layered on top
    /// of the arc's spring fill for a satisfying completion moment.
    private func pulse() {
        withAnimation(.spring(response: 0.28, dampingFraction: 0.55)) {
            isPulsing = true
        }
        Task {
            try? await Task.sleep(for: .milliseconds(200))
            withAnimation(.spring(response: 0.5, dampingFraction: 0.65)) {
                isPulsing = false
            }
        }
    }
}

/// Horizontal progress bar with an animated fill.
struct FuelProgressBar: View {
    let progress: Double
    var height: CGFloat = 10
    var color: Color = Theme.primary
    var trackColor: Color = Theme.surfaceElevated

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(trackColor)
                Capsule()
                    .fill(color)
                    .frame(width: proxy.size.width * min(max(progress, 0), 1))
                    .animation(.spring(response: 0.6, dampingFraction: 0.85), value: progress)
            }
        }
        .frame(height: height)
    }
}

#Preview {
    VStack(spacing: 24) {
        FuelProgressRing(progress: 0.6, color: Theme.match)
        FuelProgressBar(progress: 0.45)
            .padding(.horizontal)
    }
    .padding()
    .background(Theme.background)
}
