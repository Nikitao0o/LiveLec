import Combine
import SwiftUI

@MainActor
final class LectureSessionStore: ObservableObject {
    @Published var currentLecture: Lecture?
    @Published var isLoading = false
    @Published var errorMessage: String?
}
