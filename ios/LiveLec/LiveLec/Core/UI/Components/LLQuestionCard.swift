import SwiftUI

struct LLQuestionCard: View {
    let question: Question
    let onLike: () -> Void

    init(question: Question, onLike: @escaping () -> Void = {}) {
        self.question = question
        self.onLike = onLike
    }

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                Text(question.text)
                    .font(LLTypography.body)
                    .foregroundStyle(LLColors.textPrimary)

                Text(question.isLikedByCurrentUser ? "Вы поддержали этот вопрос" : "Вопрос аудитории")
                    .font(LLTypography.small)
                    .foregroundStyle(LLColors.textSecondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Button(action: onLike) {
                VStack(spacing: 4) {
                    Image(systemName: question.isLikedByCurrentUser ? "triangle.fill" : "triangle")
                        .font(.system(size: 12, weight: .bold))
                    Text("\(question.likesCount)")
                        .font(LLTypography.caption)
                }
                .foregroundStyle(LLColors.primary)
                .frame(width: 44, height: 44)
                .background(LLColors.primary.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .buttonStyle(.plain)
            .disabled(question.isLikedByCurrentUser)
        }
        .padding(16)
        .background(LLColors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .shadow(color: .black.opacity(0.06), radius: 12, y: 4)
    }
}

