import Foundation

final class APIClient {
    private let fixedBaseURL: URL?
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    init(baseURL: URL? = nil, session: URLSession = .shared) {
        fixedBaseURL = baseURL
        self.session = session
        decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let value = try container.decode(String.self)
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = formatter.date(from: value) {
                return date
            }
            formatter.formatOptions = [.withInternetDateTime]
            if let date = formatter.date(from: value) {
                return date
            }
            throw APIError.decodingFailed
        }
        encoder = JSONEncoder()
    }

    func get<Response: Decodable>(_ path: String, token: String? = nil) async throws -> Response {
        try await send(path, method: "GET", body: Optional<Int>.none, token: token)
    }

    func post<Request: Encodable, Response: Decodable>(_ path: String, body: Request, token: String? = nil) async throws -> Response {
        try await send(path, method: "POST", body: body, token: token)
    }

    func post<Response: Decodable>(_ path: String, token: String? = nil) async throws -> Response {
        try await send(path, method: "POST", body: Optional<Int>.none, token: token)
    }

    func upload<Response: Decodable>(
        _ path: String,
        fileURL: URL,
        fieldName: String = "file",
        token: String? = nil
    ) async throws -> Response {
        let boundary = "Boundary-\(UUID().uuidString)"
        let url = (fixedBaseURL ?? APIEnvironment.baseURL).appending(path: path)
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let fileName = fileURL.lastPathComponent
        let mimeType = mimeType(for: fileURL.pathExtension)
        var body = Data()
        body.append("--\(boundary)\r\n")
        body.append("Content-Disposition: form-data; name=\"\(fieldName)\"; filename=\"\(fileName)\"\r\n")
        body.append("Content-Type: \(mimeType)\r\n\r\n")
        body.append(try Data(contentsOf: fileURL))
        body.append("\r\n--\(boundary)--\r\n")
        request.httpBody = body

        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        guard (200..<300).contains(httpResponse.statusCode) else {
            throw APIError.serverStatus(httpResponse.statusCode)
        }

        do {
            return try decoder.decode(Response.self, from: data)
        } catch {
            throw APIError.decodingFailed
        }
    }

    private func send<Request: Encodable, Response: Decodable>(
        _ path: String,
        method: String,
        body: Request?,
        token: String?
    ) async throws -> Response {
        let url = (fixedBaseURL ?? APIEnvironment.baseURL).appending(path: path)
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            request.httpBody = try encoder.encode(body)
        }

        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        guard (200..<300).contains(httpResponse.statusCode) else {
            throw APIError.serverStatus(httpResponse.statusCode)
        }

        do {
            return try decoder.decode(Response.self, from: data)
        } catch {
            throw APIError.decodingFailed
        }
    }

    private func mimeType(for pathExtension: String) -> String {
        switch pathExtension.lowercased() {
        case "pdf":
            "application/pdf"
        case "pptx":
            "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        default:
            "application/octet-stream"
        }
    }
}

private extension Data {
    mutating func append(_ string: String) {
        append(Data(string.utf8))
    }
}
