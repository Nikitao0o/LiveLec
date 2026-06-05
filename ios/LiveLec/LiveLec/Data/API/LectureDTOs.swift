import Foundation

struct LectureJoinRequest: Encodable {
    let pinCode: String

    enum CodingKeys: String, CodingKey {
        case pinCode = "pin_code"
    }
}

struct QuestionCreateRequest: Encodable {
    let lectureID: Int
    let content: String

    enum CodingKeys: String, CodingKey {
        case lectureID = "lecture_id"
        case content
    }
}

struct ConfusionCreateRequest: Encodable {
    let lectureID: Int

    enum CodingKeys: String, CodingKey {
        case lectureID = "lecture_id"
    }
}

struct LectureJoinResponseDTO: Decodable {
    let lectureID: Int
    let title: String
    let discipline: String?
    let pinCode: String
    let status: String
    let slideCount: Int
    let currentSlide: Int
    let questions: [QuestionDTO]

    enum CodingKeys: String, CodingKey {
        case lectureID = "lecture_id"
        case title
        case discipline
        case pinCode = "pin_code"
        case status
        case slideCount = "slide_count"
        case currentSlide = "current_slide"
        case questions
    }
}

struct QuestionDTO: Decodable {
    let id: Int
    let lectureID: Int
    let content: String
    let likesCount: Int
    let isAnswered: Bool
    let createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case lectureID = "lecture_id"
        case content
        case likesCount = "likes_count"
        case isAnswered = "is_answered"
        case createdAt = "created_at"
    }
}

struct LikeQuestionResponseDTO: Decodable {
    let questionID: Int
    let likesCount: Int

    enum CodingKeys: String, CodingKey {
        case questionID = "question_id"
        case likesCount = "likes_count"
    }
}

struct ConfusionResponseDTO: Decodable {
    let status: String
    let totalConfusionCount: Int

    enum CodingKeys: String, CodingKey {
        case status
        case totalConfusionCount = "total_confusion_count"
    }
}

struct AuthRequest: Encodable {
    let email: String
    let password: String
}

struct RegisterRequest: Encodable {
    let email: String
    let name: String
    let password: String
}

struct TokenResponseDTO: Decodable {
    let accessToken: String
    let tokenType: String

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case tokenType = "token_type"
    }
}

struct LectureCreateRequest: Encodable {
    let title: String
    let discipline: String?
}

struct LectureResponseDTO: Decodable {
    let id: Int
    let teacherID: Int
    let title: String
    let discipline: String?
    let pinCode: String
    let status: String
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case teacherID = "teacher_id"
        case title
        case discipline
        case pinCode = "pin_code"
        case status
        case createdAt = "created_at"
    }
}

struct PresentationMetaDTO: Decodable {
    let slideCount: Int
    let currentSlide: Int

    enum CodingKeys: String, CodingKey {
        case slideCount = "slide_count"
        case currentSlide = "current_slide"
    }
}
