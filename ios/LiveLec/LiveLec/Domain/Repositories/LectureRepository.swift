import Foundation

protocol LectureRepository {
    func joinLecture(pin: String) async throws -> Lecture
    func sendQuestion(lectureID: Int, content: String) async throws -> Question
    func likeQuestion(questionID: Int) async throws -> Int
    func sendConfusion(lectureID: Int) async throws
}
