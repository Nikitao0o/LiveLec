import SwiftUI

struct LLSlideCard: View {
    let lectureID: Int
    let pinCode: String
    let slideNumber: Int
    let slideCount: Int
    let title: String

    private var slideURL: URL? {
        guard slideCount > 0 else { return nil }
        return APIEnvironment.slideURL(
            lectureID: lectureID,
            slideNumber: max(1, slideNumber),
            pinCode: pinCode
        )
    }

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Group {
                if let slideURL {
                    AsyncImage(url: slideURL) { phase in
                        switch phase {
                        case .empty:
                            ProgressView()
                                .tint(.white)
                        case .success(let image):
                            image
                                .resizable()
                                .scaledToFit()
                                .frame(maxWidth: .infinity, maxHeight: .infinity)
                        case .failure:
                            placeholder("Слайд пока недоступен")
                        @unknown default:
                            placeholder("Ожидание слайда")
                        }
                    }
                } else {
                    placeholder("Преподаватель еще не загрузил презентацию")
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            Text(slideCount > 0 ? "СЛАЙД \(slideNumber)/\(slideCount)" : "НЕТ СЛАЙДОВ")
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .foregroundStyle(.white)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(.black.opacity(0.45))
                .clipShape(Capsule())
                .padding(12)
        }
        .frame(height: 280)
        .frame(maxWidth: .infinity)
        .background(LLColors.secondary)
        .clipShape(RoundedRectangle(cornerRadius: 22))
        .shadow(color: .black.opacity(0.12), radius: 14, y: 4)
        .overlay {
            RoundedRectangle(cornerRadius: 22)
                .stroke(LLColors.border, lineWidth: 1)
        }
    }

    private func placeholder(_ message: String) -> some View {
        VStack(spacing: 10) {
            Text(title)
                .font(LLTypography.h2)
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)

            Text(message)
                .font(LLTypography.caption)
                .foregroundStyle(.white.opacity(0.72))
                .multilineTextAlignment(.center)
        }
        .padding(24)
    }
}

