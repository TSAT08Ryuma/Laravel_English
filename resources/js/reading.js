const playBtn = document.getElementById("play");
const output = document.getElementById("output");

let currentUtterance = null;
let sentences = [];
const START_WORD = "uh. . . . . . .";
const offset = START_WORD.length;

const PLAY_LABEL = "▶ 再生";
const PAUSE_LABEL = "⏸ 一時停止";
const RESUME_LABEL = "▶ 再開";

let playbackState = "idle"; // idle | playing | paused
let currentText = "";
let resumeCharIndex = 0;
let chunkStartIndex = 0;

function escapeHtml(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function splitIntoSentences(text) {
    const t = text.replace(/\s+/g, " ").trim();
    const arr = t.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
    return arr ? arr.map((s) => s.trim()) : [t];
}

function renderSentences(text) {
    if (!output) return;
    sentences = splitIntoSentences(text);
    output.innerHTML = sentences
        .map((s, i) => `<span class="sent" data-i="${i}">${escapeHtml(s)}</span> `)
        .join("");
}

function highlight(charIndex) {
    const spans = document.querySelectorAll(".sent");
    if (!spans.length || !sentences.length) return;

    let acc = 0;
    for (let i = 0; i < sentences.length; i++) {
        const start = acc;
        const end = acc + sentences[i].length;
        if (charIndex >= start && charIndex < end) {
            spans.forEach((s) => s.classList.remove("active"));
            spans[i].classList.add("active");
            break;
        }
        acc = end + 1;
    }
}


function setPlayButtonLabel(label) {
    if (!playBtn) return;
    playBtn.textContent = label;
}

function finalizePlayback() {
    playbackState = "idle";
    currentUtterance = null;
    resumeCharIndex = 0;
    chunkStartIndex = 0;
    setPlayButtonLabel(PLAY_LABEL);
}

function startSpeakingFromIndex(startIndex) {
    if (!currentText) return;

    const safeStart = Math.max(0, Math.min(startIndex, currentText.length));
    const remaining = currentText.slice(safeStart);

    if (!remaining.trim()) {
        finalizePlayback();
        return;
    }

    chunkStartIndex = safeStart;
    const utterance = new SpeechSynthesisUtterance(START_WORD + remaining);
    utterance.lang = "en-US";
    utterance.rate = 1.0;

    utterance.onboundary = (event) => {
        const localIdx = Math.max(0, event.charIndex - offset);
        const idx = Math.min(currentText.length, chunkStartIndex + localIdx);
        resumeCharIndex = idx;
        highlight(idx);
    };

    utterance.onend = () => {
        if (playbackState === "paused") return;
        finalizePlayback();
    };

    utterance.onerror = () => {
        if (playbackState === "paused") return;
        finalizePlayback();
    };

    currentUtterance = utterance;
    playbackState = "playing";
    speechSynthesis.cancel();
    setTimeout(() => speechSynthesis.speak(utterance), 0);
    setPlayButtonLabel(PAUSE_LABEL);
}

function stopTTS() {
    try { speechSynthesis.cancel(); } catch {}
    currentText = "";
    finalizePlayback();
}

if (playBtn && output) {
    playBtn.addEventListener("click", () => {
        const text = (output.textContent || "").trim();
        if (!text) return;

        renderSentences(text);

        const isNewText = currentText !== text;
        if (isNewText) {
            currentText = text;
            resumeCharIndex = 0;
            chunkStartIndex = 0;
        }

        if (playbackState === "playing") {
            speechSynthesis.pause();

            // Mobile Chrome can ignore pause(); fallback to cancel + index resume.
            setTimeout(() => {
                if (speechSynthesis.paused) {
                    playbackState = "paused";
                    setPlayButtonLabel(RESUME_LABEL);
                    return;
                }

                playbackState = "paused";
                try { speechSynthesis.cancel(); } catch {}
                setPlayButtonLabel(RESUME_LABEL);
            }, 120);
            return;
        }

        if (playbackState === "paused") {
            if (speechSynthesis.paused) {
                speechSynthesis.resume();
                playbackState = "playing";
                setPlayButtonLabel(PAUSE_LABEL);
                return;
            }

            startSpeakingFromIndex(resumeCharIndex);
            return;
        }
        startSpeakingFromIndex(0);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("tr[data-content]").forEach((tr) => {
        tr.addEventListener("click", (e) => {
            if (e.target.closest("form")) return;
            const text = tr.dataset.content || "";
            if (!output || !text) return;
            renderSentences(text);
            stopTTS();
        });
    });
});

window.addEventListener("beforeunload", stopTTS);
window.addEventListener("pagehide", stopTTS);
