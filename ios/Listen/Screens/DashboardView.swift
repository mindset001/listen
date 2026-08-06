import SwiftUI

struct DashboardView: View {
    @Environment(LibraryStore.self) private var library
    let openNewReading: () -> Void
    let openUpload: () -> Void
    let openReader: (Document) -> Void

    private var continueDoc: Document? {
        library.documents.first { $0.percentage > 0 && $0.percentage < 100 } ?? library.documents.first
    }

    private var recent: [Document] { Array(library.documents.prefix(3)) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Welcome back, Sam")
                    .font(.interTight(26))
                    .foregroundStyle(Theme.fg1)
                Text("Pick up where you left off, or start something new.")
                    .font(.inter(15))
                    .foregroundStyle(Theme.fg2)
                    .padding(.top, 4)
                    .padding(.bottom, Theme.Space.lg)

                quickActions
                    .padding(.bottom, Theme.Space.xl)

                sectionHeader("Recent reads", trailing: nil)
                VStack(spacing: 10) {
                    ForEach(recent) { doc in
                        RecentReadCard(doc: doc) { openReader(doc) }
                    }
                }
                .padding(.bottom, Theme.Space.xl)

                Text("Statistics")
                    .font(.interTight(18))
                    .foregroundStyle(Theme.fg1)
                    .padding(.bottom, Theme.Space.md)
                statsGrid
                    .padding(.bottom, Theme.Space.xl)

                Text("Minutes listened, last 14 days")
                    .font(.interTight(18))
                    .foregroundStyle(Theme.fg1)
                    .padding(.bottom, Theme.Space.md)
                chart
            }
            .padding(.horizontal, Theme.Space.base)
            .padding(.top, Theme.Space.lg)
            .padding(.bottom, 140)
        }
        .background(Theme.bgBase)
        .scrollContentBackground(.hidden)
    }

    private func sectionHeader(_ title: String, trailing: String?) -> some View {
        HStack {
            Text(title).font(.interTight(18)).foregroundStyle(Theme.fg1)
            Spacer()
        }
        .padding(.bottom, Theme.Space.md)
    }

    private var quickActions: some View {
        VStack(spacing: 12) {
            if let doc = continueDoc {
                Button(action: { openReader(doc) }) {
                    HStack(spacing: 12) {
                        ZStack {
                            Circle().fill(Color.white.opacity(0.16)).frame(width: 44, height: 44)
                            Icon(name: .play, size: 18, color: .white)
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Continue reading").font(.inter(15, weight: .semibold)).foregroundStyle(.white)
                            Text("\(doc.title) · \(doc.percentage)% through")
                                .font(.inter(13)).foregroundStyle(.white.opacity(0.75)).lineLimit(1)
                        }
                        Spacer()
                        Icon(name: .chevronRight, size: 18, color: .white.opacity(0.75))
                    }
                    .padding(Theme.Space.base)
                    .background(Theme.accent)
                    .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous))
                }
                .buttonStyle(.plain)
            }
            HStack(spacing: 12) {
                QuickCard(icon: .penLine, label: "New reading", action: openNewReading)
                QuickCard(icon: .fileUp, label: "Upload document", action: openUpload)
            }
        }
    }

    private var statsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible())], spacing: 12) {
            StatCard(value: "\(MockData.Stats.documents)", label: "Documents")
            StatCard(value: MockData.Stats.listeningTime, label: "Listening time")
            StatCard(value: "\(MockData.Stats.completed)", label: "Completed")
            StatCard(value: "\(MockData.Stats.pagesRead)", label: "Pages read")
        }
    }

    private var chart: some View {
        let maxVal = MockData.chartData.max() ?? 1
        return VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .bottom, spacing: 5) {
                ForEach(Array(MockData.chartData.enumerated()), id: \.offset) { idx, v in
                    RoundedRectangle(cornerRadius: 3)
                        .fill(idx == MockData.chartData.count - 1 ? Theme.accent : (v == 0 ? Theme.lineQuiet : Theme.lineStrong))
                        .frame(height: max(4, CGFloat(v / maxVal) * 64))
                }
            }
            .frame(height: 64, alignment: .bottom)
            HStack {
                Text("14 days ago").font(.inter(11)).foregroundStyle(Theme.fg3)
                Spacer()
                Text("Today").font(.inter(11)).foregroundStyle(Theme.fg3)
            }
        }
    }
}

private struct QuickCard: View {
    let icon: IconName
    let label: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                Icon(name: icon, size: 20, color: Theme.fg2)
                Text(label).font(.inter(14, weight: .medium)).foregroundStyle(Theme.fg1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Theme.Space.base)
            .background(Theme.bgElevated)
            .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).stroke(Theme.lineQuiet, lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))
        }
        .buttonStyle(.plain)
    }
}

private struct StatCard: View {
    let value: String
    let label: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value).font(.mono(24, weight: .semibold)).foregroundStyle(Theme.fg1)
            Text(label).font(.inter(12)).foregroundStyle(Theme.fg2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Theme.Space.base)
        .background(Theme.bgElevated)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))
    }
}

private struct RecentReadCard: View {
    let doc: Document
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(doc.title).font(.inter(15, weight: .semibold)).foregroundStyle(Theme.fg1).lineLimit(1)
                    Spacer()
                    if doc.favourite {
                        Icon(name: .heart, size: 14, color: Theme.accent, filled: true)
                    }
                }
                Text(doc.content).font(.inter(13)).foregroundStyle(Theme.fg2).lineLimit(2)
                ProgressBarView(value: Double(doc.percentage))
                Text("\(doc.percentage)% · \(doc.duration) · \(doc.updatedLabel)")
                    .font(.mono(12)).foregroundStyle(Theme.fg3)
            }
            .padding(Theme.Space.base)
            .background(Theme.bgElevated)
            .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).stroke(Theme.lineQuiet, lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))
        }
        .buttonStyle(.plain)
    }
}
