import Foundation

enum LectureMockFactory {
    static func makeLecture(pin: String) -> Lecture {
        Lecture(
            id: 1,
            pinCode: pin,
            title: "Архитектура БД",
            discipline: "Базы данных",
            status: .active,
            slideCount: 8,
            currentSlideNumber: 1,
            questions: [
                Question(
                    id: 1,
                    text: "А вы скинете презентацию после пары?",
                    likesCount: 12,
                    isLikedByCurrentUser: false
                ),
                Question(
                    id: 2,
                    text: "Можно будет получить конспект по теме?",
                    likesCount: 5,
                    isLikedByCurrentUser: true
                ),
                Question(
                    id: 3,
                    text: "Почему здесь нормализация лучше денормализации?",
                    likesCount: 8,
                    isLikedByCurrentUser: false
                )
            ]
        )
    }
}
