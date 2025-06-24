# ✅ Functional Requirements

> For **Saut Al-Qur’an (صوت القرآن)** – A Progressive Web App for recording, reviewing, and improving Qur'an recitation with scholar feedback.

---

## 🎤 1. **Recitation Recording**

-   [ ] Users can select **Surah** and **Ayah range** to recite.
-   [ ] Users can **start, pause, resume, and stop** recording using the browser mic.
-   [ ] The recording is saved locally as **binary (Blob)** and/or **base64**, depending on size.
-   [ ] Users can **preview** their recording before submission.
-   [ ] All recordings are timestamped and linked to specific Surah/Ayah context.

---

## 📤 2. **Audio Submission**

-   [ ] Users can **submit recitations** for review.
-   [ ] Recitations are uploaded to the backend as base64 or binary (based on compression efficiency).
-   [ ] Metadata such as user ID, Surah, Ayah range, and time of submission are sent along.
-   [ ] Submission is queued and marked as **pending review**.
-   [ ] App supports **offline-first submission** (recordings saved locally until internet is restored).

---

## 🔊 3. **Interactive Waveform Timeline for Scholars Review**

-   [ ] Display waveform of recorded audio.
-   [ ] Scholars can **zoom in/out** of the waveform for fine navigation.
-   [ ] **Timeline rulers** show time in seconds.
-   [ ] Clickable waveform: seek to any point in the audio.

---

## 🔖 4. **Markers & Repeat Loops**

-   [ ] Scholars can **add custom markers** to specific timestamps.
-   [ ] Each marker can include a **label** (e.g., “tough pronunciation”).
-   [ ] Scholars can **select a range** to loop (A/B repeat playback).
-   [ ] Markers are stored locally and optionally uploaded with the recitation.

---

## 💬 5. **Scholar Review & Feedback**

-   [ ] Scholars can listen to submitted recitations.
-   [ ] Scholars can **add comments**:

    -   [ ] Text comments
    -   [ ] Optional voice/audio feedback

-   [ ] Feedback is linked to specific **timestamps** in the audio.
-   [ ] Each comment is visible in a **list view** with a jump-to-audio control.
-   [ ] Feedback status changes to **Reviewed**.

---

## 🎧 6. **Student Feedback Playback**

-   [ ] Student can view a **list of comments** (text/audio).
-   [ ] Student can click any comment to **jump to the exact timestamp**.
-   [ ] Repeat listening to scholar’s comment or the relevant audio segment.
-   [ ] Mark comments as **resolved**, or revisit them later.

---

## 📈 7. **Progress Tracking**

-   [ ] Track recitations completed by Surah/Ayah.
-   [ ] Show **feedback history** with scholar notes.
-   [ ] Tajweed proficiency levels:

    -   [ ] Basic: Good / Needs Improvement
    -   [ ] Optional: Tajweed rule tagging in future versions

-   [ ] Highlight most common mistakes.

---

## 🔐 8. **Authentication & Roles**

-   [ ] Users can register/login (basic auth, Google, or OTP/email magic link).
-   [ ] Roles:

    -   **User** – record, submit, view feedback
    -   **Scholar** – review, comment, submit feedback
    -   **Admin** – manage roles, users, reports

-   [ ] Scholar access is restricted and admin-approved.

---

## 🌐 9. **PWA Behavior**

-   [ ] Installable on Android/iOS home screen.
-   [ ] Works offline (recording, marker saving, deferred uploads).
-   [ ] Cached assets via service worker.
-   [ ] Fast load time (<1MB initial bundle).

---

## 📦 10. **Backend Functionalities (FastAPI)**

-   [ ] Audio upload endpoint supporting binary or base64.
-   [ ] CRUD for:

    -   Users
    -   Recitations
    -   Comments
    -   Markers

-   [ ] PostgreSQL for all structured data
-   [ ] (Optional) S3/MinIO integration for scalable audio storage
-   [ ] JWT or session-based authentication
-   [ ] Scholar review dashboard APIs
-   [ ] Admin management APIs

---

## 🛡️ 11. **Security & Privacy**

-   [ ] Recitations are private to the user and assigned scholar(s).
-   [ ] HTTPS enforced for all API and frontend interactions.
-   [ ] No data shared externally without explicit user consent.
-   [ ] Audio files are stored securely with user ownership metadata.

---
