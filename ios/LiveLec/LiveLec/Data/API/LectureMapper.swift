import Foundation

enum LectureMapper {
    nonisolated static func mapJoinResponse(_ dto: LectureJoinResponseDTO) -> Lecture {
        Lecture(
            id: dto.lectureID,
            pinCode: dto.pinCode,
            title: dto.title,
            discipline: dto.discipline,
            status: LectureStatus(rawValue: dto.status) ?? .waiting,
            slideCount: dto.slideCount,
            currentSlideNumber: dto.currentSlide,
            questions: dto.questions.map(mapQuestion)
        )
    }

    nonisolated static func mapLecture(_ dto: LectureResponseDTO) -> Lecture {
        Lecture(
            id: dto.id,
            pinCode: dto.pinCode,
            title: dto.title,
            discipline: dto.discipline,
            status: LectureStatus(rawValue: dto.status) ?? .waiting,
            slideCount: 0,
            currentSlideNumber: 1,
            questions: []
        )
    }

    nonisolated static func mapQuestion(_ dto: QuestionDTO) -> Question {
        Question(
            id: dto.id,
            text: dto.content,
            likesCount: dto.likesCount,
            isLikedByCurrentUser: false
        )
    }
}
