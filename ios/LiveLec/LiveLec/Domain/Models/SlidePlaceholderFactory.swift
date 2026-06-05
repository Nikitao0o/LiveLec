import Foundation
import UIKit

enum SlidePlaceholderFactory {
    nonisolated static func makeSlide(title: String) -> SlideInfo {
        SlideInfo(
            title: title,
            pdfData: makePDF(title: title)
        )
    }

    nonisolated private static func makePDF(title: String) -> Data {
        let bounds = CGRect(x: 0, y: 0, width: 1024, height: 768)
        let renderer = UIGraphicsPDFRenderer(bounds: bounds)

        return renderer.pdfData { context in
            context.beginPage()

            let pageBounds = context.pdfContextBounds.insetBy(dx: 72, dy: 72)
            UIColor(red: 0.20, green: 0.36, blue: 0.88, alpha: 1).setFill()
            UIBezierPath(
                roundedRect: CGRect(x: pageBounds.minX, y: pageBounds.minY, width: pageBounds.width, height: 16),
                cornerRadius: 8
            ).fill()

            let titleAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 56, weight: .bold),
                .foregroundColor: UIColor(red: 0.10, green: 0.16, blue: 0.29, alpha: 1)
            ]
            NSString(string: title)
                .draw(in: CGRect(x: pageBounds.minX, y: pageBounds.minY + 116, width: pageBounds.width, height: 90), withAttributes: titleAttributes)

            let subtitleAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 30, weight: .medium),
                .foregroundColor: UIColor(red: 0.35, green: 0.39, blue: 0.48, alpha: 1)
            ]
            NSString(string: "Слайды появятся здесь, когда backend начнет отдавать материалы лекции.")
                .draw(in: CGRect(x: pageBounds.minX, y: pageBounds.minY + 230, width: pageBounds.width * 0.76, height: 130), withAttributes: subtitleAttributes)
        }
    }
}
