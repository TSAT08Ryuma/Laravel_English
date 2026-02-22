const playBtn = document.getElementById("play");
const output = document.getElementById("output");
const progressBar = document.getElementById("progress_bar");
const progressText = document.getElementById("progress_text");

let currentUtterance = null;
let sentences = [];
const START_WORD = "uh. . . . . . .";
const offset = START_WORD.length;

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

function resetProgress() {
    if (!progressBar || !progressText) return;
    progressBar.value = 0;
    progressText.textContent = "0%";
}

function stopTTS() {
    try { speechSynthesis.cancel(); } catch {}
    currentUtterance = null;
    if (playBtn) playBtn.textContent = "▶ 再生";
    resetProgress();
}

if (playBtn && output) {
    playBtn.addEventListener("click", () => {
        const text = (output.textContent || "").trim();
        if (!text) return;

        renderSentences(text);

        if (speechSynthesis.speaking && !speechSynthesis.paused) {
            speechSynthesis.pause();
            playBtn.textContent = "▶ 再開";
            return;
        }

        if (speechSynthesis.paused) {
            speechSynthesis.resume();
            playBtn.textContent = "⏸ 一時停止";
            return;
        }

        const utterance = new SpeechSynthesisUtterance(START_WORD + text);
        utterance.lang = "en-US";
        utterance.rate = 1.0;

        utterance.onboundary = (event) => {
            if (!progressBar || !progressText) return;
            const idx = Math.max(0, event.charIndex - offset);
            const percent = Math.min(100, Math.floor((idx / text.length) * 100));
            progressBar.value = percent;
            progressText.textContent = `${percent}%`;
            highlight(idx);
        };

        utterance.onend = () => {
            playBtn.textContent = "▶ 再生";
            resetProgress();
            currentUtterance = null;
        };

        utterance.onerror = () => {
            playBtn.textContent = "▶ 再生";
            resetProgress();
            currentUtterance = null;
        };

        currentUtterance = utterance;
        speechSynthesis.cancel();
        resetProgress();
        setTimeout(() => speechSynthesis.speak(utterance), 0);
        playBtn.textContent = "⏸ 一時停止";
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
