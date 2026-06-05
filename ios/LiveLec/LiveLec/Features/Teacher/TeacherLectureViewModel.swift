import Foundation
import Combine
import SwiftUI

@MainActor
final class TeacherLectureViewModel: ObservableObject {
    @Published var isRegisterMode = false
    @Published var name = ""
    @Published var email = ""
    @Published var password = ""
    @Published var title = ""
    @Published var discipline = ""
    @Published var lecture: Lecture?
    @Published var questions: [Question] = []
    @Published var participantsCount = 0
    @Published var confusionCount = 0
    @Published var transcript = ""
    @Published var asrStatus = ""
    @Published var isRecording = false
    @Published var isUploadingPresentation = false
    @Published var errorMessage: String?
    @Published var isLoading = false

    private let repository: TeacherRepository
    private let liveClient: LectureWebSocketClient
    private let audioRecorder: AudioChunkRecorder
    private var token: String?
    private var cancellables = Set<AnyCancellable>()

    init(
        repository: TeacherRepository,
        liveClient: LectureWebSocketClient,
        audioRecorder: AudioChunkRecorder? = nil
    ) {
        self.repository = repository
        self.liveClient = liveClient
        self.audioRecorder = audioRecorder ?? AudioChunkRecorder()
        bindLiveClient()
        bindAudioRecorder()
    }

    var canAuthenticate: Bool {
        email.contains("@") && password.count >= 6 && (!isRegisterMode || !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
    }

    var canCreateLecture: Bool {
        token != nil && !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    func authenticate() async {
        guard canAuthenticate else { return }
        isLoading = true
        errorMessage = nil

        do {
            if isRegisterMode {
                token = try await repository.register(name: name, email: email, password: password)
            } else {
                token = try await repository.login(email: email, password: password)
            }
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    func createLecture() async {
        guard let token, canCreateLecture else { return }
        isLoading = true
        errorMessage = nil

        do {
            let created = try await repository.createLecture(
                title: title.trimmingCharacters(in: .whitespacesAndNewlines),
                discipline: discipline,
                token: token
            )
            lecture = created
            questions = []
            participantsCount = 0
            confusionCount = 0
            transcript = ""
            asrStatus = ""
            liveClient.connect(pinCode: created.pinCode, userType: "teacher")
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    func toggleRecording() {
        guard lecture != nil else { return }
        audioRecorder.toggle()
        if !isRecording {
            lecture?.status = .active
        }
    }

    func finishLecture() async {
        guard let token, let lecture else { return }
        audioRecorder.stop()
        await updateLecture {
            try await repository.finishLecture(id: lecture.id, token: token)
        }
        liveClient.disconnect()
    }

    func resetLecture() {
        liveClient.disconnect()
        lecture = nil
        questions = []
        participantsCount = 0
        confusionCount = 0
        title = ""
        discipline = ""
        transcript = ""
        asrStatus = ""
        audioRecorder.stop()
    }

    func uploadPresentation(fileURL: URL) async {
        guard let token, let lecture else { return }
        let accessed = fileURL.startAccessingSecurityScopedResource()
        isUploadingPresentation = true
        errorMessage = nil
        defer {
            if accessed {
                fileURL.stopAccessingSecurityScopedResource()
            }
            isUploadingPresentation = false
        }

        do {
            let meta = try await repository.uploadPresentation(
                lectureID: lecture.id,
                fileURL: fileURL,
                token: token
            )
            self.lecture?.slideCount = meta.slideCount
            self.lecture?.currentSlideNumber = meta.currentSlide
            if meta.slideCount > 0 {
                liveClient.sendSlideChange(meta.currentSlide)
            }
        } catch {
            errorMessage = "Не удалось загрузить презентацию"
        }
    }

    func nextSlide() {
        guard let lecture, lecture.slideCount > 0 else { return }
        let next = min(lecture.currentSlideNumber + 1, lecture.slideCount)
        setSlide(next)
    }

    func previousSlide() {
        guard let lecture, lecture.slideCount > 0 else { return }
        let previous = max(lecture.currentSlideNumber - 1, 1)
        setSlide(previous)
    }

    private func updateLecture(_ operation: () async throws -> Lecture) async {
        isLoading = true
        errorMessage = nil
        do {
            lecture = try await operation()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    private func bindLiveClient() {
        liveClient.onEvent = { [weak self] event in
            self?.handle(event)
        }
        liveClient.onError = { [weak self] message in
            self?.errorMessage = message
        }
    }

    private func bindAudioRecorder() {
        audioRecorder.$isRecording
            .receive(on: DispatchQueue.main)
            .sink { [weak self] value in
                self?.isRecording = value
            }
            .store(in: &cancellables)

        audioRecorder.onChunk = { [weak self] chunk in
            self?.liveClient.sendAudioChunk(chunk)
        }
        audioRecorder.onError = { [weak self] message in
            self?.errorMessage = message
        }
    }

    private func handle(_ event: LectureLiveEvent) {
        switch event {
        case .connected(let status), .lectureStatus(let status):
            lecture?.status = status
        case .participants(let count):
            participantsCount = count
        case .newQuestion(let question):
            if !questions.contains(where: { $0.id == question.id }) {
                questions.insert(question, at: 0)
            }
        case .likeUpdate(let questionID, let likesCount):
            guard let index = questions.firstIndex(where: { $0.id == questionID }) else { return }
            questions[index] = questions[index].updatingLikes(likesCount)
        case .confusion(let totalCount):
            confusionCount = totalCount
        case .slideChange:
            break
        case .asrText(let text):
            appendTranscript(text)
            asrStatus = ""
        case .asrStatus(let status):
            asrStatus = status
        case .confusionAck, .confusionCooldown:
            break
        }
    }

    private func appendTranscript(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        transcript = "\(transcript) \(trimmed)".trimmingCharacters(in: .whitespacesAndNewlines)
        if transcript.count > 1_200 {
            transcript = String(transcript.suffix(1_200))
        }
    }

    private func setSlide(_ slideNumber: Int) {
        lecture?.currentSlideNumber = slideNumber
        liveClient.sendSlideChange(slideNumber)
    }
}
