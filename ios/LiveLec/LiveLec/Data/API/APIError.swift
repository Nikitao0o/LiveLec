import Foundation

enum APIError: LocalizedError {
    case invalidResponse
    case serverStatus(Int)
    case decodingFailed

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            "Некорректный ответ сервера"
        case .serverStatus(let code):
            switch code {
            case 404:
                "Лекция с таким PIN не найдена"
            case 409:
                "Лекция уже завершена"
            default:
                "Сервер вернул ошибку \(code)"
            }
        case .decodingFailed:
            "Не удалось прочитать ответ сервера"
        }
    }
}
