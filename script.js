var $ = function(i){return document.getElementById(i)};
var imgs = [];
var btns = [];
var IMGRE = /^https?:\/\/[^\s?#]+\.(?:png|jpe?g|gif|webp|avif)(?:[?#]\S*)?$/i;
var URLRE = /^https?:\/\/\S+$/i;
var EMO = /<(a?):([A-Za-z0-9_]{2,32}):(\d{17,20})>/;
var POS = [["top","Top"],["middle","Under text"],["bottom","Above buttons"]];

function esc(s){return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function hexInt(h){return parseInt(h.slice(1), 16)}

function validImgs(){
  return imgs.map(function(m){return {url:m.url.trim(), pos:m.pos}})
    .filter(function(m){return m.url.length <= 2048 && IMGRE.test(m.url)}).slice(0, 4);
}
function validBtns(){
  var out = [];
  btns.forEach(function(b){
    var label = b.label.trim().slice(0, 80), url = b.url.trim();
    var id = b.id.trim(), name = b.name.trim();
    var emoji = (/^\d{17,20}$/.test(id) && /^[A-Za-z0-9_]{2,32}$/.test(name)) ? {id:id, name:name, animated:!!b.anim} : null;
    if (!(label || emoji) || !URLRE.test(url) || url.length > 512) return;
    var o = {type:2, style:5, url:url};
    if (label) o.label = label;
    if (emoji) { o.emoji = {id:emoji.id, name:emoji.name}; if (emoji.animated) o.emoji.animated = true; }
    out.push(o);
  });
  return out.slice(0, 5);
}

function build(){
  var vi = validImgs();
  function gal(p){
    var a = vi.filter(function(m){return m.pos === p}).map(function(m){return {media:{url:m.url}}});
    return a.length ? [{type:12, items:a}] : [];
  }
  var title = $("title").value.trim(), desc = $("desc").value.trim();
  var text = (title ? "# " + title : "") + (title && desc ? "\n" : "") + desc;
  var thumb = $("thumb").value.trim();
  var comps = gal("top");
  if (text) {
    if (thumb && IMGRE.test(thumb)) comps.push({type:9, components:[{type:10, content:text}], accessory:{type:11, media:{url:thumb}}});
    else comps.push({type:10, content:text});
  }
  comps = comps.concat(gal("middle"));
  var extra = $("extra").value.trim();
  if (extra) comps.push({type:10, content:extra});
  comps = comps.concat(gal("bottom"));
  var bl = validBtns();
  if (bl.length) {
    if ($("div").checked) comps.push({type:14, divider:true, spacing:1});
    comps.push({type:1, components:bl});
  }
  return {component:{type:17, accent_color:hexInt($("accent").value), components:comps}};
}

function payloadString(obj){return JSON.stringify(obj, null, 2).replace(/</g, "\\u003c")}
function compactBytes(obj){return new TextEncoder().encode(JSON.stringify(obj).replace(/</g, "\\u003c")).length}

function genHtml(obj){
  var title = $("title").value.trim() || "Embed";
  var desc = $("desc").value.trim();
  var og = $("og").value.trim();
  var first = validBtns()[0];
  var L = [];
  L.push('<!DOCTYPE html>');
  L.push('<html lang="en">');
  L.push('<head>');
  L.push('<meta charset="UTF-8">');
  L.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  L.push('<title>' + esc(title) + '</title>');
  L.push('');
  L.push('<!-- Fallback Open Graph tags for clients without component embeds -->');
  L.push('<meta property="og:title" content="' + esc(title) + '">');
  if (desc) L.push('<meta property="og:description" content="' + esc(desc) + '">');
  if (og && URLRE.test(og)) L.push('<meta property="og:image" content="' + esc(og) + '">');
  L.push('<meta name="theme-color" content="' + $("theme").value + '">');
  if ($("redir").checked && first) L.push('<meta http-equiv="refresh" content="0;url=' + esc(first.url) + '">');
  L.push('');
  L.push('<!-- Discord component-embed payload -->');
  L.push('<script id="discord:component-embed" type="application/json">');
  L.push(payloadString(obj));
  L.push('<\/script>');
  L.push('</head>');
  L.push('<body>');
  L.push('<p>' + esc(title) + '</p>');
  L.push('</body>');
  L.push('</html>');
  return L.join("\n");
}

function mdLine(t){
  t = esc(t).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\*([^*]+)\*/g, "<i>$1</i>");
  var m = /^(#{1,3})\s+(.*)$/.exec(t);
  return m ? '<div class="h1" style="font-size:' + (26 - m[1].length * 3) + 'px">' + m[2] + '</div>' : '<p>' + t + '</p>';
}
function mdBlock(s){return s.split("\n").map(function(l){return l.trim() ? mdLine(l) : ""}).join("")}
function galHtml(items){
  var cols = items.length > 1 ? "1fr 1fr" : "1fr";
  return '<div class="gal" style="grid-template-columns:' + cols + '">' + items.map(function(m){return '<img alt="Embed image" src="' + esc(m.media.url) + '">'}).join("") + '</div>';
}
function renderPreview(obj){
  var c = obj.component, h = "";
  c.components.forEach(function(x){
    if (x.type === 10) h += '<div class="txt">' + mdBlock(x.content) + '</div>';
    else if (x.type === 9) h += '<div class="top"><div class="txt">' + mdBlock(x.components[0].content) + '</div><img class="th" alt="Thumbnail" src="' + esc(x.accessory.media.url) + '"></div>';
    else if (x.type === 12) h += galHtml(x.items);
    else if (x.type === 14) h += '<hr>';
    else if (x.type === 1) {
      h += '<div class="btns">' + x.components.map(function(b){
        var em = b.emoji ? '<img alt="" src="https://cdn.discordapp.com/emojis/' + esc(b.emoji.id) + (b.emoji.animated ? ".gif" : ".png") + '?size=48">' : "";
        return '<a class="btn" href="' + esc(b.url) + '" target="_blank" rel="noopener">' + em + esc(b.label || "") + '</a>';
      }).join("") + '</div>';
    }
  });
  $("card").innerHTML = h || '<div class="none">Your embed shows up here once you add something.</div>';
  $("card").style.borderLeftColor = $("accent").value;
}

function hlAttrs(a){
  return a.replace(/(\s+)([^\s=]+)(?:(=)("[^"]*"|'[^']*'))?/g, function(m, ws, name, eq, val){
    return ws + '<span class="hl-a">' + esc(name) + '</span>' + (eq ? '<span class="hl-p">=</span><span class="hl-s">' + esc(val) + '</span>' : '');
  });
}
function hlMarkup(s){
  var re = /(<!-{2}[\s\S]*?-{2}>)|(<!DOCTYPE[^>]*>)|(<\/?)([A-Za-z][\w:-]*)((?:\s+[^\s=>]+(?:=(?:"[^"]*"|'[^']*'))?)*)(\s*\/?>)/gi;
  var out = "", last = 0, m;
  while ((m = re.exec(s)) !== null) {
    out += esc(s.slice(last, m.index));
    if (m[1] || m[2]) out += '<span class="hl-c">' + esc(m[1] || m[2]) + '</span>';
    else out += '<span class="hl-p">' + esc(m[3]) + '</span><span class="hl-t">' + esc(m[4]) + '</span>' + hlAttrs(m[5]) + '<span class="hl-p">' + esc(m[6]) + '</span>';
    last = re.lastIndex;
  }
  return out + esc(s.slice(last));
}
function hlJson(s){
  var re = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}\[\],:])/g;
  var out = "", last = 0, m;
  while ((m = re.exec(s)) !== null) {
    out += esc(s.slice(last, m.index));
    if (m[1]) out += m[2] ? '<span class="hl-k">' + esc(m[1]) + '</span><span class="hl-p">' + esc(m[2]) + '</span>' : '<span class="hl-s">' + esc(m[1]) + '</span>';
    else if (m[3]) out += '<span class="hl-n">' + esc(m[3]) + '</span>';
    else if (m[4]) out += '<span class="hl-l">' + esc(m[4]) + '</span>';
    else out += '<span class="hl-p">' + esc(m[5]) + '</span>';
    last = re.lastIndex;
  }
  return out + esc(s.slice(last));
}
function hl(src){
  var m = /^([\s\S]*?<script[^>]*>)([\s\S]*?)(<\/script>[\s\S]*)$/.exec(src);
  return m ? hlMarkup(m[1]) + hlJson(m[2]) + hlMarkup(m[3]) : hlMarkup(src);
}

function meterColor(r){
  var G = [156,207,160], Y = [230,201,122], R = [240,163,160], a, b, t;
  if (r <= .4) return "rgb(" + G.join(",") + ")";
  if (r <= .75) { a = G; b = Y; t = (r - .4) / .35; }
  else { a = Y; b = R; t = Math.min(1, (r - .75) / .25); }
  return "rgb(" + a.map(function(v, i){return Math.round(v + (b[i] - v) * t)}).join(",") + ")";
}

var view = "discord", swapBusy = false;
function fbValid(){return URLRE.test($("og").value.trim())}
function renderFallback(){
  var title = $("title").value.trim() || "Embed", desc = $("desc").value.trim();
  var h = '<div class="fb-title">' + esc(title) + '</div>';
  if (desc) h += '<div class="fb-desc">' + esc(desc) + '</div>';
  h += '<img class="fb-img" alt="Fallback image" src="' + esc($("og").value.trim()) + '">';
  $("fb").innerHTML = h;
  $("fb").style.borderLeftColor = $("theme").value;
}
function setView(v){
  view = v;
  $("swaplabel").textContent = v === "discord" ? "Check fallback embed" : "See Discord embed";
}
function snapView(v){
  $("pane-discord").className = "pane" + (v === "discord" ? "" : " off");
  $("pane-fb").className = "pane" + (v === "fallback" ? "" : " off");
  setView(v);
}
function swapView(){
  if (swapBusy) return;
  var to = view === "discord" ? "fallback" : "discord";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { snapView(to); return; }
  swapBusy = true;
  $(to === "discord" ? "pane-discord" : "pane-fb").className = "pane in-top";
  $(to === "discord" ? "pane-fb" : "pane-discord").className = "pane to-black";
  setView(to);
  setTimeout(function(){ snapView(fbValid() ? to : "discord"); swapBusy = false; }, 560);
}
function syncFallback(){
  var on = fbValid();
  $("swap").hidden = !on;
  if (on) renderFallback();
  else if (view !== "discord" || swapBusy) { swapBusy = false; snapView("discord"); }
}
$("swap").onclick = swapView;

function update(){
  var bad = imgs.some(function(m){var t = m.url.trim(); return t && !(t.length <= 2048 && IMGRE.test(t))});
  $("m-img").textContent = bad ? "One image link is not a direct image URL (.png .jpg .jpeg .gif .webp .avif)." : "";
  $("m-img").className = "msg" + (bad ? " err" : "");
  var badB = btns.some(function(b){
    var any = b.label.trim() || b.id.trim() || b.name.trim() || b.url.trim();
    if (!any) return false;
    var e = b.id.trim() || b.name.trim();
    var emojiOk = !e || (/^\d{17,20}$/.test(b.id.trim()) && /^[A-Za-z0-9_]{2,32}$/.test(b.name.trim()));
    return !URLRE.test(b.url.trim()) || !emojiOk || !(b.label.trim() || e);
  });
  $("m-btn").textContent = badB ? "A button needs an http(s) URL, plus a label or a full emoji (name and 17-20 digit ID)." : "";
  $("m-btn").className = "msg" + (badB ? " err" : "");
  var obj = build();
  renderPreview(obj);
  syncFallback();
  var n = compactBytes(obj);
  $("sizetxt").textContent = "Payload size: " + n + " of 3000 bytes" + (n > 3000 ? ". Too big, Discord will ignore it." : "");
  $("sizetxt").className = "small" + (n > 3000 ? " err" : "");
  $("bar").style.transform = "scaleX(" + Math.min(1, n / 3000) + ")";
  $("bar").style.background = meterColor(n / 3000);
  var html = genHtml(obj);
  $("out").value = html;
  $("outcode").innerHTML = hl(html);
  $("addimg").disabled = imgs.length >= 4;
  $("addbtn").disabled = btns.length >= 5;
  $("imgempty").hidden = imgs.length > 0;
  $("btnempty").hidden = btns.length > 0;
}

function addImgRow(m){
  var box = document.createElement("div"); box.className = "item";
  var r1 = document.createElement("div"); r1.className = "row";
  var u = document.createElement("input"); u.placeholder = "https://host.com/image.png"; u.value = m.url; u.className = "grow3"; u.setAttribute("aria-label", "Image URL");
  var s = document.createElement("select"); s.setAttribute("aria-label", "Image position");
  POS.forEach(function(p){var o = document.createElement("option"); o.value = p[0]; o.textContent = p[1]; s.appendChild(o)});
  s.value = m.pos;
  var x = document.createElement("button"); x.type = "button"; x.className = "ghost fix"; x.textContent = "Remove";
  u.oninput = function(){m.url = u.value; update()};
  s.onchange = function(){m.pos = s.value; update()};
  x.onclick = function(){imgs.splice(imgs.indexOf(m), 1); box.remove(); update()};
  r1.appendChild(u); r1.appendChild(s); r1.appendChild(x);
  box.appendChild(r1); $("imglist").appendChild(box);
}

var animCache = {};
function detectAnim(b, ac){
  var id = b.id;
  if (!/^\d{17,20}$/.test(id)) return;
  function apply(v){ if (b.id !== id) return; b.anim = v; ac.checked = v; update(); }
  if (id in animCache) { apply(animCache[id]); return; }
  fetch("https://cdn.discordapp.com/emojis/" + id + ".webp?animated=true")
    .then(function(r){ return r.ok ? r.arrayBuffer() : Promise.reject(); })
    .then(function(buf){
      var u = new Uint8Array(buf);
      var riff = String.fromCharCode(u[0], u[1], u[2], u[3]) === "RIFF" && String.fromCharCode(u[8], u[9], u[10], u[11]) === "WEBP";
      var anim = riff && u.length > 20 && (u[20] & 2) === 2;
      animCache[id] = anim;
      apply(anim);
    })
    .catch(function(){ });
}

function addBtnRow(b){
  var box = document.createElement("div"); box.className = "item";
  var r1 = document.createElement("div"); r1.className = "row";
  var l = document.createElement("input"); l.placeholder = "Label"; l.maxLength = 80; l.value = b.label; l.setAttribute("aria-label", "Button label");
  var u = document.createElement("input"); u.placeholder = "https://link.com"; u.value = b.url; u.className = "grow2"; u.setAttribute("aria-label", "Button URL");
  r1.appendChild(l); r1.appendChild(u);
  var r2 = document.createElement("div"); r2.className = "row";
  var en = document.createElement("input"); en.placeholder = "Emoji name"; en.value = b.name; en.setAttribute("aria-label", "Emoji name");
  var ei = document.createElement("input"); ei.placeholder = "Emoji ID"; ei.value = b.id; ei.setAttribute("aria-label", "Emoji ID");
  var an = document.createElement("label"); an.className = "chk flat fix";
  var ac = document.createElement("input"); ac.type = "checkbox"; ac.checked = b.anim;
  an.appendChild(ac); an.appendChild(document.createTextNode("Animated"));
  var x = document.createElement("button"); x.type = "button"; x.className = "ghost fix"; x.textContent = "Remove";
  r2.appendChild(en); r2.appendChild(ei); r2.appendChild(an); r2.appendChild(x);
  l.oninput = function(){b.label = l.value; update()};
  u.oninput = function(){b.url = u.value; update()};
  en.oninput = function(){
    var m = EMO.exec(en.value);
    if (m) { b.anim = m[1] === "a"; b.name = m[2]; b.id = m[3]; en.value = m[2]; ei.value = m[3]; ac.checked = b.anim; detectAnim(b, ac); }
    else {
      var clean = en.value.replace(/`/g, "");
      if (clean !== en.value) en.value = clean;
      b.name = clean;
    }
    update();
  };
  ei.oninput = function(){
    var clean = ei.value.replace(/[`\s]/g, "");
    if (clean !== ei.value) ei.value = clean;
    b.id = clean;
    update();
    detectAnim(b, ac);
  };
  ac.onchange = function(){b.anim = ac.checked; update()};
  x.onclick = function(){btns.splice(btns.indexOf(b), 1); box.remove(); update()};
  box.appendChild(r1); box.appendChild(r2); $("btnlist").appendChild(box);
}

$("addimg").onclick = function(){if (imgs.length >= 4) return; var m = {url:"", pos:"middle"}; imgs.push(m); addImgRow(m); update()};
$("addbtn").onclick = function(){if (btns.length >= 5) return; var b = {label:"", url:"", name:"", id:"", anim:false}; btns.push(b); addBtnRow(b); update()};

["title","desc","extra","thumb","accent","theme","og","div","redir"].forEach(function(id){
  $(id).addEventListener("input", update);
  $(id).addEventListener("change", update);
});

$("copy").onclick = function(){
  var v = $("out").value;
  var done = function(){$("copy").textContent = "Copied"; setTimeout(function(){$("copy").textContent = "Copy code"}, 1200)};
  if (navigator.clipboard) navigator.clipboard.writeText(v).then(done, function(){$("out").select(); document.execCommand("copy"); done()});
  else { $("out").select(); document.execCommand("copy"); done(); }
};
$("dl").onclick = function(){
  var blob = new Blob([$("out").value], {type:"text/html"});
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "index.html";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){URL.revokeObjectURL(a.href)}, 1000);
};

(function(){
  var els = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  els.forEach(function(el, i){el.style.setProperty("--index", i % 4)});
  if (!("IntersectionObserver" in window)) { els.forEach(function(el){el.classList.add("in")}); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }});
  }, {threshold:.08});
  els.forEach(function(el){io.observe(el)});
})();

function pageUrl(){return location.href.split("#")[0]}
function copyText(btn, text){
  var old = btn.dataset.l || (btn.dataset.l = btn.textContent);
  var done = function(){btn.textContent = "Copied"; setTimeout(function(){btn.textContent = old}, 1200)};
  var fallback = function(){
    var t = document.createElement("textarea"); t.value = text; t.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); done(); } catch (e) {}
    t.remove();
  };
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
}
$("cl").onclick = function(){copyText(this, pageUrl())};
$("ci").onclick = function(){copyText(this, "[\u2800](" + pageUrl() + ")")};

update();
