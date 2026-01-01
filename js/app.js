// Minimal app.js moved into js/
(function(){
  // Helpers
  function qs(id){return document.getElementById(id)}
  function loadEntries(){
    try{var raw=localStorage.getItem('mood_entries');return raw?JSON.parse(raw):[];}catch(e){return []}
  }
  function saveEntries(entries){localStorage.setItem('mood_entries',JSON.stringify(entries))}

  // State
  var currentMood = null
  var currentLevel = null

  window.selectMood = function(mood,level){
    currentMood = mood
    currentLevel = level
    var d = qs('moodDisplay')
    if(d) d.textContent = 'Selected Mood: '+mood
  }

  window.saveEntry = function(){
    var journal = (qs('journal') && qs('journal').value) || ''
    var entries = loadEntries()
    var entry = {id: Date.now(), mood: currentMood, level: currentLevel, note: journal, created: new Date().toISOString()}
    entries.unshift(entry)
    // keep last 100
    entries = entries.slice(0,100)
    saveEntries(entries)
    alert('Saved entry ✅')
    renderChart()
  }

  window.exportEntries = function(){
    var entries = loadEntries()
    var blob = new Blob([JSON.stringify(entries, null, 2)],{type:'application/json'})
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = 'mood-entries.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // Doodle canvas
  var canvas, ctx, drawing=false, last={x:0,y:0}
  function setupCanvas(){
    canvas = qs('drawCanvas')
    if(!canvas) return
    ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 3
    ctx.strokeStyle = '#111'

    canvas.addEventListener('pointerdown', function(e){
      canvas.setPointerCapture(e.pointerId)
      drawing = true
      var r = canvas.getBoundingClientRect()
      last.x = e.clientX - r.left
      last.y = e.clientY - r.top
    })
    canvas.addEventListener('pointermove', function(e){
      if(!drawing) return
      var r = canvas.getBoundingClientRect()
      var x = e.clientX - r.left
      var y = e.clientY - r.top
      ctx.beginPath()
      ctx.moveTo(last.x,last.y)
      ctx.lineTo(x,y)
      ctx.stroke()
      last.x = x; last.y = y
    })
    canvas.addEventListener('pointerup', function(e){ drawing=false; canvas.releasePointerCapture && canvas.releasePointerCapture(e.pointerId) })
    canvas.addEventListener('pointercancel', function(){ drawing=false })
  }

  window.clearDoodle = function(){ if(!canvas) return; ctx.clearRect(0,0,canvas.width,canvas.height) }
  window.downloadDoodle = function(){ if(!canvas) return; canvas.toBlob(function(b){ var url = URL.createObjectURL(b); var a=document.createElement('a'); a.href=url; a.download='doodle.png'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }) }

  // Simple chart rendering
  function renderChart(){
    var chart = qs('chartCanvas')
    if(!chart) return
    var data = loadEntries().slice(0,10).reverse()
    var ctx2 = chart.getContext('2d')
    ctx2.clearRect(0,0,chart.width,chart.height)
    if(data.length===0){
      ctx2.fillStyle = '#9aa0b4'
      ctx2.font = '12px sans-serif'
      ctx2.fillText('No data yet', 10, 20)
      return
    }
    var w = chart.width, h = chart.height, pad = 20
    var max = 5
    var stepX = (w - pad*2) / (data.length-1 || 1)
    ctx2.beginPath()
    ctx2.strokeStyle = '#6b5ce6'
    ctx2.lineWidth = 2
    for(var i=0;i<data.length;i++){
      var v = data[i].level || 3
      var x = pad + i*stepX
      var y = h - pad - ((v-1)/(max-1))*(h-pad*2)
      if(i===0) ctx2.moveTo(x,y); else ctx2.lineTo(x,y)
      ctx2.fillStyle = '#6b5ce6'
      ctx2.beginPath(); ctx2.arc(x,y,3,0,Math.PI*2); ctx2.fill()
    }
    ctx2.stroke()
  }

  // Init
  document.addEventListener('DOMContentLoaded', function(){
    setupCanvas();
    renderChart();
  })

})();
