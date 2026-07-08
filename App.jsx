import React, { useState, useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// THE RESCUE PATTERN — interactive assessment (free funnel)
// Auto-scores 25 statements across 5 dimensions, then delivers a personalized
// read (AI-generated with graceful written fallback) and a CTA to the paid
// workbook. Companion to the "The Rescue Pattern" workbook PDF.
// ---------------------------------------------------------------------------

const NAVY = "#1E3350";
const NAVY_SOFT = "#3A5375";
const CLAY = "#B5523A";
const PAPER = "#F5F4F0";
const CARD = "#FBFAF7";
const INK = "#26303A";
const SLATE = "#8A93A0";
const COOL = "#E8EEF4";
const WARM = "#F3EAE6";
const LINE = "#DDD8CE";

const SCALE = [
  { v: 0, label: "Never" },
  { v: 1, label: "Rarely" },
  { v: 2, label: "Sometimes" },
  { v: 3, label: "Often" },
  { v: 4, label: "Always" },
];

const DIMENSIONS = [
  {
    key: "selection",
    name: "Selection",
    type: "The Recruiter",
    short: "You pick by the wound. Drawn to the project, not the person.",
    questions: [
      "I'm drawn to people who are struggling, unstable, or clearly need help.",
      "I've seen \u201Cpotential\u201D in a partner that other people didn't see.",
      "Settled, low-drama, available people feel boring to me \u2014 no spark.",
      "I've stayed with someone mainly because I believed I could help them change.",
      "Looking back, my partners share a recurring struggle (addiction, chaos, instability, unavailability).",
    ],
    read: "You don't fall for people so much as recruit them. The wound is the draw \u2014 the story of who they could become if someone just believed hard enough. The trouble is you end up in a relationship with their potential instead of the actual human in front of you, and potential never has to show up for dinner.",
  },
  {
    key: "overfunction",
    name: "Over-Functioning",
    type: "The Carrier",
    short: "You carry what's theirs. You do the reps their life is asking them to do.",
    questions: [
      "I handle things in relationships that the other person could handle themselves.",
      "I feel responsible for other people's moods, problems, and wellbeing.",
      "I jump in to fix before anyone actually asks me to.",
      "I find it hard to watch someone struggle without stepping in.",
      "People lean on me far more than I lean on anyone.",
    ],
    read: "You're the one who carries it \u2014 the logistics, the moods, the load nobody else picks up. Competent and exhausted in equal measure. But every rep you do for someone is a rep they don't do for themselves, and people rarely grow stronger by being carried. Your help can quietly keep them small.",
  },
  {
    key: "erasure",
    name: "Self-Erasure",
    type: "The Vanisher",
    short: "Your needs go quiet whenever someone else's get loud.",
    questions: [
      "When someone needs me, my own plans and needs go to the back of the line.",
      "I have trouble naming what I actually want in a relationship.",
      "I downplay my problems because someone else's always seem bigger.",
      "I feel guilty or selfish when I focus on myself.",
      "People close to me would be surprised by what I'm struggling with \u2014 I keep it hidden.",
    ],
    read: "You're so tuned to everyone else's signal that your own goes silent. Ask what you want and there's a pause \u2014 not because you don't know, but because you stopped asking a long time ago. The danger here is invisibility: you can disappear so well that even the people who love you don't know what you're carrying.",
  },
  {
    key: "ledger",
    name: "The Ledger",
    type: "The Accountant",
    short: "Giving curdles into a silent tab and quiet resentment.",
    questions: [
      "I keep a silent mental tally of everything I've done for people.",
      "I feel resentment that no one gives back the way I give.",
      "I've thought \u201Cafter everything I've done\u201D about a partner.",
      "I give freely \u2014 then feel let down when it isn't noticed or matched.",
      "My resentment builds quietly until it finally spills over.",
    ],
    read: "You love by giving \u2014 then keep a silent invoice. The tab runs in the background until it spills over as resentment, and the other person never even knew they'd signed for a debt. The hard truth: you can't bill someone for a contract they never agreed to. The ledger is yours to close, not theirs to pay.",
  },
  {
    key: "fusion",
    name: "Identity Fusion",
    type: "The Indispensable",
    short: "Being needed is how you know you're worth something.",
    questions: [
      "Being needed is a big part of how I know I matter.",
      "I feel anxious or lost when nobody needs anything from me.",
      "I'd much rather be the strong one than the one who needs help.",
      "If I stopped helping people, I'm not sure what I'd be to them.",
      "My worth feels tied to what I do for others, not who I am.",
    ],
    read: "Being needed isn't just something you do \u2014 it's how you know you exist. Take away the helping and the floor gets shaky, because your worth got welded to your usefulness somewhere back there. The work here is the deepest of the five: learning you're worth something to people even when you're not doing anything for them.",
  },
];

const ALL_Q = DIMENSIONS.flatMap((d) =>
  d.questions.map((text) => ({ text, dim: d.key }))
);

function band(score) {
  if (score <= 7) return { label: "Low", level: 0 };
  if (score <= 13) return { label: "Moderate", level: 1 };
  return { label: "Dominant", level: 2 };
}
function bandColor(level) {
  return level === 2 ? CLAY : level === 1 ? NAVY : SLATE;
}

// Drama Triangle signature mark
function Triangle({ size = 88, stroke = NAVY, accent = CLAY, labels = false }) {
  // padding so the corner labels ("PERSECUTOR" / "VICTIM") fit inside the box
  const lp = labels ? 38 : 0;   // left/right room
  const tp = labels ? 13 : 0;   // top room (RESCUER sits above)
  const bp = labels ? 16 : 0;   // bottom room (corner labels sit below)
  const w = size, h = size * 0.92, p = 12;
  const A = [lp + w / 2, tp + p];
  const B = [lp + p, tp + h - p];
  const C = [lp + w - p, tp + h - p];
  const W = w + lp * 2;
  const H = h + tp + bp;
  const line = (a, b, k) => (
    <line key={k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={stroke} strokeWidth="1.25" />
  );
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      {line(A, B, 1)}{line(B, C, 2)}{line(C, A, 3)}
      <circle cx={A[0]} cy={A[1]} r="3.2" fill={accent} />
      <circle cx={B[0]} cy={B[1]} r="3.2" fill={stroke} />
      <circle cx={C[0]} cy={C[1]} r="3.2" fill={stroke} />
      {labels && (
        <g fontFamily="Inter, sans-serif" fontSize="7.5" fill={SLATE} textAnchor="middle">
          <text x={A[0]} y={A[1] - 5}>RESCUER</text>
          <text x={B[0]} y={B[1] + 12}>PERSECUTOR</text>
          <text x={C[0]} y={C[1] + 12}>VICTIM</text>
        </g>
      )}
    </svg>
  );
}

export default function App() {
  const [stage, setStage] = useState("intro"); // intro | quiz | results
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState(Array(ALL_Q.length).fill(null));
  const [aiText, setAiText] = useState("");
  const [aiState, setAiState] = useState("idle"); // idle | loading | done | fallback
  const [gender, setGender] = useState("man");
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("idle"); // idle | sending | done | error
  const liveRef = useRef(null);

  // inject fonts + styles once
  useEffect(() => {
    if (document.getElementById("rp-fonts")) return;
    const l = document.createElement("link");
    l.id = "rp-fonts";
    l.rel = "stylesheet";
    l.href =
      "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(l);
    const s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
  }, []);

  const scores = DIMENSIONS.map((d) => {
    const sum = d.questions.reduce((acc, _, qi) => {
      const idx = DIMENSIONS.slice(0, DIMENSIONS.indexOf(d)).reduce((a, dd) => a + dd.questions.length, 0) + qi;
      return acc + (answers[idx] ?? 0);
    }, 0);
    return { ...d, score: sum, ...band(sum) };
  });
  const ranked = [...scores].sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, 2);
  const blended = top[1] && top[0].score - top[1].score <= 3;

  function choose(v) {
    const next = [...answers];
    next[i] = v;
    setAnswers(next);
    setTimeout(() => {
      if (i < ALL_Q.length - 1) setI(i + 1);
      else finish(next);
    }, 180);
  }

  function finish(finalAnswers) {
    setStage("results");
    window.scrollTo?.(0, 0);
    generateRead(finalAnswers);
  }

  async function generateRead(finalAnswers) {
    // A written read is always ready, so the screen never sits empty.
    const fb = composeFallback();
    setAiState("loading");

    // Structured scores — sent to our own backend (which holds the API key).
    const scoreObjs = DIMENSIONS.map((d) => {
      const start = DIMENSIONS.slice(0, DIMENSIONS.indexOf(d)).reduce((a, dd) => a + dd.questions.length, 0);
      const s = d.questions.reduce((a, _, qi) => a + (finalAnswers[start + qi] ?? 0), 0);
      return { name: d.name, score: s };
    });
    const dominant = top.map((t) => t.name);

    // 1) Production path: our serverless function at /api/read (no key in browser).
    try {
      const r = await fetch("/api/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: scoreObjs, dominant }),
      });
      if (r.ok) {
        const data = await r.json();
        if (data && data.text) { typewriter(data.text, "done"); return; }
      }
    } catch (e) { /* fall through */ }

    // 2) Preview path: direct call works inside the Claude artifact for testing.
    try {
      const sc = scoreObjs.map((s) => `${s.name}: ${s.score}/20`).join(", ");
      const prompt = `A person just finished a self-assessment about the "rescue pattern" — the tendency to organize identity around saving, fixing, and over-giving in relationships. Their dimension scores (0-20 each): ${sc}. Their dominant blend: ${dominant.join(" + ")}.

Write a brief, warm, direct read of THIS specific person's pattern. Requirements:
- Second person ("you"), 150-180 words.
- Voice: a wise, no-bullshit older sibling. Honest, never clinical, never diagnostic. No disorder language.
- Speak to what their specific dominant blend does in real relationships, and give one honest reframe that points forward.
- Do NOT restate the scores. Do NOT use lists, headers, or bullet points. Just plain paragraphs.
- Don't be saccharine. Earn the hope.`;
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      const text = (data.content || []).map((c) => (c.type === "text" ? c.text : "")).join("").trim();
      if (text) { typewriter(text, "done"); return; }
    } catch (e) { /* fall through */ }

    // 3) Always-on written read.
    typewriter(fb, "fallback");
  }

  function composeFallback() {
    const a = top[0];
    const b = top[1];
    let out = a.read;
    if (blended && b) {
      out += " " + b.read.split(". ").slice(0, 1).join(". ") + ". The two run together in you, and that combination is the engine to watch.";
    }
    out += " None of this makes you broken. It made sense once \u2014 it kept you safe. The point now is to run it on purpose instead of on autopilot.";
    return out;
  }

  function typewriter(full, endState) {
    setAiText("");
    let n = 0;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setAiText(full); setAiState(endState); return; }
    const step = Math.max(2, Math.round(full.length / 260));
    const id = setInterval(() => {
      n += step;
      setAiText(full.slice(0, n));
      if (n >= full.length) { clearInterval(id); setAiText(full); setAiState(endState); }
    }, 16);
  }

  async function subscribe() {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!valid) { setEmailStatus("error"); return; }
    setEmailStatus("sending");
    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), type: (top[0] && top[0].type) || "" }),
      });
      setEmailStatus(r.ok ? "done" : "error");
    } catch (e) {
      setEmailStatus("error");
    }
  }

  function restart() {
    setAnswers(Array(ALL_Q.length).fill(null));
    setI(0); setAiText(""); setAiState("idle"); setStage("intro");
    setEmail(""); setEmailStatus("idle");
    window.scrollTo?.(0, 0);
  }

  // ---------------- RENDER ----------------
  return (
    <div className="rp-root">
      <div className="rp-wrap">
        {stage === "intro" && (
          <section className="rp-intro rp-fade">
            <div className="rp-mark"><Triangle size={104} labels /></div>
            <p className="rp-eyebrow">A self-assessment</p>
            <h1 className="rp-title">The Rescue Pattern</h1>
            <p className="rp-lede">
              Some people fall in love. Some people recruit projects. This is a short, honest
              look at how hard the urge to save, fix, and carry runs in you — and which part
              of the pattern is driving.
            </p>
            <ul className="rp-meta">
              <li>25 statements</li><li className="rp-dot">·</li>
              <li>about 4 minutes</li><li className="rp-dot">·</li>
              <li>scored instantly</li>
            </ul>
            <button className="rp-btn" onClick={() => setStage("quiz")}>Begin</button>
            <p className="rp-disclaim">
              A self-reflection tool, not therapy or diagnosis. If what surfaces feels heavy,
              bring it to a licensed professional.
            </p>
          </section>
        )}

        {stage === "quiz" && (
          <section className="rp-quiz">
            <div className="rp-progress-row">
              <div className="rp-progress-track">
                <div className="rp-progress-fill" style={{ width: `${(i / ALL_Q.length) * 100}%` }} />
              </div>
              <span className="rp-progress-num">{i + 1} / {ALL_Q.length}</span>
            </div>

            <div key={i} className="rp-qcard rp-rise">
              <span className="rp-qkicker">How true is this for you?</span>
              <p className="rp-statement">{ALL_Q[i].text}</p>
              <div className="rp-scale" role="group" aria-label="Choose a rating">
                {SCALE.map((s) => (
                  <button
                    key={s.v}
                    className={"rp-opt" + (answers[i] === s.v ? " rp-opt-on" : "")}
                    onClick={() => choose(s.v)}
                  >
                    <span className="rp-opt-dot" aria-hidden="true" />
                    <span className="rp-opt-label">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rp-navrow">
              <button className="rp-back" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>
                ← Back
              </button>
              <span className="rp-note">Go with your track record, not your intentions.</span>
            </div>
          </section>
        )}

        {stage === "results" && (
          <section className="rp-results rp-fade">
            <div className="rp-rhead">
              <Triangle size={66} />
              <p className="rp-eyebrow">Your result</p>
              <h2 className="rp-rtitle">
                {blended ? <>You're a blend: <em>{top[0].type}</em> &amp; <em>{top[1].type}</em></>
                         : <>You lead as <em>{top[0].type}</em></>}
              </h2>
              <p className="rp-rsub">{blended ? `${top[0].short} ${top[1].short}` : top[0].short}</p>
            </div>

            <div className="rp-bars">
              {scores.map((d) => (
                <div className="rp-bar-row" key={d.key}>
                  <div className="rp-bar-head">
                    <span className="rp-bar-name">{d.name}</span>
                    <span className="rp-bar-band" style={{ color: bandColor(d.level) }}>
                      {d.label} · {d.score}/20
                    </span>
                  </div>
                  <div className="rp-bar-track">
                    <div className="rp-bar-fill" style={{ width: `${(d.score / 20) * 100}%`, background: bandColor(d.level) }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="rp-read">
              <h3 className="rp-read-h">What this blend does</h3>
              <p className="rp-read-body" aria-live="polite" ref={liveRef}>
                {aiText}
                {aiState === "loading" && <span className="rp-caret" />}
              </p>
              {aiState === "fallback" && <p className="rp-read-tag">Offline read · a live version can personalize this further.</p>}
            </div>

            {emailStatus !== "done" ? (
              <div className="rp-email">
                <h3 className="rp-email-h">Want your result and the first tool, free?</h3>
                <p className="rp-email-sub">Drop your email and I'll send your profile plus the Help-vs-Rescue filter to keep.</p>
                <div className="rp-email-row">
                  {/* honeypot for bots; humans never see it */}
                  <input type="text" name="company" tabIndex={-1} autoComplete="off" className="rp-honey" aria-hidden="true" />
                  <input
                    type="email"
                    className="rp-email-input"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailStatus === "error") setEmailStatus("idle"); }}
                    onKeyDown={(e) => { if (e.key === "Enter") subscribe(); }}
                    aria-label="Email address"
                  />
                  <button className="rp-email-btn" onClick={subscribe} disabled={emailStatus === "sending"}>
                    {emailStatus === "sending" ? "Sending…" : "Send it"}
                  </button>
                </div>
                {emailStatus === "error" && <p className="rp-email-err">That email didn't look right — give it another go.</p>}
                <p className="rp-email-fine">No spam. Unsubscribe anytime.</p>
              </div>
            ) : (
              <div className="rp-email rp-email-done">
                <p className="rp-email-h" style={{ margin: 0 }}>On its way. Check your inbox.</p>
              </div>
            )}

            <div className="rp-costume">
              <div className="rp-costume-head">
                <h3 className="rp-read-h" style={{ margin: 0 }}>Same engine, different costume</h3>
                <div className="rp-toggle">
                  <button className={"rp-tg" + (gender === "man" ? " rp-tg-on" : "")} onClick={() => setGender("man")}>For men</button>
                  <button className={"rp-tg" + (gender === "woman" ? " rp-tg-on" : "")} onClick={() => setGender("woman")}>For women</button>
                </div>
              </div>
              <div className="rp-costume-card" style={{ background: gender === "man" ? COOL : WARM }}>
                {gender === "man" ? (
                  <p>You tend to rescue through <strong>provision, protection, and fixing</strong> — the strong one, the problem-solver, the white knight. The selection runs toward the wounded partner as a project. The cover story is <em>"I'm just being a man."</em></p>
                ) : (
                  <p>You tend to rescue through <strong>emotional labor, caretaking, and absorbing</strong> — "I'll love him into changing." The selection runs toward the man with potential: the addict, the avoidant, the one you'll heal. The cover story is <em>"I'm just being a good partner"</em> — which is why it's the hardest to see. It gets praised as virtue.</p>
                )}
              </div>
            </div>

            <div className="rp-cta">
              <h3 className="rp-cta-h">Your result is the map. The workbook is how you redraw it.</h3>
              <p className="rp-cta-body">
                The full workbook breaks down the engine underneath this pattern and gives you the
                five tools to interrupt it — the Help-vs-Rescue filter, the triangle map, the urge
                practice, the ledger audit, and the partner screen you run <em>before</em> you're in deep.
              </p>
              {/* Replace href with your Gumroad / Stan / Payhip checkout link */}
              <a className="rp-btn rp-btn-cta" href="#" onClick={(e) => e.preventDefault()}>
                Get the workbook →
              </a>
              <button className="rp-restart" onClick={restart}>Retake the assessment</button>
            </div>

            <p className="rp-disclaim rp-disclaim-end">
              A self-reflection tool, not therapy or diagnosis. If what surfaced here feels heavy —
              trauma, addiction in the picture, a relationship that isn't safe — please bring it to a
              licensed professional.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

const CSS = `
.rp-root{min-height:100vh;background:${PAPER};color:${INK};
  font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased;
  display:flex;justify-content:center;padding:32px 18px 64px;}
.rp-wrap{width:100%;max-width:680px;}
.rp-eyebrow{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:${CLAY};
  font-weight:600;margin:0 0 10px;}
.rp-btn{appearance:none;border:none;cursor:pointer;background:${NAVY};color:#fff;
  font-family:Inter,sans-serif;font-size:16px;font-weight:600;padding:15px 30px;border-radius:2px;
  letter-spacing:.01em;transition:transform .15s ease,background .15s ease;}
.rp-btn:hover{background:#16273d;transform:translateY(-1px);}
.rp-btn:focus-visible{outline:2px solid ${CLAY};outline-offset:3px;}

/* INTRO */
.rp-intro{padding-top:18px;text-align:center;}
.rp-mark{display:flex;justify-content:center;margin-bottom:22px;}
.rp-title{font-family:Newsreader,Georgia,serif;font-weight:500;color:${NAVY};
  font-size:54px;line-height:1.02;letter-spacing:-.015em;margin:0 0 20px;}
.rp-lede{font-family:Newsreader,Georgia,serif;font-size:20px;line-height:1.55;color:${INK};
  max-width:540px;margin:0 auto 26px;}
.rp-meta{list-style:none;display:flex;gap:10px;justify-content:center;align-items:center;
  padding:0;margin:0 0 30px;color:${SLATE};font-size:14px;font-weight:500;}
.rp-dot{color:${LINE};}
.rp-disclaim{font-size:12.5px;line-height:1.5;color:${SLATE};max-width:430px;margin:24px auto 0;}

/* QUIZ */
.rp-quiz{padding-top:10px;}
.rp-progress-row{display:flex;align-items:center;gap:14px;margin-bottom:38px;}
.rp-progress-track{flex:1;height:3px;background:${LINE};border-radius:3px;overflow:hidden;}
.rp-progress-fill{height:100%;background:${CLAY};transition:width .35s cubic-bezier(.4,0,.2,1);}
.rp-progress-num{font-size:13px;font-weight:600;color:${SLATE};font-variant-numeric:tabular-nums;}
.rp-qcard{background:${CARD};border:1px solid ${LINE};border-radius:4px;padding:34px 30px 30px;
  box-shadow:0 1px 2px rgba(30,51,80,.04);}
.rp-qkicker{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${SLATE};font-weight:600;}
.rp-statement{font-family:Newsreader,Georgia,serif;font-size:25px;line-height:1.4;color:${NAVY};
  margin:14px 0 30px;font-weight:500;}
.rp-scale{display:flex;flex-direction:column;gap:9px;}
.rp-opt{display:flex;align-items:center;gap:13px;width:100%;text-align:left;cursor:pointer;
  background:#fff;border:1px solid ${LINE};border-radius:3px;padding:13px 16px;
  font-family:Inter,sans-serif;font-size:15.5px;font-weight:500;color:${INK};
  transition:border-color .14s ease,background .14s ease,transform .1s ease;}
.rp-opt:hover{border-color:${NAVY_SOFT};transform:translateX(2px);}
.rp-opt:focus-visible{outline:2px solid ${CLAY};outline-offset:2px;}
.rp-opt-dot{width:15px;height:15px;border-radius:50%;border:1.5px solid ${LINE};flex:0 0 auto;
  transition:border-color .14s,background .14s;}
.rp-opt-on{border-color:${NAVY};background:${COOL};}
.rp-opt-on .rp-opt-dot{border-color:${CLAY};background:${CLAY};box-shadow:inset 0 0 0 3px ${COOL};}
.rp-navrow{display:flex;align-items:center;justify-content:space-between;margin-top:22px;gap:12px;}
.rp-back{background:none;border:none;color:${NAVY};font-family:Inter,sans-serif;font-size:14px;
  font-weight:600;cursor:pointer;padding:6px 0;}
.rp-back:disabled{color:${LINE};cursor:default;}
.rp-back:focus-visible{outline:2px solid ${CLAY};outline-offset:2px;}
.rp-note{font-size:12.5px;color:${SLATE};text-align:right;}

/* RESULTS */
.rp-rhead{text-align:center;padding-top:6px;margin-bottom:30px;}
.rp-rhead svg{margin:0 auto 14px;display:block;}
.rp-rtitle{font-family:Newsreader,Georgia,serif;font-weight:500;color:${NAVY};font-size:34px;
  line-height:1.15;margin:0 0 12px;letter-spacing:-.01em;}
.rp-rtitle em{font-style:italic;color:${CLAY};}
.rp-rsub{font-size:15.5px;line-height:1.55;color:${NAVY_SOFT};max-width:520px;margin:0 auto;}
.rp-bars{background:${CARD};border:1px solid ${LINE};border-radius:4px;padding:24px 24px 8px;margin-bottom:26px;}
.rp-bar-row{margin-bottom:16px;}
.rp-bar-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px;}
.rp-bar-name{font-family:Newsreader,Georgia,serif;font-size:17px;font-weight:600;color:${NAVY};}
.rp-bar-band{font-size:12.5px;font-weight:600;font-variant-numeric:tabular-nums;}
.rp-bar-track{height:8px;background:${PAPER};border-radius:6px;overflow:hidden;}
.rp-bar-fill{height:100%;border-radius:6px;width:0;animation:rpgrow .9s cubic-bezier(.34,1,.4,1) forwards;}
@keyframes rpgrow{from{transform:scaleX(0);transform-origin:left;}to{transform:scaleX(1);transform-origin:left;}}
.rp-read{background:${NAVY};color:#F3F1EC;border-radius:4px;padding:28px 28px 26px;margin-bottom:26px;}
.rp-read-h{font-family:Newsreader,Georgia,serif;font-size:14px;letter-spacing:.04em;font-weight:600;
  text-transform:uppercase;color:#C9B7A6;margin:0 0 14px;}
.rp-read-body{font-family:Newsreader,Georgia,serif;font-size:19px;line-height:1.6;margin:0;min-height:120px;font-weight:400;}
.rp-caret{display:inline-block;width:8px;height:20px;background:${CLAY};margin-left:2px;
  vertical-align:-3px;animation:rpblink 1s steps(2) infinite;}
@keyframes rpblink{50%{opacity:0;}}
.rp-read-tag{font-family:Inter,sans-serif;font-size:11.5px;color:#9FB0C2;margin:14px 0 0;font-style:italic;}
.rp-costume{margin-bottom:30px;}
.rp-costume-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap;}
.rp-costume-head .rp-read-h{color:${NAVY};text-transform:none;font-size:18px;}
.rp-toggle{display:flex;gap:4px;background:${PAPER};border:1px solid ${LINE};border-radius:3px;padding:3px;}
.rp-tg{appearance:none;border:none;background:none;cursor:pointer;font-family:Inter,sans-serif;
  font-size:13px;font-weight:600;color:${SLATE};padding:6px 13px;border-radius:2px;transition:.14s;}
.rp-tg-on{background:#fff;color:${NAVY};box-shadow:0 1px 2px rgba(30,51,80,.08);}
.rp-tg:focus-visible{outline:2px solid ${CLAY};outline-offset:1px;}
.rp-costume-card{border-radius:4px;padding:20px 22px;font-family:Newsreader,Georgia,serif;
  font-size:17px;line-height:1.55;color:${INK};}
.rp-costume-card strong{font-weight:600;color:${NAVY};}
.rp-cta{background:${CARD};border:1px solid ${LINE};border-top:3px solid ${CLAY};
  border-radius:4px;padding:30px 28px;text-align:center;}
.rp-cta-h{font-family:Newsreader,Georgia,serif;font-weight:500;color:${NAVY};font-size:24px;
  line-height:1.3;margin:0 0 14px;}
.rp-cta-body{font-size:15px;line-height:1.6;color:${INK};max-width:500px;margin:0 auto 22px;}
.rp-btn-cta{font-size:17px;padding:16px 34px;}
.rp-restart{display:block;margin:18px auto 0;background:none;border:none;cursor:pointer;
  font-family:Inter,sans-serif;font-size:13.5px;font-weight:600;color:${SLATE};text-decoration:underline;
  text-underline-offset:3px;}
.rp-restart:focus-visible{outline:2px solid ${CLAY};outline-offset:2px;}
.rp-disclaim-end{text-align:center;}

/* email capture */
.rp-email{background:${CARD};border:1px solid ${LINE};border-radius:4px;padding:24px 24px 20px;margin-bottom:26px;text-align:center;}
.rp-email-h{font-family:Newsreader,Georgia,serif;font-weight:500;color:${NAVY};font-size:21px;margin:0 0 6px;}
.rp-email-sub{font-size:14px;color:${INK};margin:0 0 16px;line-height:1.5;}
.rp-email-row{display:flex;gap:8px;max-width:440px;margin:0 auto;}
.rp-honey{position:absolute;left:-9999px;width:1px;height:1px;opacity:0;}
.rp-email-input{flex:1;min-width:0;border:1px solid ${LINE};border-radius:3px;padding:12px 14px;
  font-family:Inter,sans-serif;font-size:15px;color:${INK};background:#fff;}
.rp-email-input:focus{outline:2px solid ${CLAY};outline-offset:1px;border-color:${NAVY};}
.rp-email-btn{appearance:none;border:none;cursor:pointer;background:${CLAY};color:#fff;
  font-family:Inter,sans-serif;font-size:15px;font-weight:600;padding:12px 20px;border-radius:3px;
  white-space:nowrap;transition:background .14s,transform .1s;}
.rp-email-btn:hover:not(:disabled){background:#9d4530;transform:translateY(-1px);}
.rp-email-btn:disabled{opacity:.6;cursor:default;}
.rp-email-btn:focus-visible{outline:2px solid ${NAVY};outline-offset:2px;}
.rp-email-err{color:${CLAY};font-size:13px;margin:10px 0 0;font-weight:500;}
.rp-email-fine{color:${SLATE};font-size:12px;margin:12px 0 0;}
.rp-email-done{background:${COOL};border-color:#CBD9E6;}
@media (max-width:480px){.rp-email-row{flex-direction:column;}}

/* motion */
.rp-fade{animation:rpfade .5s ease;}
.rp-rise{animation:rprise .32s cubic-bezier(.34,1,.4,1);}
@keyframes rpfade{from{opacity:0;}to{opacity:1;}}
@keyframes rprise{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
@media (prefers-reduced-motion:reduce){
  .rp-fade,.rp-rise,.rp-bar-fill{animation:none!important;}
  .rp-bar-fill{transform:none!important;}
}
@media (max-width:520px){
  .rp-title{font-size:42px;}
  .rp-lede{font-size:18px;}
  .rp-statement{font-size:22px;}
  .rp-rtitle{font-size:28px;}
  .rp-read-body{font-size:18px;}
}
`;
