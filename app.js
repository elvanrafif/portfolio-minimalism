/* Portfolio v2 — developer minimal. GSAP kept subtle. */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── theme toggle (independent of GSAP) ── */
const themeBtn = document.getElementById("themeBtn");
function syncThemeBtn() {
  themeBtn.textContent = `[${document.documentElement.dataset.theme}]`;
}
themeBtn.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
  syncThemeBtn();
});
syncThemeBtn();

/* ── scroll progress bar ── */
const progress = document.getElementById("progress");
addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
}, { passive: true });

/* ── scrollspy: highlight active nav link ── */
const navLinks = [...document.querySelectorAll(".nav nav a[href^='#']")];
const spy = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    navLinks.forEach((a) =>
      a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`)
    );
  });
}, { rootMargin: "-40% 0px -55% 0px" });
document.querySelectorAll(".section[id]").forEach((s) => spy.observe(s));

/* ── live Jakarta clock ── */
const clock = document.getElementById("clock");
function tickClock() {
  clock.textContent = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit",
  }).format(new Date()) + " WIB";
}
tickClock();
setInterval(tickClock, 30_000);

/* ── matrix decrypt on photo hover (dua arah) ── */
const asciiPre = document.querySelector(".photo__ascii");
if (asciiPre && !reduceMotion) {
  const orig = asciiPre.textContent;
  const rows = orig.split("\n");
  const GLYPHS = "ｱｶｻﾀﾅﾊﾏﾔﾗﾜｦﾝ0123456789#@*+=%&";
  const DURATION = 1000; // ms untuk sapuan penuh, arah manapun
  let progress = 0;      // 0 = ascii utuh, 1 = larut (foto terlihat)
  let target = 0;
  let rafId = null;
  let lastTs = null;

  function render() {
    if (progress === 0) {
      asciiPre.textContent = orig;
      return;
    }
    const out = rows.map((row, i) => {
      // tiap baris punya jendela waktu sendiri, menjalar ke bawah
      const local = (progress - (i / rows.length) * 0.6) / 0.4;
      if (local <= 0) return row;
      if (local >= 1) return " ".repeat(row.length); // larut → foto terlihat
      return row.replace(/\S/g, () =>
        Math.random() < local ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0]
      );
    });
    asciiPre.textContent = out.join("\n");
  }

  function tick(ts) {
    const dt = lastTs === null ? 16 : ts - lastTs;
    lastTs = ts;
    const step = dt / DURATION;
    progress = target > progress
      ? Math.min(progress + step, target)
      : Math.max(progress - step, target);
    render();
    if (progress !== target) {
      rafId = requestAnimationFrame(tick);
    } else {
      lastTs = null;
    }
  }

  function animateTo(t) {
    target = t;
    cancelAnimationFrame(rafId);
    lastTs = null;
    rafId = requestAnimationFrame(tick);
  }

  const frame = asciiPre.closest(".photo__frame");
  frame.addEventListener("mouseenter", () => {
    asciiPre.classList.add("is-decrypting"); // hijau hanya saat decrypt masuk
    animateTo(1);
  });
  frame.addEventListener("mouseleave", () => {
    asciiPre.classList.remove("is-decrypting");
    animateTo(0);
  });
}

/* ── copy email ── */
const copyBtn = document.getElementById("copyEmail");
copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(copyBtn.dataset.email);
    copyBtn.textContent = "[copied ✓]";
    copyBtn.classList.add("copied");
    setTimeout(() => {
      copyBtn.textContent = "[copy]";
      copyBtn.classList.remove("copied");
    }, 1500);
  } catch {
    copyBtn.textContent = "[ctrl+c :( ]";
  }
});

if (typeof gsap === "undefined") {
  throw new Error("GSAP not loaded — page works fine without animations");
}

gsap.registerPlugin(ScrollTrigger);
document.documentElement.classList.add("js");

/* mark elements to reveal */
const revealTargets = document.querySelectorAll(
  ".section h2, .section > p, .kv div, .project, .job, .footer"
);
revealTargets.forEach((el) => el.classList.add("reveal"));

if (reduceMotion) {
  // CSS shows everything; nothing to do
} else {
  /* ── hero: type the command, then print the output ── */
  const typed = document.getElementById("typed");
  const cmd = typed.textContent;
  typed.textContent = "";
  gsap.set(".hero__out > *", { opacity: 0, y: 10 });

  const intro = gsap.timeline({ delay: 0.3 });
  intro
    .to({ n: 0 }, {
      n: cmd.length,
      duration: cmd.length * 0.09,
      ease: "none",
      onUpdate() {
        typed.textContent = cmd.slice(0, Math.round(this.targets()[0].n));
      },
    })
    .to(".hero__out > *", {
      opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.08,
    }, "+=0.25");

  /* ── tagline: ketik-hapus bergantian ── */
  const PHRASES = [
    "half that matters",
    "products that go live",
    "UIs that don't break at 2am",
    "buttons that aren't 2px off",
  ];
  const tagEl = document.getElementById("tagphrase");
  let phraseIdx = 0;

  function typeLoop(text, mode) {
    // mode: "hold" → "del" → ganti frasa → "type" → "hold" …
    if (mode === "hold") {
      setTimeout(() => typeLoop(text, "del"), 2400);
    } else if (mode === "del") {
      if (text.length === 0) {
        phraseIdx = (phraseIdx + 1) % PHRASES.length;
        typeLoop("", "type");
        return;
      }
      tagEl.textContent = text = text.slice(0, -1);
      setTimeout(() => typeLoop(text, "del"), 30);
    } else {
      const target = PHRASES[phraseIdx];
      if (text.length === target.length) {
        typeLoop(text, "hold");
        return;
      }
      tagEl.textContent = text = target.slice(0, text.length + 1);
      setTimeout(() => typeLoop(text, "type"), 55);
    }
  }
  setTimeout(() => typeLoop(tagEl.textContent, "hold"), 2600); // mulai setelah intro hero

  /* ── scroll reveals: one quiet fade per element ── */
  revealTargets.forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.55, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 92%" },
    });
  });
}
