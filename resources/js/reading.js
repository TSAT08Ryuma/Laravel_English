const playBtn = document.getElementById("play");
const nextBtn = document.getElementById("next_story");
const randomBtn = document.getElementById("random_story");
const output = document.getElementById("output");
const speedSelect = document.getElementById("speed_rate");
const voiceSelect = document.getElementById("voice_select");

let currentUtterance = null;
let sentences = [];
let voices = [];

const PLAY_LABEL = "\u25B6";
const PAUSE_LABEL = "||";
const RESUME_LABEL = "\u25B6";
const VOICE_STORAGE_KEY = "reading_voice_uri";

let playbackState = "idle"; // idle | playing | paused
let pauseMode = "none"; // none | native | fallback
let currentText = "";
let currentSentenceIndex = 0;
let currentRate = 1.0;
let selectedVoiceURI = "";
let currentHistoryIndex = -1;

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

    spans.forEach((s) => {
        s.classList.remove("active");
    });
    if (spans[index]) spans[index].classList.add("active");
}

function setPlayButtonLabel(label) {
    if (!playBtn) return;

    playBtn.textContent = label;
    const ariaLabel = label === PAUSE_LABEL ? "一時停止" : "再生";
    playBtn.setAttribute("aria-label", ariaLabel);
    playBtn.setAttribute("title", ariaLabel);
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

function getStoredVoiceURI() {
    try {
        return localStorage.getItem(VOICE_STORAGE_KEY) || "";
    } catch {
        return "";
    }
}

function setStoredVoiceURI(uri) {
    try {
        localStorage.setItem(VOICE_STORAGE_KEY, uri || "");
    } catch {}
}

function getSelectedVoice() {
    if (!selectedVoiceURI || !voices.length) return null;
    return voices.find((v) => v.voiceURI === selectedVoiceURI) || null;
}

function refreshVoices() {
    if (!voiceSelect || typeof speechSynthesis === "undefined") return;

    const found = speechSynthesis.getVoices() || [];
    if (!found.length) return;

    voices = [...found].sort((a, b) => {
        const aEn = a.lang && a.lang.toLowerCase().startsWith("en") ? 0 : 1;
        const bEn = b.lang && b.lang.toLowerCase().startsWith("en") ? 0 : 1;
        if (aEn !== bEn) return aEn - bEn;
        return `${a.lang} ${a.name}`.localeCompare(`${b.lang} ${b.name}`);
    });

    const remembered = selectedVoiceURI || getStoredVoiceURI();

    voiceSelect.innerHTML = "";
    const autoOption = document.createElement("option");
    autoOption.value = "";
    autoOption.textContent = "Default";
    voiceSelect.appendChild(autoOption);

    voices.forEach((voice) => {
        const option = document.createElement("option");
        option.value = voice.voiceURI;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
    });

    if (remembered && voices.some((v) => v.voiceURI === remembered)) {
        selectedVoiceURI = remembered;
    } else {
        const firstEnglish = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("en"));
        selectedVoiceURI = firstEnglish ? firstEnglish.voiceURI : "";
    }

    voiceSelect.value = selectedVoiceURI;
    setStoredVoiceURI(selectedVoiceURI);
}

function getHistoryRows() {
    return Array.from(document.querySelectorAll("tr[data-content]"));
}

function updateActiveHistoryRow() {
    const rows = getHistoryRows();

    rows.forEach((row, idx) => {
        const isActive = idx === currentHistoryIndex;
        row.classList.toggle("bg-amber-50", isActive);
        row.classList.toggle("shadow-sm", isActive);

        const card = row.querySelector("td > div");
        if (card) {
            card.classList.toggle("ring-1", isActive);
            card.classList.toggle("ring-amber-300", isActive);
            card.classList.toggle("bg-amber-50", isActive);
        }

        const badge = row.querySelector(".history-active-badge");
        if (badge) badge.classList.toggle("hidden", !isActive);
    });
}

function loadHistoryByIndex(index) {
    const rows = getHistoryRows();
    if (!rows.length || !output) return;

    const safeIndex = ((index % rows.length) + rows.length) % rows.length;
    const text = rows[safeIndex].dataset.content || "";
    if (!text) return;

    renderSentences(text);
    stopTTS();
    currentText = text;
    currentSentenceIndex = 0;
    currentHistoryIndex = safeIndex;
    updateActiveHistoryRow();
    highlightSentence(0);
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
    const selectedVoice = getSelectedVoice();
    utterance.lang = selectedVoice ? selectedVoice.lang : "en-US";
    utterance.rate = currentRate;
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
        highlightSentence(index);
    };

    utterance.onend = () => {
        // Ignore stale callbacks from canceled/replaced utterances.
        if (currentUtterance !== utterance) return;
        if (playbackState !== "playing") return;
        currentSentenceIndex = (index + 1) % sentences.length;
        speakSentence(currentSentenceIndex);
    };

    utterance.onerror = () => {
        // Ignore stale callbacks from canceled/replaced utterances.
        if (currentUtterance !== utterance) return;
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

if (voiceSelect) {
    voiceSelect.addEventListener("change", () => {
        selectedVoiceURI = voiceSelect.value || "";
        setStoredVoiceURI(selectedVoiceURI);

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

if (nextBtn) {
    nextBtn.addEventListener("click", () => {
        const rows = getHistoryRows();
        if (!rows.length) return;
        const nextIndex = currentHistoryIndex < 0 ? 0 : (currentHistoryIndex + 1) % rows.length;
        loadHistoryByIndex(nextIndex);
    });
}

if (randomBtn) {
    randomBtn.addEventListener("click", () => {
        const rows = getHistoryRows();
        if (!rows.length) return;

        if (rows.length === 1) {
            loadHistoryByIndex(0);
            return;
        }

        let rand = currentHistoryIndex;
        while (rand === currentHistoryIndex) {
            rand = Math.floor(Math.random() * rows.length);
        }
        loadHistoryByIndex(rand);
    });
}

if (typeof speechSynthesis !== "undefined") {
    refreshVoices();
    speechSynthesis.addEventListener("voiceschanged", refreshVoices);
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
            speakSentence(currentSentenceIndex);
            return;
        }

        playbackState = "playing";
        pauseMode = "none";
        setPlayButtonLabel(PAUSE_LABEL);
        speakSentence(currentSentenceIndex);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    if (output) {
        output.addEventListener("click", (e) => {
            const span = e.target.closest(".sent");
            if (!span) return;

            const idx = Number.parseInt(span.dataset.i || "", 10);
            if (Number.isNaN(idx)) return;

            const text = (output.textContent || "").trim();
            if (!text) return;

            // Ensure clean restart even when already speaking.
            try { speechSynthesis.cancel(); } catch {}

            // Re-sync source text/sentences to avoid stale state.
            currentText = text;
            renderSentences(text);

            playbackState = "playing";
            pauseMode = "none";
            setPlayButtonLabel(PAUSE_LABEL);
            speakSentence(idx);
        });
    }

    getHistoryRows().forEach((tr, idx) => {
        tr.addEventListener("click", (e) => {
            if (e.target.closest("form")) return;

            const text = tr.dataset.content || "";
            if (!output || !text) return;

            renderSentences(text);
            stopTTS();
            currentText = text;
            currentSentenceIndex = 0;
            currentHistoryIndex = idx;
            updateActiveHistoryRow();
            highlightSentence(0);
        });
    });
});

window.addEventListener("beforeunload", stopTTS);
window.addEventListener("pagehide", stopTTS);






















