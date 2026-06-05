import SwiftUI

enum AppMode {
    case home
    case student
    case teacher
}

struct HomeView: View {
    @Binding var mode: AppMode

    var body: some View {
        ZStack {
            LLColors.background
                .ignoresSafeArea()

            VStack(spacing: 26) {
                topHeader

                VStack(spacing: 14) {
                    LLPrimaryButton(title: "Я студент", systemImage: "person.fill") {
                        mode = .student
                    }

                    Button {
                        mode = .teacher
                    } label: {
                        HStack(spacing: 10) {
                            Text("Я преподаватель")
                                .font(LLTypography.h3)
                            Image(systemName: "graduationcap.fill")
                                .font(.system(size: 18, weight: .bold))
                        }
                        .foregroundStyle(LLColors.primary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 62)
                        .background(LLColors.surface)
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .overlay {
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(LLColors.border, lineWidth: 1)
                        }
                    }
                    .buttonStyle(.plain)
                }

                Spacer()
            }
            .padding(.horizontal, LLSpacing.lg)
        }
    }

    private var topHeader: some View {
        VStack(spacing: 10) {
            Text("LiveLec")
                .font(LLTypography.title)
                .foregroundStyle(LLColors.textPrimary)

            Text("Выберите роль для проверки live-лекции")
                .font(LLTypography.body)
                .foregroundStyle(LLColors.textSecondary)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 76)
    }

}

