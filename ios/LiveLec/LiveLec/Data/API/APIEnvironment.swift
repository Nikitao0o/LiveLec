import Foundation

enum APIEnvironment {
    static let baseURLDefaultsKey = "livelec.api.baseURL"

    static var baseURL: URL {
        if let rawValue = ProcessInfo.processInfo.environment["LIVELEC_API_BASE_URL"],
           let url = URL(string: rawValue) {
            return url
        }

        if let rawValue = UserDefaults.standard.string(forKey: baseURLDefaultsKey),
           let url = URL(string: rawValue) {
            return url
        }

        return URL(string: "http://localhost:8000")!
    }

    static var webSocketBaseURL: URL {
        var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false)!
        components.scheme = components.scheme == "https" ? "wss" : "ws"
        return components.url!
    }

    static func saveBaseURLString(_ value: String) {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        UserDefaults.standard.set(trimmed, forKey: baseURLDefaultsKey)
    }

    static func slideURL(lectureID: Int, slideNumber: Int, pinCode: String) -> URL {
        baseURL.appending(path: "/api/lectures/\(lectureID)/slides/\(slideNumber)")
            .appending(queryItems: [URLQueryItem(name: "pin", value: pinCode)])
    }
}
