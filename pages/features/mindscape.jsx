import Head from 'next/head';
import Topbar from '../../components/Topbar';
import { useEffect, useState } from 'react';

export default function MindScape() {
  const [current, setCurrent] = useState(0);
  const [chosenAdvice, setChosenAdvice] = useState('');
  const [userWhy, setUserWhy] = useState('');
  const [adviceText, setAdviceText] = useState('');
  const [reflections, setReflections] = useState([]);

  const scenarios = [
    {
      text: "You feel anxious before a presentation. Your thoughts are racing.",
      responses: [
        { text: "Avoid presenting", advice: "Avoidance can feel safe short-term, but facing fears gradually helps anxiety shrink." },
        { text: "Pause and take slow breaths", advice: "Great coping skill. Breathing helps calm the nervous system." },
        { text: "Tell yourself you will fail", advice: "Try noticing this thought without believing it. Thoughts are not facts." }
      ]
    },
    {
      text: "After eating, you feel guilt and strong negative thoughts about your body.",
      responses: [
        { text: "Judge yourself harshly", advice: "Self-judgment can increase distress. Practicing self-kindness is healthier." },
        { text: "Notice the thought and let it pass", advice: "Excellent awareness. You are not your thoughts." },
        { text: "Reach out to someone you trust", advice: "Support reduces isolation and helps recovery." }
      ]
    },
    {
      text: "Someone sends a message that upsets you.",
      responses: [
        { text: "Respond angrily", advice: "Strong emotions are valid, but pausing can prevent regret." },
        { text: "Take time before replying", advice: "Pausing helps you respond calmly instead of reacting." },
        { text: "Communicate how you feel calmly", advice: "Healthy communication builds understanding." }
      ]
    },
    {
      text: "You feel overwhelmed by schoolwork and pressure.",
      responses: [
        { text: "Give up completely", advice: "Feeling overwhelmed is human. Small steps can make things manageable." },
        { text: "Break work into smaller tasks", advice: "Great strategy. Progress matters more than perfection." },
        { text: "Ask for help", advice: "Reaching out shows strength, not weakness." }
      ]
    }
  ];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = JSON.parse(localStorage.getItem('mindscapeReflections') || '[]');
    setReflections(stored.slice().reverse());
  }, []);

  function chooseResponse(advice) {
    setChosenAdvice(advice);
    // show the reflection area; advice not yet shown until submit
    setAdviceText('');
  }

  function giveAdvice() {
    if (!chosenAdvice) return;
    const reflection = {
      scenario: scenarios[current].text,
      advice: chosenAdvice,
      why: userWhy ? userWhy.trim() : '',
      time: new Date().toLocaleString(),
    };
    const existing = JSON.parse(localStorage.getItem('mindscapeReflections') || '[]');
    existing.push(reflection);
    localStorage.setItem('mindscapeReflections', JSON.stringify(existing));
    setReflections(existing.slice().reverse());
    setAdviceText('Thank you for reflecting. ' + chosenAdvice);
    setUserWhy('');
    // keep chosenAdvice so user can see which advice applied; they can move next when ready
  }

  function nextScenario() {
    setCurrent((current + 1) % scenarios.length);
    setChosenAdvice('');
    setUserWhy('');
    setAdviceText('');
  }

  return (
    <div className="site-root">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>MindScape — Semi‑Colonic</title>
      </Head>

      {/* Shared Topbar (includes mobile drawer and sign-in / sign-out UI) */}
      <Topbar links={[
        { href: '/posts', label: 'Posts' },
        { href: '/chat', label: 'Chat' },
        { href: '/features', label: 'Features' },
        { href: '/games', label: 'Games' },
        { href: '/resources', label: 'Resources' },
      ]} />

      <div className="site">
        <main className="main" role="main">
          <div className="card-wrap">
            <div className="card">
              <h2 className="title">MindScape</h2>
              <div className="lede">Reflect, choose, and notice how you respond.</div>

              <div className="scenario" aria-live="polite">{scenarios[current].text}</div>

              <div className="choices" role="list">
                {scenarios[current].responses.map((response, idx) => (
                  <button
                    key={idx}
                    className={`choice-btn ${chosenAdvice === response.advice ? 'selected' : ''}`}
                    onClick={() => chooseResponse(response.advice)}
                    role="listitem"
                  >
                    {response.text}
                  </button>
                ))}
              </div>

              {chosenAdvice ? (
                <div className="reflection">
                  <p className="reflection-prompt"><strong>Why did you choose that response?</strong></p>
                  <textarea
                    value={userWhy}
                    onChange={(e) => setUserWhy(e.target.value)}
                    placeholder="Type your thoughts here..."
                  />
                  <button className="submit" onClick={giveAdvice}>Submit</button>
                </div>
              ) : null}

              {adviceText ? <p className="advice">{adviceText}</p> : null}

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="next" onClick={nextScenario}>Next Situation</button>
              </div>

              <div className="past-reflections">
                <h3>Recent reflections</h3>
                {reflections.length === 0 ? (
                  <div className="no-reflect">No reflections yet — your submissions will appear here.</div>
                ) : (
                  reflections.map((r, i) => (
                    <div key={i} className="reflection-entry">
                      <div className="entry-time">{r.time}</div>
                      <div className="entry-scenario">{r.scenario}</div>
                      <div className="entry-advice"><strong>Advice:</strong> {r.advice}</div>
                      {r.why ? <div className="entry-why"><strong>Your reflection:</strong> {r.why}</div> : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>

        <footer className="site-footer">
          © {new Date().getFullYear()} Semi‑Colonic — Semi‑Colonic Ltd. All rights reserved. Use of this site constitutes acceptance of our Terms and Privacy Policy.
        </footer>
      </div>

      <style jsx>{`
        :root { --max-width: 980px; --text-primary: #183547; --muted: #7b8899; --card-bg: #fff; --accent: #6db784; --pill: #e8f5ee; }
        html, body {
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-family: 'Poppins', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: var(--text-primary);
        }

        .site-root { min-height: 100vh; background: var(--bg, #f6fbfa); }
        .site { max-width: var(--max-width); margin: 0 auto; padding: 0 18px; box-sizing: border-box; }

        .main { padding: 20px 18px; display: flex; justify-content: center; }
        .card-wrap { width: 100%; display:flex; justify-content:center; }
        .card { width: 100%; max-width: 520px; background: var(--card-bg); padding: 22px; border-radius: 16px; box-shadow: 0 10px 30px rgba(40,80,100,0.06); box-sizing: border-box; }

        .title { margin: 0 0 6px 0; text-align: center; color: #345e63; font-weight: 700; font-size: 20px; }
        .lede { text-align: center; font-size: 13px; color: #6c8f86; margin-bottom: 14px; }

        .scenario { background: var(--pill); padding: 14px; border-radius: 12px; margin-bottom: 12px; color: #244646; font-size: 15px; }

        .choices { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
        .choice-btn {
          width: 100%;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(6,20,40,0.06);
          background: #fff;
          text-align: left;
          cursor: pointer;
          font-weight: 600;
          color: #183547;
        }
        .choice-btn.selected { box-shadow: 0 6px 18px rgba(31,159,255,0.06); border-color: rgba(31,159,255,0.12); background: linear-gradient(135deg,#f0fbff,#ffffff); }

        .reflection { margin-top: 12px; }
        .reflection-prompt { margin: 0 0 6px 0; color: #2e5454; }
        textarea {
          width: 100%;
          height: 80px;
          border-radius: 10px;
          border: 1px solid #d6ebe6;
          padding: 10px;
          resize: vertical;
          font-size: 14px;
          background: #fbfffe;
          color: #214d4d;
          box-sizing: border-box;
        }
        .submit {
          margin-top: 10px;
          padding: 10px;
          width: 100%;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg,#6db784,#5aa36f);
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }

        .advice { margin-top: 10px; color: #2f6f5f; font-weight: 600; }

        .next {
          margin-top: 12px;
          padding: 10px;
          border-radius: 12px;
          border: none;
          background: #e9f6f1;
          color: #2d6b64;
          cursor: pointer;
          font-weight: 700;
        }

        .past-reflections { margin-top: 18px; }
        .past-reflections h3 { margin: 0 0 8px 0; font-size: 14px; color: #2d6b64; }
        .no-reflect { color: var(--muted); font-size: 13px; }

        .reflection-entry { background: #fbfffe; border-left: 4px solid var(--accent); padding: 10px; border-radius: 10px; margin-bottom: 8px; }
        .entry-time { font-size: 11px; color: #6a8f8d; font-weight: 700; }
        .entry-scenario { margin-top: 6px; font-size: 13px; color: #214d4d; }
        .entry-advice, .entry-why { margin-top: 6px; font-size: 13px; color: #2f6f5f; }

        .site-footer { margin-top: 18px; padding: 12px 0; font-size: 13px; color: var(--muted); text-align: center; }

        @media (max-width: 820px) {
          .card { max-width: 460px; padding: 18px; }
        }
        @media (max-width: 420px) {
          .card { max-width: 360px; padding: 14px; }
          .main { padding: 14px 12px; }
        }
      `}</style>
    </div>
  );
}