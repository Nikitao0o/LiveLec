import SwiftUI

struct JoinLectureView: View {
    @Binding var mode: AppMode
    @StateObject private var viewModel: JoinLectureViewModel

    init(mode: Binding<AppMode>, viewModel: JoinLectureViewModel) {
        _mode = mode
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        ZStack {
            LLColors.background
                .ignoresSafeArea()

            VStack(spacing: 0) {
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

                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.top, 14)
                .zIndex(1)

                topHeader
                    .padding(.top, -50)

                ScrollView {
                    VStack(spacing: 22) {
                        VStack(spacing: 10) {
                            Text("Подключиться к лекции")
                                .font(LLTypography.h2)
                                .foregroundStyle(LLColors.textPrimary)

                            Text("Введите 6-значный PIN-код, который вы видите на экране преподавателя")
                                .font(LLTypography.body)
                                .foregroundStyle(LLColors.textSecondary)
                                .multilineTextAlignment(.center)
                        }

                        LLPinCodeField(pin: $viewModel.pinCode)

                        if let errorMessage = viewModel.errorMessage {
                            Text(errorMessage)
                                .font(LLTypography.caption)
                                .foregroundStyle(.red)
                                .multilineTextAlignment(.center)
                                .frame(maxWidth: .infinity)
                                .padding(.horizontal, 8)
                        }

                        LLPrimaryButton(
                            title: viewModel.isLoading ? "Подключение..." : "Войти в лекцию",
                            systemImage: "arrow.right",
                            isLoading: viewModel.isLoading
                        ) {
                            dismissKeyboard()
                            Task {
                                await viewModel.joinLecture()
                            }
                        }
                        .disabled(!viewModel.isJoinEnabled)
                        .opacity(viewModel.isJoinEnabled ? 1 : 0.6)
                    }
                    .padding(.horizontal, LLSpacing.lg)
                    .padding(.top, 36)
                    .padding(.bottom, 40)
                }
                .scrollDismissesKeyboard(.interactively)

                Spacer()
            }
        }
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Готово") {
                    dismissKeyboard()
                }
            }
        }
    }

    private var topHeader: some View {
        ZStack {
            LinearGradient(
                colors: [LLColors.primary, LLColors.secondary],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .frame(height: 228)
            .clipShape(
                UnevenRoundedRectangle(
                    bottomLeadingRadius: 30,
                    bottomTrailingRadius: 30
                )
            )

            VStack(spacing: 8) {
                Text("LiveLec")
                    .font(LLTypography.title)
                    .foregroundStyle(.white)

                Text("ИНТЕРАКТИВНЫЕ ЛЕКЦИИ")
                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                    .tracking(2)
                    .foregroundStyle(.white.opacity(0.9))
            }
            .padding(.top, 32)
        }
    }

    private func dismissKeyboard() {
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }
}

