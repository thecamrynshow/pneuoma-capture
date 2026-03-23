# App Store Review Notes — PNEUOMA Capture v1.1

Paste the text below into the **"Notes for Reviewer"** field in App Store Connect.

---

## Response to Previous Rejection (Guidelines 5.1.1(i) and 5.1.2(i))

Thank you for the prior review feedback. We have made the following changes to fully address Guidelines 5.1.1(i) and 5.1.2(i):

### 1. No Third-Party AI Services

We have completely removed the OpenAI dependency. All AI processing (speech-to-text transcription, incident parsing, and communication template generation) now runs entirely on PNEUOMA's own AI infrastructure hosted on our private Google Cloud servers. No user data is sent to OpenAI, Google AI, Anthropic, or any other third-party AI provider.

Technical details:
- Speech-to-text: Open-source Whisper model self-hosted on our servers
- Text processing: Open-source Qwen 2.5 model self-hosted on our servers
- All data processed in-memory; audio recordings are not stored after transcription

### 2. In-App Privacy Policy

A full privacy policy is accessible from every screen in the app (persistent link in the footer) and at the dedicated /privacy route. The policy covers:
- What data is collected
- How data is processed (on our own AI infrastructure)
- Explicit statement that no third-party AI services are used
- Data storage and sharing practices
- FERPA compliance details
- User rights and data deletion

### 3. Data Consent Disclosure

Before any AI features are used, a consent banner is displayed that:
- Clearly explains what data is processed (audio recordings, transcript text, incident details)
- States that all processing occurs on PNEUOMA's own servers
- Explicitly states data is never sent to third-party AI services
- Requires the user to acknowledge before proceeding
- Provides a direct link to the full privacy policy

### 4. Microphone Permission

The app requests microphone access with a clear usage description: "PNEUOMA Capture uses the microphone to record voice notes about school incidents, which are then transcribed to text for documentation."

### Demo Instructions

1. Open the app and tap "Capture" in the bottom navigation
2. You will see the Data Consent banner — tap "I Understand — Continue"
3. Tap the microphone button and say something like: "Marcus and Tyler got into a shoving match by the gym at 10:15. Ms. Rodriguez broke it up."
4. The app will transcribe and parse the recording, then show a pre-filled incident form
5. Review the form and tap "Save Incident"
6. The incident appears in the Incidents list with full details
7. The Privacy Policy link is visible at the bottom of every screen
