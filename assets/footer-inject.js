// Footer injector: loads /assets/footer-helpline.html and inserts into a footer element.
(function(){
  function insertFooter(html){
    try{
      var footer = document.getElementById('site-footer');
      if(!footer){
        footer = document.createElement('footer');
        footer.id = 'site-footer';
        footer.className = 'site-footer';
        document.body.appendChild(footer);
      }
      footer.innerHTML = html;

      // Also add a prominent helpline link into any element with class 'application-access'
      var apps = document.querySelectorAll('.application-access');
      apps.forEach(function(el){
        if(!el.querySelector('.helpline-quick')){
          var a = document.createElement('a');
          a.className = 'helpline-quick';
          a.href = 'helpline.html';
          a.textContent = 'Helpline & Support';
          a.style.cssText = 'display:inline-block;margin-left:8px;background:#e74c3c;color:#fff;padding:8px 12px;border-radius:6px;text-decoration:none;font-weight:700';
          el.appendChild(a);
        }
      });
    }catch(e){ console.error('footer inject error', e) }
  }

  function fetchFooter(){
    var url = '/assets/footer-helpline.html';
    fetch(url, {cache:'no-cache'})
      .then(function(resp){ if(!resp.ok) throw new Error('Network response not ok'); return resp.text() })
      .then(insertFooter)
      .catch(function(){
        // fallback: inline minimal footer
        insertFooter('<div style="padding:12px;background:#0b5345;color:#fff;border-radius:6px;text-align:center"> <a href="helpline.html" style="color:#fff;font-weight:700;text-decoration:none">Helpline & Support</a></div>');
      });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fetchFooter); else fetchFooter();
})();
