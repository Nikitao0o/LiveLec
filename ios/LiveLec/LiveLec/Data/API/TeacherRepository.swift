import Foundation

protocol TeacherRepository {
    func login(email: String, password: String) async throws -> String
    func register(name: String, email: String, password: String) async throws -> String
    func createLecture(title: String, discipline: String?, token: String) async throws -> Lecture
    func finishLecture(id: Int, token: String) async throws -> Lecture
    func getPresentationMeta(lectureID: Int, token: String) async throws -> PresentationMetaDTO
    func uploadPresentation(lectureID: Int, fileURL: URL, token: String) async throws -> PresentationMetaDTO
}

final class APITeacherRepository: TeacherRepository {
    private let client: APIClient

    init(client: APIClient = APIClient()) {
        self.client = client
    }

    func login(email: String, password: String) async throws -> String {
        let response: TokenResponseDTO = try await client.post(
            "/api/auth/token",
            body: AuthRequest(email: email, password: password)
        )
        return response.accessToken
    }

    func register(name: String, email: String, password: String) async throws -> String {
        let _: EmptyUserResponseDTO = try await client.post(
            "/api/auth/register",
            body: RegisterRequest(email: email, name: name, password: password)
        )
        return try await login(email: email, password: password)
    }

    func createLecture(title: String, discipline: String?, token: String) async throws -> Lecture {
        let response: LectureResponseDTO = try await client.post(
            "/api/lectures/",
            body: LectureCreateRequest(title: title, discipline: discipline?.nilIfEmpty),
            token: token
        )
        return LectureMapper.mapLecture(response)
    }

    func finishLecture(id: Int, token: String) async throws -> Lecture {
        let response: LectureResponseDTO = try await client.post("/api/lectures/\(id)/finish", token: token)
        return LectureMapper.mapLecture(response)
    }

    func getPresentationMeta(lectureID: Int, token: String) async throws -> PresentationMetaDTO {
        try await client.get("/api/lectures/\(lectureID)/presentation", token: token)
    }

    func uploadPresentation(lectureID: Int, fileURL: URL, token: String) async throws -> PresentationMetaDTO {
        try await client.upload("/api/lectures/\(lectureID)/presentation", fileURL: fileURL, token: token)
    }
}

private struct EmptyUserResponseDTO: Decodable {}

private extension String {
    var nilIfEmpty: String? {
        let trimmed = trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
