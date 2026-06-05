import SwiftUI

struct AppRootView: View {
    @StateObject private var sessionStore = LectureSessionStore()
    @State private var mode: AppMode = .home
    private let repository: LectureRepository = APILectureRepository()

    var body: some View {
        Group {
            if mode == .home {
                HomeView(mode: $mode)
            } else if mode == .teacher {
                TeacherLectureView(
                    mode: $mode,
                    viewModel: TeacherLectureViewModel(
                        repository: APITeacherRepository(),
                        liveClient: LectureWebSocketClient(baseURL: APIEnvironment.webSocketBaseURL)
                    )
                )
            } else if let lecture = sessionStore.currentLecture {
                LectureRoomView(
                    viewModel: LectureRoomViewModel(
                        lecture: lecture,
                        repository: repository,
                        liveClient: LectureWebSocketClient(baseURL: APIEnvironment.webSocketBaseURL)
                    ),
                    sessionStore: sessionStore
                )
            } else {
                JoinLectureView(
                    mode: $mode,
                    viewModel: JoinLectureViewModel(
                        repository: repository,
                        sessionStore: sessionStore
                    )
                )
            }
        }
    }
}

