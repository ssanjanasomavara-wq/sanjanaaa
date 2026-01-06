import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import QuoteBanner from '../components/QuoteBanner';
import Heart from '../components/icons/Heart';
import Leaf from '../components/icons/Leaf';
import Topbar from '../components/Topbar';

const BOOKS = [
  { title: 'Prozac Nation', author: 'Elizabeth Wurtzel', category: 'Memoir' },
  { title: 'Girl, Interrupted', author: 'Susanna Kaysen', category: 'Memoir' },
  { title: 'An Unquiet Mind', author: 'Kay Redfield Jamison', category: 'Memoir' },
  { title: 'Reasons to Stay Alive', author: 'Matt Haig', category: 'Memoir' },
  { title: 'I Want to Die but I Want to Eat Tteokbokki', author: 'Baek Sehee', category: 'Memoir' },

  { title: 'Good Girls: A Story and Study of Anorexia', author: 'Hadley Freeman', category: 'Memoir / Eating disorders' },
  { title: 'My Schizophrenic Life', author: 'Sandra Yuen MacKay', category: 'Memoir / Psychosis' },
  { title: 'Louise: Amended', author: 'Louise Krug', category: 'Memoir / Recovery' },
  { title: 'Asylum (An Alcoholic Takes the Cure)', author: 'William Seabrook', category: 'Historic memoir' },

  { title: 'The Bell Jar', author: 'Sylvia Plath', category: 'Fictionalized memoir' },
  { title: 'Darkness Visible: A Memoir of Madness', author: 'William Styron', category: 'Memoir' },

  { title: 'Sure I’ll Join Your Cult', author: 'Maria Bamford', category: 'Humor / Memoir' },
  { title: 'Furiously Happy', author: 'Jenny Lawson', category: 'Humor / Memoir' },

  { title: 'The Body Keeps the Score', author: 'Bessel van der Kolk, M.D.', category: 'Non-fiction / Trauma' },
  { title: "It's OK That You're Not OK", author: 'Megan Devine', category: 'Non-fiction / Grief' },

  { title: 'Cicada', author: '', category: 'Picture book' },
  { title: 'The Rabbit Listened', author: 'Cori Doerrfeld', category: 'Picture book — gentle healing journey' },
  { title: 'The Color Monster', author: 'Anna Llenas', category: 'Picture book — emotions' },
  { title: 'The Invisible String', author: 'Patrice Karst', category: 'Picture book — connection & comfort' },
  { title: 'What Do You Do With a Problem?', author: 'Kobi Yamada', category: 'Picture book — problem solving & anxiety' },
  { title: 'My Many Colored Days', author: 'Dr. Seuss (illustrated by Steve Johnson & Lou Fancher)', category: 'Picture book — emotions' },
];

function amazonSearchLink(title, author) {
  const q = encodeURIComponent((title + (author ? ' ' + author : '')).trim());
  return `https://www.amazon.in/s?k=${q}&i=stripbooks`;
}

export default function Resources() {
  const router = useRouter();

  return (
    <div className="site-root">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Resources — Books on Mental Health & Comfort Reading</title>
      </Head>

      {/* Topbar provides consistent header, signed-in user display and mobile drawer */}
      <Topbar />

      <div className="site">
        <main style={{ maxWidth: 980, margin: '0 auto', padding: 18 }}>
          <header className="page-header" style={{ marginBottom: 12 }}>
            <button onClick={() => router.back()} className="btn btn-outline" aria-label="Go back">
              ← Back
            </button>
            <h1 style={{ margin: 0, fontSize: 22, color: 'var(--text-primary, #183547)' }}>
              Resources — Books on Mental Health & Comfort Reading
            </h1>
          </header>
          <QuoteBanner 
            text={QUOTES.games.quote}
            author={QUOTES.games.author}
          />
          

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, color: 'var(--text-secondary, #4b6b7a)' }}>
            <Heart size={20} color="#f4b8a4" className="icon-small" />
            <p style={{ margin: 0 }}>
              A curated list of memoirs, personal stories, non-fiction reads and gentle picture books.
              Each item links to Amazon.in search results for the title + author so you can find editions available in India.
            </p>
          </div>

          <div className="card" style={{ overflowX: 'auto', marginTop: 18 }}>
            <table className="books-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Author</th>
                  <th style={thStyle}>Category / Notes</th>
                  <th style={thStyle}>Amazon.in</th>
                </tr>
              </thead>
              <tbody>
                {BOOKS.map((b, i) => (
                  <tr key={i} style={i % 2 === 0 ? { background: 'rgba(20,40,60,0.02)' } : {}}>
                    <td style={tdStyle}>{b.title}</td>
                    <td style={tdStyle}>{b.author || '—'}</td>
                    <td style={tdStyle}>{b.category}</td>
                    <td style={tdStyle}>
                      <a
                        href={amazonSearchLink(b.title, b.author)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--cta-strong, #1f9fff)', textDecoration: 'none', fontWeight: 600 }}
                      >
                        View on Amazon.in
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <QuoteBanner
            text="Books are lighthouses in the storm, guiding us to safer shores."
            author="A Reading Friend"
          />
          <section className="content-card" style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Leaf size={24} color="#a8d5ba" />
              <h2 style={{ margin: 0 }}>Notes</h2>
            </div>
            <ul style={{ color: 'var(--text-secondary, #4b6b7a)', paddingLeft: 20 }}>
              <li>Memoirs and first-person accounts can be powerful and sometimes triggering — please approach at your own pace.</li>
              <li>Picture books listed are gentle reads for kids (and adults) to help discuss feelings, worry and connection.</li>
              <li>If you want, I can replace the search links with specific Amazon product pages (please provide preferred editions or I can look them up).</li>
            </ul>
          </section>

          <footer style={{ marginTop: 28, color: 'var(--text-muted, #7b8899)', fontSize: 13, textAlign: 'center' }}>
            © {new Date().getFullYear()} Semi‑Colonic — Resources
          </footer>
        </main>
      </div>

      <style jsx>{`
        :root {
          --cta-strong: #1f9fff;
          --text-primary: #183547;
          --text-secondary: #617489;
          --text-muted: #7b8899;
        }

        .site-root { min-height: 100vh; background: linear-gradient(180deg, #e8f4f8, #d8eef5); font-family: "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        .site { max-width: 1200px; margin: 0 auto; padding: 18px; }

        .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }

        /* Buttons: ensure visible brand color in light theme */
        .btn { background: transparent; border: 1px solid rgba(6,20,40,0.06); padding: 8px 12px; border-radius: 10px; cursor: pointer; color: var(--text-primary); font-weight:700; }
        .btn-outline { border: 1px solid rgba(20,40,60,0.06); background: transparent; color: var(--text-primary); }

        .books-table th, .books-table td { padding: 12px 14px; border-bottom: 1px solid rgba(6,20,40,0.04); text-align: left; vertical-align: middle; }

        .content-card { padding: 16px; border-radius: 12px; background: linear-gradient(180deg,#ffffff,#fbfdff); box-shadow: 0 8px 20px rgba(6,20,40,0.04); }

        @media (max-width: 640px) {
          .books-table { min-width: 520px; }
          .page-header h1 { font-size: 18px; }
        }

        @media (max-width: 820px) {
          .site { padding: 0 14px; }
        }
      `}</style>
    </div>
  );
}

const thStyle = {
  padding: '12px 14px',
  textAlign: 'left',
  background: 'rgba(6,20,40,0.02)',
  fontWeight: 700,
  color: '#274a66',
};

const tdStyle = {
  padding: '12px 14px',
  color: '#222',
};
