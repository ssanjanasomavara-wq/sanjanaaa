# Helpline page and footer integration

Files added:
- `helpline.html` — the standalone helpline page built from the provided index (3).html content.
- `assets/footer-helpline.html` — a prominent footer/CTA fragment that links to the helpline and provides a Call button.
- `assets/footer-inject.js` — a small script that loads the footer fragment and injects a prominent helpline link into any element with the class `application-access`.

How to make the helpline accessible from the landing page and application access pages:

1. Landing page (index.html)
   - Add a visible link in the main navigation: `<a href="helpline.html">Helpline</a>`
   - Add the footer injector script just before the closing `</body>` tag:
     `<script src="/assets/footer-inject.js"></script>`

2. Application access pages
   - On pages that serve as "application access" (login, signup, apply, etc.), ensure there's an element with the class `application-access` where a prominent helpline button will be injected. Example:
     `<div class="application-access"></div>`
   - Also include the footer injector script on those pages.

Notes and recommendations:
- If your project uses a common header/footer include (server-side), prefer including the `assets/footer-helpline.html` fragment server-side so it's available to crawlers and users without JS.
- If you already have a global `footer` element with `id="site-footer"`, the injector will replace its contents with the helpline fragment.
- If you'd like, I can update your existing `index.html` and application pages directly to add the link and script — provide the paths (or let me know if the repo uses a different default branch) and I will open a follow-up change.
