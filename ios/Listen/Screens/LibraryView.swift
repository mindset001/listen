import SwiftUI

private let filters = ["All", "Recent", "Favourites", "In progress", "Completed"]

struct LibraryView: View {
    @Environment(LibraryStore.self) private var library
    let openReader: (Document) -> Void

    @State private var query = ""
    @State private var filter = "All"
    @State private var renamingDoc: Document?
    @State private var renameText = ""

    private var filtered: [Document] {
        var list = library.documents
        switch filter {
        case "Favourites": list = list.filter { $0.favourite }
        case "In progress": list = list.filter { $0.percentage > 0 && $0.percentage < 100 }
        case "Completed": list = list.filter { $0.percentage >= 100 }
        case "Recent": list = list.sorted { $0.updatedAt > $1.updatedAt }
        default: break
        }
        if !query.trimmingCharacters(in: .whitespaces).isEmpty {
            let q = query.lowercased()
            list = list.filter { $0.title.lowercased().contains(q) || $0.content.lowercased().contains(q) }
        }
        return list
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                Icon(name: .search, size: 16, color: Theme.fg3)
                TextField("Search documents", text: $query)
                    .font(.inter(14)).foregroundStyle(Theme.fg1)
            }
            .padding(.horizontal, 12)
            .frame(height: 40)
            .background(Theme.bgElevated)
            .overlay(RoundedRectangle(cornerRadius: Theme.Radius.input).stroke(Theme.lineQuiet, lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.input))
            .padding(.horizontal, Theme.Space.base)
            .padding(.top, Theme.Space.base)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(filters, id: \.self) { f in
                        Chip(label: f, selected: filter == f) { filter = f }
                    }
                }
                .padding(.horizontal, Theme.Space.base)
            }
            .padding(.top, Theme.Space.md)

            ScrollView {
                if filtered.isEmpty {
                    VStack(spacing: 16) {
                        RoundedRectangle(cornerRadius: 3).fill(Theme.lineStrong).frame(width: 38, height: 6)
                        Text("Nothing here yet. Your first document goes here.")
                            .font(.inter(14)).foregroundStyle(Theme.fg2).multilineTextAlignment(.center)
                        PrimaryButton(label: "Clear filters") { filter = "All"; query = "" }
                            .frame(width: 160)
                    }
                    .padding(.top, 64)
                } else {
                    VStack(spacing: 12) {
                        ForEach(filtered) { doc in
                            LibraryCard(doc: doc, onListen: { openReader(doc) },
                                        onFavourite: { library.toggleFavourite(id: doc.id) },
                                        onRename: { renamingDoc = doc; renameText = doc.title },
                                        onDelete: { library.delete(id: doc.id) })
                        }
                    }
                    .padding(Theme.Space.base)
                }
            }
            .safeAreaInset(edge: .bottom) { Color.clear.frame(height: 100) }
        }
        .background(Theme.bgBase)
        .alert("Rename document", isPresented: Binding(get: { renamingDoc != nil }, set: { if !$0 { renamingDoc = nil } })) {
            TextField("Title", text: $renameText)
            Button("Cancel", role: .cancel) {}
            Button("Save") {
                if let doc = renamingDoc { library.rename(id: doc.id, title: renameText) }
            }
        }
    }
}

private struct LibraryCard: View {
    let doc: Document
    let onListen: () -> Void
    let onFavourite: () -> Void
    let onRename: () -> Void
    let onDelete: () -> Void

    private var buttonLabel: String {
        doc.percentage >= 100 ? "Listen again" : (doc.percentage > 0 ? "Continue from \(doc.percentage)%" : "Listen")
    }

    private var status: (String, Color) {
        if doc.percentage >= 100 { return ("Completed", Theme.success) }
        if doc.percentage > 0 { return ("In progress \(doc.percentage)%", Theme.fg2) }
        return ("Not started", Theme.fg3)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("DOCUMENT").font(.inter(11, weight: .medium)).tracking(0.96).foregroundStyle(Theme.fg3)
                Spacer()
                Icon(name: .audioLines, size: 16, color: Theme.accent)
                Button(action: onFavourite) {
                    Icon(name: .heart, size: 16, color: doc.favourite ? Theme.accent : Theme.fg3, filled: doc.favourite)
                }
                .buttonStyle(.plain)
            }
            Text(doc.title).font(.inter(16, weight: .semibold)).foregroundStyle(Theme.fg1).lineLimit(1)
            Text(doc.content).font(.inter(13)).foregroundStyle(Theme.fg2).lineLimit(3)
            Text(status.0).font(.inter(13, weight: .medium)).foregroundStyle(status.1)
            Text("\(doc.duration) · \(doc.updatedLabel)").font(.mono(12)).foregroundStyle(Theme.fg3)

            HStack(spacing: 8) {
                PrimaryButton(label: buttonLabel, action: onListen)
                Button(action: onRename) {
                    Icon(name: .pencil, size: 16, color: Theme.fg2)
                        .frame(width: 44, height: 44)
                        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.input).stroke(Theme.lineQuiet, lineWidth: 1))
                }
                .buttonStyle(.plain)
                Button(action: onDelete) {
                    Icon(name: .trash, size: 16, color: Theme.fg2)
                        .frame(width: 44, height: 44)
                        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.input).stroke(Theme.lineQuiet, lineWidth: 1))
                }
                .buttonStyle(.plain)
            }
            .padding(.top, 4)
        }
        .padding(Theme.Space.base)
        .background(Theme.bgElevated)
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).stroke(Theme.lineQuiet, lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))
    }
}
