import Link from 'next/link';
import { useRouter } from 'next/router';

const BOOKS = [
  // Memoirs & First-Person Mental Health Journeys
  { title: 'Prozac Nation', author: 'Elizabeth Wurtzel', category: 'Memoir' },
  { title: 'Girl, Interrupted', author: 'Susanna Kaysen', category: 'Memoir' },
  { title: 'An Unquiet Mind', author: 'Kay Redfield Jamison', category: 'Memoir' },
  { title: 'Reasons to Stay Alive', author: 'Matt Haig', category: 'Memoir' },
  { title: 'I Want to Die but I Want to Eat Tteokbokki', author: 'Baek Sehee', category: 'Memoir' },

  // Personal stories tackling specific conditions
  { title: 'Good Girls: A Story and Study of Anorexia', author: 'Hadley Freeman', category: 'Memoir / Eating disorders' },
  { title: 'My Schizophrenic Life', author: 'Sandra Yuen MacKay', category: 'Memoir / Psychosis' },
  { title: 'Louise: Amended', author: 'Louise Krug', category: 'Memoir / Recovery' },
  { title: 'Asylum (An Alcoholic Takes the Cure)', author: 'William Seabrook', category: 'Historic memoir' },

  // Other Deep or Complementary Reads
  { title: 'The Bell Jar', author: 'Sylvia Plath', category: 'Fictionalized memoir' },
  { title: 'Darkness Visible: A Memoir of Madness', author: 'William Styron', category: 'Memoir' },

  // Humor & unconventional approaches
  { title: 'Sure I’ll Join Your Cult', author: 'Maria Bamford', category: 'Humor / Memoir' },
  { title: 'Furiously Happy', author: 'Jenny Lawson', category: 'Humor / Memoir' },

  // Non-fiction, research & practical
  { title: 'The Body Keeps the Score', author: 'Bessel van der Kolk, M.D.', category: 'Non-fiction / Trauma' },
  { title: "It's OK That You're Not OK", author: 'Megan Devine', category: 'Non-fiction / Grief' },

  // Picture books & gentle children's reads (from image)
  { title: 'Cicada', author: '', category: 'Picture book' },
  { title: 'The Rabbit Listened', author: 'Cori Doerrfeld', category: 'Picture book — gentle healing journey' },
  { title: 'The Color Monster', author: 'Anna Llenas', category: 'Picture book — emotions' },
  { title: 'The Invisible String', author: 'Patrice Karst', category: 'Picture book — connection & comfort' },
  { title: 'What Do You Do With a Problem?', author: 'Kobi Yamada', category: 'Picture book — problem solving & anxiety' },
  { title: 'My Many Colored Days', author: 'Dr. Seuss (illustrated by Steve Johnson & Lou Fancher)', category: 'Picture book — emotions' },
];

function amazonSearchLink(title, author) {
  // Build an Amazon.in search URL for book + author (safer than hard-coding product pages)
  const q = encodeURIComponent((title + (author ? ' ' + author : '')).trim());
  return `https://www.amazon.in/s?k=${q}&i=stripbooks`;
}

export default function Resources() {
  const router = useRouter();

  return (
    <div className="site-root">
      <div className="site" style={{ padding: 18 }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <button onClick={() => router.back()} className="btn-back" aria-label="Go back" style={{ cursor: 'pointer' }}>
            ← Back
          </button>
          <h1 style={{ margin: 0, fontSize: 22, color: '#183547' }}>Resources — Books on Mental Health & Comfort Reading</h1>
        </header>

        <p style={{ color: '#556', marginTop: 6 }}>
          A curated list of memoirs, personal stories, non-fiction reads and gentle picture books.
          Each item links to Amazon.in search results for the title + author so you can find editions available in India.
        </p>

        <div style={{ overflowX: 'auto', marginTop: 18 }}>
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
                      style={{ color: '#1a73e8', textDecoration: 'none', fontWeight: 600 }}
                    >
                      View on Amazon.in
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section style={{ marginTop: 22 }}>
          <h2 style={{ margin: '8px 0 6px' }}>Notes</h2>
          <ul style={{ color: '#556' }}>
            <li>Memoirs and first-person accounts can be powerful and sometimes triggering — please approach at your own pace.</li>
            <li>Picture books listed are gentle reads for kids (and adults) to help discuss feelings, worry and connection.</li>
            <li>If you want, I can replace the search links with specific Amazon product pages (please provide preferred editions or I can look them up).</li>
          </ul>
        </section>

        <footer style={{ marginTop: 26, color: '#7b8899', fontSize: 13 }}>
          © {new Date().getFullYear()} Semi‑Colonic — Resources
        </footer>
      </div>

      <style jsx>{`
        .btn-back {
          background: transparent;
          border: 1px solid rgba(6,20,40,0.06);
          padding: 8px 10px;
          border-radius: 8px;
        }
        .books-table th, .books-table td {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(6,20,40,0.04);
          text-align: left;
          vertical-align: middle;
        }
        @media (max-width: 640px) {
          .books-table { min-width: 520px; }
        }
      `}</style>
    </div>
  );
}

// Inline styles used for clarity and reuse
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
