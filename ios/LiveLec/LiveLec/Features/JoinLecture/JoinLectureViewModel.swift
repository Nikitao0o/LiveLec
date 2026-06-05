import Foundation
import Combine
import SwiftUI

@MainActor
final class JoinLectureViewModel: ObservableObject {
    @Published var pinCode = ""
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let repository: LectureRepository
    private let sessionStore: LectureSessionStore

    init(repository: LectureRepository, sessionStore: LectureSessionStore) {
        self.repository = repository
        self.sessionStore = sessionStore
    }

    var isJoinEnabled: Bool {
        pinCode.count == 6 && !isLoading
    }

    func joinLecture() async {
        guard isJoinEnabled else { return }

        isLoading = true
        sessionStore.isLoading = true
        errorMessage = nil
        sessionStore.errorMessage = nil

        do {
            let lecture = try await repository.joinLecture(pin: pinCode)
            sessionStore.currentLecture = lecture
        } catch {
            let message = error.localizedDescription.isEmpty ? "Не удалось подключиться к лекции" : error.localizedDescription
            errorMessage = message
            sessionStore.errorMessage = message
        }

        isLoading = false
        sessionStore.isLoading = false
    }
}
