import AVFoundation
import Combine
import Foundation

@MainActor
final class AudioChunkRecorder: ObservableObject {
    @Published private(set) var isRecording = false

    var onChunk: ((String) -> Void)?
    var onError: ((String) -> Void)?

    private var recorder: AVAudioRecorder?
    private var segmentTask: Task<Void, Never>?
    private var currentURL: URL?

    func toggle() {
        if isRecording {
            stop()
        } else {
            Task { await start() }
        }
    }

    func start() async {
        guard !isRecording else { return }

        let granted = await requestPermission()
        guard granted else {
            onError?("Разрешите доступ к микрофону в настройках iOS")
            return
        }

        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .spokenAudio, options: [.defaultToSpeaker, .allowBluetoothHFP])
            try session.setActive(true)
            isRecording = true
            startSegment()
            scheduleSegmentRotation()
        } catch {
            onError?("Не удалось запустить микрофон")
            stop()
        }
    }

    func stop() {
        segmentTask?.cancel()
        segmentTask = nil
        finishCurrentSegment()
        isRecording = false
        try? AVAudioSession.sharedInstance().setActive(false)
    }

    private func scheduleSegmentRotation() {
        segmentTask?.cancel()
        segmentTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(3))
                guard !Task.isCancelled else { return }
                self?.rotateSegment()
            }
        }
    }

    private func rotateSegment() {
        guard isRecording else { return }
        finishCurrentSegment()
        startSegment()
    }

    private func startSegment() {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("livelec-audio-\(UUID().uuidString)")
            .appendingPathExtension("m4a")
        currentURL = url

        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 16_000,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.medium.rawValue
        ]

        do {
            let recorder = try AVAudioRecorder(url: url, settings: settings)
            recorder.prepareToRecord()
            recorder.record()
            self.recorder = recorder
        } catch {
            onError?("Не удалось создать аудио-сегмент")
            stop()
        }
    }

    private func finishCurrentSegment() {
        guard let recorder, let url = currentURL else { return }
        recorder.stop()
        self.recorder = nil
        currentURL = nil

        guard
            let data = try? Data(contentsOf: url),
            data.count > 2_500
        else {
            try? FileManager.default.removeItem(at: url)
            return
        }

        onChunk?(data.base64EncodedString())
        try? FileManager.default.removeItem(at: url)
    }

    private func requestPermission() async -> Bool {
        await withCheckedContinuation { continuation in
            if #available(iOS 17.0, *) {
                AVAudioApplication.requestRecordPermission { granted in
                    continuation.resume(returning: granted)
                }
            } else {
                AVAudioSession.sharedInstance().requestRecordPermission { granted in
                    continuation.resume(returning: granted)
                }
            }
        }
    }
}
