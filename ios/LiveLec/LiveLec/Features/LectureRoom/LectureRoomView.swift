import SwiftUI

struct LectureRoomView: View {
    @ObservedObject var sessionStore: LectureSessionStore
    @StateObject private var viewModel: LectureRoomViewModel

    init(viewModel: LectureRoomViewModel, sessionStore: LectureSessionStore) {
        self.sessionStore = sessionStore
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        ZStack {
            LLColors.background
                .ignoresSafeArea()

            VStack(spacing: 0) {
                topBar
                speechBanner

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        lectureSummary
                        LLSlideCard(
                            lectureID: viewModel.lecture.id,
                            pinCode: viewModel.lecture.pinCode,
                            slideNumber: viewModel.lecture.currentSlideNumber,
                            slideCount: viewModel.lecture.slideCount,
                            title: viewModel.lecture.title
                        )

                        VStack(alignment: .leading, spacing: 12) {
                            Text("ВОПРОСЫ АУДИТОРИИ")
                                .font(LLTypography.caption)
                                .foregroundStyle(LLColors.textSecondary)

                            if viewModel.lecture.questions.isEmpty {
                                Text("Пока вопросов нет")
                                    .font(LLTypography.body)
                                    .foregroundStyle(LLColors.textSecondary)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(16)
                                    .background(LLColors.surface)
                                    .clipShape(RoundedRectangle(cornerRadius: 18))
                            } else {
                                ForEach(viewModel.lecture.questions) { question in
                                    LLQuestionCard(question: question) {
                                        viewModel.likeQuestion(question)
                                    }
                                }
                            }
                        }
                    }
                    .padding(16)
                    .padding(.bottom, 20)
                }

                VStack(spacing: 14) {
                    if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage)
                            .font(LLTypography.caption)
                            .foregroundStyle(.red)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Button {
                        viewModel.sendConfusionSignal()
                    } label: {
                        HStack(spacing: 10) {
                            if viewModel.isSendingConfusion {
                                ProgressView()
                                    .tint(.white)
                            }

                            Text(viewModel.cooldownSeconds > 0 ? "ЖДИТЕ \(viewModel.cooldownSeconds) СЕК" : "Я НЕ ПОНИМАЮ")
                                .font(LLTypography.h2)
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background((viewModel.lecture.status == .finished || viewModel.cooldownSeconds > 0) ? LLColors.textSecondary : LLColors.accent)
                        .clipShape(RoundedRectangle(cornerRadius: 18))
                        .scaleEffect(viewModel.confusionPulse ? 0.97 : 1)
                    }
                    .buttonStyle(.plain)
                    .disabled(viewModel.lecture.status == .finished || viewModel.cooldownSeconds > 0)

                    HStack(spacing: 12) {
                        TextField("Задать вопрос...", text: $viewModel.questionText)
                            .font(LLTypography.body)

                        Button(viewModel.isSendingQuestion ? "..." : "Отпр.") {
                            viewModel.sendQuestion()
                        }
                        .font(LLTypography.caption)
                        .foregroundStyle(LLColors.primary)
                        .disabled(viewModel.isSendingQuestion || viewModel.lecture.status == .finished)
                    }
                    .padding(.horizontal, 16)
                    .frame(height: 54)
                    .background(LLColors.surface)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                }
                .padding(16)
                .background(LLColors.background)
            }
        }
        .onAppear {
            viewModel.connect()
        }
        .onDisappear {
            viewModel.disconnect()
        }
    }

    private var topBar: some View {
        HStack {
            Text("LIVELEC")
                .font(.system(size: 14, weight: .heavy, design: .rounded))
                .foregroundStyle(.white)

            Spacer()

            Text("PIN: \(viewModel.lecture.pinCode)")
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(.white.opacity(0.18))
                .clipShape(Capsule())

            Text(viewModel.lecture.status.title.uppercased())
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(.white.opacity(0.18))
                .clipShape(Capsule())

            Button {
                sessionStore.currentLecture = nil
                sessionStore.errorMessage = nil
            } label: {
                Image(systemName: "rectangle.portrait.and.arrow.right")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 34, height: 34)
                    .background(.white.opacity(0.18))
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Выйти из лекции")
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 16)
        .background(LLColors.primary)
    }

    private var speechBanner: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Circle()
                    .fill(viewModel.lecture.status == .active ? .red : .orange)
                    .frame(width: 10, height: 10)

                Text(viewModel.lecture.status == .active ? "РАСПОЗНАВАНИЕ РЕЧИ" : "ЛЕКЦИЯ НЕ В ЭФИРЕ")
                    .font(LLTypography.caption)
                    .foregroundStyle(.white.opacity(0.72))
            }

            Text(viewModel.subtitles)
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .italic()
                .foregroundStyle(.white)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(LLColors.secondary)
    }

    private var lectureSummary: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(viewModel.lecture.title)
                .font(LLTypography.h2)
                .foregroundStyle(LLColors.textPrimary)

            HStack(spacing: 10) {
                if let discipline = viewModel.lecture.discipline, !discipline.isEmpty {
                    Text(discipline)
                }

                if viewModel.participantsCount > 0 {
                    Text("Участников: \(viewModel.participantsCount)")
                }
            }
            .font(LLTypography.caption)
            .foregroundStyle(LLColors.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

