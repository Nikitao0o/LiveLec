import Foundation

final class APILectureRepository: LectureRepository {
    private let client: APIClient

    init(client: APIClient = APIClient()) {
        self.client = client
    }

    func joinLecture(pin: String) async throws -> Lecture {
        let response: LectureJoinResponseDTO = try await client.post(
            "/api/lectures/join",
            body: LectureJoinRequest(pinCode: pin)
        )
        return LectureMapper.mapJoinResponse(response)
    }

    func sendQuestion(lectureID: Int, content: String) async throws -> Question {
        let response: QuestionDTO = try await client.post(
            "/api/questions/",
            body: QuestionCreateRequest(lectureID: lectureID, content: content)
        )
        return LectureMapper.mapQuestion(response)
    }

    func likeQuestion(questionID: Int) async throws -> Int {
        let response: LikeQuestionResponseDTO = try await client.post("/api/questions/\(questionID)/like")
        return response.likesCount
    }

    func sendConfusion(lectureID: Int) async throws {
        let _: ConfusionResponseDTO = try await client.post(
            "/api/analytics/confusion",
            body: ConfusionCreateRequest(lectureID: lectureID)
        )
    }
}
