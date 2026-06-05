import SwiftUI
import UniformTypeIdentifiers

struct TeacherLectureView: View {
    @Binding var mode: AppMode
    @StateObject private var viewModel: TeacherLectureViewModel
    @State private var isFileImporterPresented = false

    init(mode: Binding<AppMode>, viewModel: TeacherLectureViewModel) {
        _mode = mode
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        ZStack {
            LLColors.background
                .ignoresSafeArea()

            VStack(spacing: 0) {
                topBar

                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        if viewModel.lecture == nil {
                            authSection
                            createLectureSection
                        } else {
                            liveLectureSection
                            presentationSection
                            speechSection
                            questionsSection
                        }

                        if let errorMessage = viewModel.errorMessage {
                            Text(errorMessage)
                                .font(LLTypography.caption)
                                .foregroundStyle(.red)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.top, 4)
                        }
                    }
                    .padding(16)
                    .padding(.bottom, 28)
                }
            }
        }
        .fileImporter(
            isPresented: $isFileImporterPresented,
            allowedContentTypes: [.pdf, UTType(filenameExtension: "pptx") ?? .data],
            allowsMultipleSelection: false
        ) { result in
            guard case .success(let urls) = result, let url = urls.first else { return }
            Task {
                await viewModel.uploadPresentation(fileURL: url)
            }
        }
    }

    private var topBar: some View {
        HStack {
            Button {
                mode = .home
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 36, height: 36)
                    .background(.white.opacity(0.18))
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 2) {
                Text("ПАНЕЛЬ ПРЕПОДАВАТЕЛЯ")
                    .font(LLTypography.caption)
                    .foregroundStyle(.white.opacity(0.72))

                Text("LiveLec")
                    .font(.system(size: 18, weight: .heavy, design: .rounded))
                    .foregroundStyle(.white)
            }

            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 16)
        .background(LLColors.primary)
    }

    private var authSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(viewModel.isRegisterMode ? "Создать аккаунт" : "Войти")
                    .font(LLTypography.h2)
                    .foregroundStyle(LLColors.textPrimary)

                Spacer()

                Button(viewModel.isRegisterMode ? "У меня есть аккаунт" : "Регистрация") {
                    viewModel.isRegisterMode.toggle()
                }
                .font(LLTypography.caption)
                .foregroundStyle(LLColors.primary)
            }

            if viewModel.isRegisterMode {
                teacherTextField("Имя", text: $viewModel.name, systemImage: "person")
            }

            teacherTextField("Email", text: $viewModel.email, systemImage: "envelope", keyboardType: .emailAddress)
            teacherSecureField("Пароль", text: $viewModel.password)

            LLPrimaryButton(
                title: viewModel.isLoading ? "Подождите..." : (viewModel.isRegisterMode ? "Зарегистрироваться" : "Войти"),
                systemImage: "arrow.right",
                isLoading: viewModel.isLoading
            ) {
                Task {
                    await viewModel.authenticate()
                }
            }
            .disabled(!viewModel.canAuthenticate)
            .opacity(viewModel.canAuthenticate ? 1 : 0.55)
        }
        .sectionCard()
    }

    private var createLectureSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Новая лекция")
                .font(LLTypography.h2)
                .foregroundStyle(LLColors.textPrimary)

            teacherTextField("Название лекции", text: $viewModel.title, systemImage: "text.book.closed")
            teacherTextField("Дисциплина", text: $viewModel.discipline, systemImage: "tag")

            LLPrimaryButton(
                title: viewModel.isLoading ? "Создаю..." : "Создать лекцию",
                systemImage: "plus",
                isLoading: viewModel.isLoading
            ) {
                Task {
                    await viewModel.createLecture()
                }
            }
            .disabled(!viewModel.canCreateLecture)
            .opacity(viewModel.canCreateLecture ? 1 : 0.55)
        }
        .sectionCard()
    }

    private var liveLectureSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            if let lecture = viewModel.lecture {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(lecture.title)
                            .font(LLTypography.h2)
                            .foregroundStyle(LLColors.textPrimary)

                        if let discipline = lecture.discipline, !discipline.isEmpty {
                            Text(discipline)
                                .font(LLTypography.caption)
                                .foregroundStyle(LLColors.textSecondary)
                        }
                    }

                    Spacer()

                    Text(lecture.status.title.uppercased())
                        .font(LLTypography.caption)
                        .foregroundStyle(LLColors.primary)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(LLColors.primary.opacity(0.08))
                        .clipShape(Capsule())
                }

                VStack(spacing: 8) {
                    Text("PIN ДЛЯ СТУДЕНТОВ")
                        .font(LLTypography.caption)
                        .foregroundStyle(LLColors.textSecondary)

                    Text(lecture.pinCode)
                        .font(.system(size: 52, weight: .black, design: .monospaced))
                        .foregroundStyle(LLColors.primary)
                        .minimumScaleFactor(0.75)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .background(LLColors.primary.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 22))

                HStack(spacing: 12) {
                    metric(title: "Участники", value: "\(viewModel.participantsCount)")
                    metric(title: "Не понимаю", value: "\(viewModel.confusionCount)")
                }

                HStack(spacing: 12) {
                    Button {
                        viewModel.toggleRecording()
                    } label: {
                        teacherActionLabel(
                            viewModel.isRecording ? "Остановить речь" : "Запустить речь",
                            systemImage: viewModel.isRecording ? "mic.slash.fill" : "mic.fill",
                            color: viewModel.isRecording ? .red : LLColors.primary
                        )
                    }
                    .buttonStyle(.plain)

                    Button {
                        Task { await viewModel.finishLecture() }
                    } label: {
                        teacherActionLabel("Завершить", systemImage: "xmark.circle.fill", color: .red)
                    }
                    .buttonStyle(.plain)

                    Button {
                        viewModel.resetLecture()
                    } label: {
                        teacherActionLabel("Новая", systemImage: "plus.circle", color: LLColors.textSecondary)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .sectionCard()
    }

    private var presentationSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("Презентация")
                    .font(LLTypography.h2)
                    .foregroundStyle(LLColors.textPrimary)

                Spacer()

                Button {
                    isFileImporterPresented = true
                } label: {
                    HStack(spacing: 8) {
                        if viewModel.isUploadingPresentation {
                            ProgressView()
                        }
                        Image(systemName: "doc.badge.plus")
                        Text("Загрузить")
                    }
                    .font(LLTypography.caption)
                    .foregroundStyle(LLColors.primary)
                }
                .buttonStyle(.plain)
                .disabled(viewModel.isUploadingPresentation)
            }

            if let lecture = viewModel.lecture {
                LLSlideCard(
                    lectureID: lecture.id,
                    pinCode: lecture.pinCode,
                    slideNumber: lecture.currentSlideNumber,
                    slideCount: lecture.slideCount,
                    title: lecture.title
                )

                HStack(spacing: 12) {
                    Button {
                        viewModel.previousSlide()
                    } label: {
                        teacherActionLabel("Назад", systemImage: "chevron.left", color: LLColors.textSecondary)
                    }
                    .buttonStyle(.plain)
                    .disabled(lecture.slideCount == 0 || lecture.currentSlideNumber <= 1)

                    Button {
                        viewModel.nextSlide()
                    } label: {
                        teacherActionLabel("Вперед", systemImage: "chevron.right", color: LLColors.primary)
                    }
                    .buttonStyle(.plain)
                    .disabled(lecture.slideCount == 0 || lecture.currentSlideNumber >= lecture.slideCount)
                }
            }
        }
        .sectionCard()
    }

    private var speechSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Распознавание речи")
                    .font(LLTypography.h2)
                    .foregroundStyle(LLColors.textPrimary)

                Spacer()

                Circle()
                    .fill(viewModel.isRecording ? .red : LLColors.textSecondary)
                    .frame(width: 10, height: 10)
            }

            if !viewModel.asrStatus.isEmpty {
                Text(viewModel.asrStatus)
                    .font(LLTypography.caption)
                    .foregroundStyle(LLColors.textSecondary)
            }

            Text(viewModel.transcript.isEmpty ? "После запуска микрофона здесь появится текст, который получат студенты." : viewModel.transcript)
                .font(LLTypography.body)
                .foregroundStyle(viewModel.transcript.isEmpty ? LLColors.textSecondary : LLColors.textPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(14)
                .background(LLColors.background)
                .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .sectionCard()
    }

    private var questionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Вопросы студентов")
                .font(LLTypography.h2)
                .foregroundStyle(LLColors.textPrimary)

            if viewModel.questions.isEmpty {
                Text("Пока вопросов нет. Они появятся здесь в live-режиме.")
                    .font(LLTypography.body)
                    .foregroundStyle(LLColors.textSecondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 10)
            } else {
                ForEach(viewModel.questions) { question in
                    LLQuestionCard(question: question)
                }
            }
        }
        .sectionCard()
    }

    private func teacherTextField(
        _ placeholder: String,
        text: Binding<String>,
        systemImage: String,
        keyboardType: UIKeyboardType = .default
    ) -> some View {
        HStack(spacing: 10) {
            Image(systemName: systemImage)
                .foregroundStyle(LLColors.textSecondary)
                .frame(width: 22)

            TextField(placeholder, text: text)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .keyboardType(keyboardType)
                .font(LLTypography.body)
        }
        .padding(.horizontal, 14)
        .frame(height: 52)
        .background(LLColors.background)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func teacherSecureField(_ placeholder: String, text: Binding<String>) -> some View {
        HStack(spacing: 10) {
            Image(systemName: "lock")
                .foregroundStyle(LLColors.textSecondary)
                .frame(width: 22)

            SecureField(placeholder, text: text)
                .font(LLTypography.body)
        }
        .padding(.horizontal, 14)
        .frame(height: 52)
        .background(LLColors.background)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func metric(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title.uppercased())
                .font(LLTypography.caption)
                .foregroundStyle(LLColors.textSecondary)
            Text(value)
                .font(LLTypography.h2)
                .foregroundStyle(LLColors.textPrimary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(LLColors.background)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func teacherActionLabel(_ title: String, systemImage: String, color: Color) -> some View {
        HStack(spacing: 8) {
            Image(systemName: systemImage)
            Text(title)
        }
        .font(LLTypography.caption)
        .foregroundStyle(color)
        .frame(maxWidth: .infinity)
        .frame(height: 46)
        .background(color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 15))
    }
}

private extension View {
    func sectionCard() -> some View {
        padding(16)
            .background(LLColors.surface)
            .clipShape(RoundedRectangle(cornerRadius: 22))
            .shadow(color: .black.opacity(0.06), radius: 12, y: 4)
    }
}

