import Foundation

enum LectureStatus: String, Hashable {
    case waiting
    case active
    case finished

    var title: String {
        switch self {
        case .waiting:
            "Ожидание"
        case .active:
            "В эфире"
        case .finished:
            "Завершена"
        }
    }
}

struct Lecture: Identifiable, Hashable {
    let id: Int
    let pinCode: String
    let title: String
    let discipline: String?
    var status: LectureStatus
    var slideCount: Int
    var currentSlideNumber: Int
    var questions: [Question]
}
