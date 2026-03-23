import Foundation
import AVFoundation
import Capacitor

@objc(AudioRecorderPlugin)
public class AudioRecorderPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AudioRecorderPlugin"
    public let jsName = "AudioRecorder"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startRecording", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopRecording", returnType: CAPPluginReturnPromise),
    ]

    private var audioRecorder: AVAudioRecorder?
    private var recordingURL: URL?

    @objc func requestPermission(_ call: CAPPluginCall) {
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
            call.resolve(["granted": granted])
        }
    }

    @objc func startRecording(_ call: CAPPluginCall) {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
            try session.setActive(true)
        } catch {
            call.reject("Failed to configure audio session: \(error.localizedDescription)")
            return
        }

        let tempDir = FileManager.default.temporaryDirectory
        let url = tempDir.appendingPathComponent("pneuoma_recording_\(Date().timeIntervalSince1970).m4a")
        recordingURL = url

        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 16000,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.medium.rawValue,
            AVEncoderBitRateKey: 32000,
        ]

        do {
            audioRecorder = try AVAudioRecorder(url: url, settings: settings)
            audioRecorder?.record()
            call.resolve(["recording": true])
        } catch {
            call.reject("Failed to start recording: \(error.localizedDescription)")
        }
    }

    @objc func stopRecording(_ call: CAPPluginCall) {
        guard let recorder = audioRecorder, recorder.isRecording else {
            call.reject("No active recording")
            return
        }

        recorder.stop()
        audioRecorder = nil

        guard let url = recordingURL else {
            call.reject("No recording file found")
            return
        }

        do {
            let data = try Data(contentsOf: url)
            let base64 = data.base64EncodedString()
            try FileManager.default.removeItem(at: url)
            recordingURL = nil
            call.resolve([
                "base64": base64,
                "mimeType": "audio/mp4",
                "duration": recorder.currentTime,
            ])
        } catch {
            call.reject("Failed to read recording: \(error.localizedDescription)")
        }
    }
}
