const playBtn = document.getElementById("play");
const output = document.getElementById("output");
const speedSelect = document.getElementById("speed_rate");

let currentUtterance = null;
let sentences = [];

const PLAY_LABEL = "\u25B6 \u518d\u751f";
const PAUSE_LABEL = "\u23F8 \u4e00\u6642\u505c\u6b62";
const RESUME_LABEL = "\u25B6 \u518d\u958b";

let playbackState = "idle"; // idle | playing | paused
let pauseMode = "none"; // none | native | fallback
let currentText = "";
let currentSentenceIndex = 0;
let currentRate = 1.0;

function escapeHtml(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
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

function clearHighlight() {
    document.querySelectorAll(".sent").forEach((s) => s.classList.remove("active"));
}

function highlightSentence(index) {
    const spans = document.querySelectorAll(".sent");
    if (!spans.length) return;

    spans.forEach((s) => s.classList.remove("active"));
    if (spans[index]) spans[index].classList.add("active");
}

function setPlayButtonLabel(label) {
    if (!playBtn) return;
    playBtn.textContent = label;
}

function finalizePlayback(resetIndex = true) {
    playbackState = "idle";
    pauseMode = "none";
    currentUtterance = null;

    if (resetIndex) {
        currentSentenceIndex = 0;
        clearHighlight();
    }

    setPlayButtonLabel(PLAY_LABEL);
}

function speakSentence(index) {
    if (!currentText || !sentences.length) {
        finalizePlayback(true);
        return;
    }

    if (index >= sentences.length) {
        index = 0;
    }

    currentSentenceIndex = index;

    const utterance = new SpeechSynthesisUtterance(sentences[index]);
    utterance.lang = "en-US";
    utterance.rate = currentRate;

    utterance.onstart = () => {
        highlightSentence(index);
    };

    utterance.onend = () => {
        if (playbackState !== "playing") return;
        currentSentenceIndex = (index + 1) % sentences.length;
        speakSentence(currentSentenceIndex);
    };

    utterance.onerror = () => {
        if (playbackState !== "playing") return;
        finalizePlayback(false);
    };

    currentUtterance = utterance;
    speechSynthesis.cancel();
    setTimeout(() => speechSynthesis.speak(utterance), 0);
}

function stopTTS() {
    try { speechSynthesis.cancel(); } catch {}
    currentText = "";
    finalizePlayback(true);
}

if (speedSelect) {
    const initialRate = parseFloat(speedSelect.value);
    currentRate = Number.isFinite(initialRate) ? initialRate : 1.0;

    speedSelect.addEventListener("change", () => {
        const nextRate = parseFloat(speedSelect.value);
        currentRate = Number.isFinite(nextRate) ? nextRate : 1.0;

        if (playbackState === "playing") {
            speakSentence(currentSentenceIndex);
            return;
        }

        if (playbackState === "paused" && pauseMode === "native") {
            try { speechSynthesis.cancel(); } catch {}
            pauseMode = "fallback";
        }
    });
}

if (playBtn && output) {
    playBtn.addEventListener("click", () => {
        const text = (output.textContent || "").trim();
        if (!text) return;

        const isNewText = currentText !== text;
        if (isNewText) {
            currentText = text;
            currentSentenceIndex = 0;
            renderSentences(text);
            clearHighlight();
        }

        if (playbackState === "playing") {
            speechSynthesis.pause();

            // Mobile Chrome may ignore pause(). Fallback keeps sentence index.
            setTimeout(() => {
                if (speechSynthesis.paused) {
                    pauseMode = "native";
                } else {
                    pauseMode = "fallback";
                    try { speechSynthesis.cancel(); } catch {}
                }

                playbackState = "paused";
                setPlayButtonLabel(RESUME_LABEL);
            }, 120);
            return;
        }

        if (playbackState === "paused") {
            if (pauseMode === "native" && speechSynthesis.paused) {
                speechSynthesis.resume();
                playbackState = "playing";
                setPlayButtonLabel(PAUSE_LABEL);
                return;
            }

            playbackState = "playing";
            setPlayButtonLabel(PAUSE_LABEL);
            speakSentence(currentSentenceIndex); // restart from current sentence head
            return;
        }

        playbackState = "playing";
        pauseMode = "none";
        setPlayButtonLabel(PAUSE_LABEL);
        speakSentence(currentSentenceIndex);
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
