import Foundation

enum APIError: LocalizedError {
    case invalidResponse
    case serverStatus(Int, detail: String?)
    case decodingFailed

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Некорректный ответ сервера"
        case .serverStatus(let code, let detail):
            if let detail, !detail.isEmpty {
                switch detail {
                case "Email already registered":
                    return "Email уже зарегистрирован. Переключитесь на вход."
                case "Invalid credentials":
                    return "Неверный email или пароль"
                default:
                    return detail
                }
            }

            switch code {
            case 404:
                return "Лекция с таким PIN не найдена"
            case 409:
                return "Лекция уже завершена"
            default:
                return "Сервер вернул ошибку \(code)"
            }
        case .decodingFailed:
            return "Не удалось прочитать ответ сервера"
        }
    }
}
