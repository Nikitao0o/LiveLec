import Foundation

enum LectureLiveEvent {
    case connected(status: LectureStatus)
    case participants(count: Int)
    case lectureStatus(LectureStatus)
    case newQuestion(Question)
    case likeUpdate(questionID: Int, likesCount: Int)
    case confusion(totalCount: Int)
    case slideChange(Int)
    case asrText(String)
    case asrStatus(String)
    case confusionCooldown(Int)
    case confusionAck(Int)
}

@MainActor
final class LectureWebSocketClient {
    var onEvent: ((LectureLiveEvent) -> Void)?
    var onError: ((String) -> Void)?

    private let baseURL: URL
    private let session: URLSession
    private var task: URLSessionWebSocketTask?
    private var listenTask: Task<Void, Never>?

    init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    func connect(pinCode: String, userType: String = "student", sessionID: String? = nil) {
        disconnect()

        var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false)
        components?.path = "/ws/\(pinCode)"
        components?.queryItems = [URLQueryItem(name: "user_type", value: userType)]
        if userType == "student", let sessionID, !sessionID.isEmpty {
            components?.queryItems?.append(URLQueryItem(name: "session_id", value: sessionID))
        }

        guard let url = components?.url else {
            onError?("Не удалось открыть live-подключение")
            return
        }

        let task = session.webSocketTask(with: url)
        self.task = task
        task.resume()

        listenTask = Task { [weak self] in
            await self?.receiveLoop()
        }
    }

    func disconnect() {
        listenTask?.cancel()
        listenTask = nil
        task?.cancel(with: .normalClosure, reason: nil)
        task = nil
    }

    func sendPing() {
        send(["type": "PING"])
    }

    func sendQuestion(_ content: String) {
        send(["type": "NEW_QUESTION", "data": ["content": content]])
    }

    func likeQuestion(id: Int) {
        send(["type": "LIKE_QUESTION", "data": ["question_id": id]])
    }

    func sendConfusion(sessionID: String) {
        send(["type": "CONFUSION_CLICK", "data": ["session_id": sessionID]])
    }

    func sendSlideChange(_ slideNumber: Int) {
        send(["type": "SLIDE_CHANGE", "data": ["slide_number": slideNumber]])
    }

    func sendAudioChunk(_ base64Chunk: String) {
        send(["type": "AUDIO_CHUNK", "data": ["chunk": base64Chunk]])
    }

    private func receiveLoop() async {
        while !Task.isCancelled {
            do {
                guard let message = try await task?.receive() else { return }
                switch message {
                case .string(let text):
                    handle(text)
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        handle(text)
                    }
                @unknown default:
                    continue
                }
            } catch {
                if !Task.isCancelled {
                    onError?("Live-подключение прервано")
                }
                return
            }
        }
    }

    private func send(_ payload: [String: Any]) {
        guard
            let data = try? JSONSerialization.data(withJSONObject: payload),
            let text = String(data: data, encoding: .utf8)
        else { return }

        task?.send(.string(text)) { [weak self] error in
            guard let error else { return }
            let message = error.localizedDescription
            Task { @MainActor [weak self, message] in
                self?.onError?(message)
            }
        }
    }

    private func handle(_ text: String) {
        guard
            let data = text.data(using: .utf8),
            let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let type = object["type"] as? String
        else { return }

        let payload = object["data"] as? [String: Any] ?? [:]

        switch type {
        case "CONNECTED":
            if let rawStatus = payload["status"] as? String {
                onEvent?(.connected(status: LectureStatus(rawValue: rawStatus) ?? .waiting))
            }
        case "PARTICIPANTS_UPDATE":
            if let count = payload["count"] as? Int {
                onEvent?(.participants(count: count))
            }
        case "LECTURE_STATUS":
            if let rawStatus = payload["status"] as? String,
               let status = LectureStatus(rawValue: rawStatus) {
                onEvent?(.lectureStatus(status))
            }
        case "NEW_QUESTION":
            if let question = makeQuestion(from: payload) {
                onEvent?(.newQuestion(question))
            }
        case "LIKE_UPDATE":
            if let questionID = payload["question_id"] as? Int,
               let likesCount = payload["likes_count"] as? Int {
                onEvent?(.likeUpdate(questionID: questionID, likesCount: likesCount))
            }
        case "CONFUSION_UPDATE":
            if let total = payload["total_confusion_count"] as? Int {
                onEvent?(.confusion(totalCount: total))
            }
        case "SLIDE_CHANGE":
            if let slideNumber = payload["slide_number"] as? Int {
                onEvent?(.slideChange(slideNumber))
            }
        case "ASR_TEXT":
            if let text = payload["text"] as? String {
                onEvent?(.asrText(text))
            }
        case "ASR_STATUS":
            if let status = payload["status"] as? String {
                let detail = payload["message"] as? String ?? payload["text"] as? String ?? status
                onEvent?(.asrStatus(detail))
            }
        case "CONFUSION_ACK":
            if let seconds = payload["cooldown_seconds"] as? Int {
                onEvent?(.confusionAck(seconds))
            }
        case "CONFUSION_COOLDOWN":
            if let seconds = payload["cooldown_seconds"] as? Int {
                onEvent?(.confusionCooldown(seconds))
            }
        default:
            break
        }
    }

    private func makeQuestion(from payload: [String: Any]) -> Question? {
        guard
            let id = payload["id"] as? Int,
            let content = payload["content"] as? String
        else { return nil }

        return Question(
            id: id,
            text: content,
            likesCount: payload["likes_count"] as? Int ?? 0,
            isLikedByCurrentUser: false
        )
    }
}
