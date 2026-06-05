import Foundation

final class MockLectureRepository: LectureRepository {
    func joinLecture(pin: String) async throws -> Lecture {
        try await Task.sleep(for: .milliseconds(500))
        return LectureMockFactory.makeLecture(pin: pin)
    }

    func sendQuestion(lectureID: Int, content: String) async throws -> Question {
        try await Task.sleep(for: .milliseconds(250))
        return Question(
            id: Int.random(in: 100...999),
            text: content,
            likesCount: 0,
            isLikedByCurrentUser: false
        )
    }

    func likeQuestion(questionID: Int) async throws -> Int {
        try await Task.sleep(for: .milliseconds(150))
        return Int.random(in: 2...20)
    }

    func sendConfusion(lectureID: Int) async throws {
        try await Task.sleep(for: .milliseconds(150))
    }
}
