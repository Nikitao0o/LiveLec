import Foundation
import Combine
import SwiftUI

@MainActor
final class LectureRoomViewModel: ObservableObject {
    @Published private(set) var lecture: Lecture
    @Published var questionText = ""
    @Published var confusionPulse = false
    @Published var participantsCount = 0
    @Published var errorMessage: String?
    @Published var isSendingQuestion = false
    @Published var isSendingConfusion = false
    @Published var subtitles = "Ожидание речи преподавателя..."
    @Published var cooldownSeconds = 0

    private let repository: LectureRepository
    private let liveClient: LectureWebSocketClient?
    private let sessionID: String
    private var cooldownTask: Task<Void, Never>?

    init(
        lecture: Lecture,
        repository: LectureRepository,
        liveClient: LectureWebSocketClient?
    ) {
        self.lecture = lecture
        self.repository = repository
        self.liveClient = liveClient
        sessionID = LectureRoomViewModel.makeStudentSessionID()
        bindLiveClient()
    }

    func connect() {
        liveClient?.connect(pinCode: lecture.pinCode, userType: "student", sessionID: sessionID)
    }

    func disconnect() {
        liveClient?.disconnect()
        cooldownTask?.cancel()
    }

    func sendConfusionSignal() {
        guard !isSendingConfusion, cooldownSeconds == 0, lecture.status != .finished else { return }

        withAnimation(.spring(response: 0.28, dampingFraction: 0.58)) {
            confusionPulse = true
        }
        isSendingConfusion = true

        liveClient?.sendConfusion(sessionID: sessionID)
        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(220))
            withAnimation(.spring(response: 0.3, dampingFraction: 0.75)) {
                confusionPulse = false
            }
            isSendingConfusion = false
        }
    }

    func sendQuestion() {
        let trimmed = questionText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !isSendingQuestion, lecture.status != .finished else { return }

        questionText = ""
        isSendingQuestion = true

        liveClient?.sendQuestion(trimmed)
        isSendingQuestion = false
    }

    func likeQuestion(_ question: Question) {
        guard !question.isLikedByCurrentUser, lecture.status != .finished else { return }
        upsertQuestion(question.likedByCurrentUser())

        liveClient?.likeQuestion(id: question.id)
    }

    private func bindLiveClient() {
        liveClient?.onEvent = { [weak self] event in
            self?.handle(event)
        }
        liveClient?.onError = { [weak self] message in
            self?.errorMessage = message
        }
    }

    private func handle(_ event: LectureLiveEvent) {
        switch event {
        case .connected(let status):
            lecture.status = status
        case .participants(let count):
            participantsCount = count
        case .lectureStatus(let status):
            lecture.status = status
        case .newQuestion(let question):
            upsertQuestion(question)
        case .likeUpdate(let questionID, let likesCount):
            updateQuestionLikes(questionID: questionID, likesCount: likesCount)
        case .confusion:
            break
        case .slideChange(let slideNumber):
            lecture.currentSlideNumber = slideNumber
        case .asrText(let text):
            appendSubtitle(text)
        case .asrStatus:
            break
        case .confusionAck(let seconds), .confusionCooldown(let seconds):
            applyCooldown(seconds)
        }
    }

    private func appendSubtitle(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        if subtitles.hasPrefix("Ожидание") {
            subtitles = trimmed
        } else {
            subtitles = "\(subtitles) \(trimmed)"
            if subtitles.count > 600 {
                subtitles = String(subtitles.suffix(600))
            }
        }
    }

    private func applyCooldown(_ seconds: Int) {
        cooldownSeconds = max(0, seconds)
        cooldownTask?.cancel()
        guard cooldownSeconds > 0 else { return }

        cooldownTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(1))
                guard !Task.isCancelled else { return }
                await MainActor.run {
                    guard let self else { return }
                    self.cooldownSeconds = max(0, self.cooldownSeconds - 1)
                    if self.cooldownSeconds == 0 {
                        self.cooldownTask?.cancel()
                        self.cooldownTask = nil
                    }
                }
            }
        }
    }

    private func upsertQuestion(_ question: Question) {
        if let index = lecture.questions.firstIndex(where: { $0.id == question.id }) {
            let current = lecture.questions[index]
            lecture.questions[index] = Question(
                id: question.id,
                text: question.text,
                likesCount: question.likesCount,
                isLikedByCurrentUser: current.isLikedByCurrentUser || question.isLikedByCurrentUser
            )
        } else {
            lecture.questions.insert(question, at: 0)
        }
    }

    private func updateQuestionLikes(questionID: Int, likesCount: Int) {
        guard let index = lecture.questions.firstIndex(where: { $0.id == questionID }) else { return }
        lecture.questions[index] = lecture.questions[index].updatingLikes(likesCount)
    }

    private static func makeStudentSessionID() -> String {
        let key = "livelec.student.sessionID"
        if let existing = UserDefaults.standard.string(forKey: key), !existing.isEmpty {
            return existing
        }
        let created = UUID().uuidString
        UserDefaults.standard.set(created, forKey: key)
        return created
    }
}
