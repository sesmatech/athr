const $ = (id) => document.getElementById(id);

const canvas = $("canvas");
const ctx = canvas.getContext("2d");

let surahs = [];
let female = false;
let theme = "ivory";
let current = null;
let lastKey = "";
let shareFile = null;
let shareFilePromise = null;
let shareVersion = 0;
let shareTimer = null;

const ar = (n) =>
  String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);

const pick = (n) =>
  crypto.getRandomValues(new Uint32Array(1))[0] % n;

// أدعية المتوفى
const male = [
  (n) => `اللهم اغفر لـ${n} وارحمه، وعافه واعف عنه.`,

  (n) =>
    `اللهم أكرم نزل ${n}، ووسّع مدخله، واغسله بالماء والثلج والبرد.`,

  (n) =>
    `اللهم نقِّ ${n} من الخطايا كما يُنقّى الثوب الأبيض من الدنس.`,

  (n) => `اللهم اجعل قبر ${n} روضة من رياض الجنة.`,

  (n) => `اللهم آنس وحشة ${n}، وأضئ قبره بنور رحمتك.`,

  (n) =>
    `اللهم ارفع درجة ${n} في المهديين، واخلفه في عقبه في الغابرين.`,

  (n) => `اللهم اجعل ${n} من أهل الفردوس الأعلى برحمتك.`,

  (n) =>
    `اللهم أبدل ${n} دارًا خيرًا من داره، وأهلًا خيرًا من أهله.`,

  (n) =>
    `اللهم اجعل ما أصاب ${n} من تعب وألم كفارة لذنوبه.`,

  (n) =>
    `اللهم اسقِ ${n} من حوض نبيك شربة لا يظمأ بعدها أبدًا.`,

  (n) => `اللهم اجمعنا بـ${n} في جنات النعيم.`,

  (n) =>
    `اللهم وسّع على ${n} في قبره، واجعله في أمانك ورحمتك.`
];

// أدعية المتوفاة
const women = [
  (n) => `اللهم اغفر لـ${n} وارحمها، وعافها واعف عنها.`,

  (n) =>
    `اللهم أكرم نزل ${n}، ووسّع مدخلها، واغسلها بالماء والثلج والبرد.`,

  (n) =>
    `اللهم نقِّ ${n} من الخطايا كما يُنقّى الثوب الأبيض من الدنس.`,

  (n) => `اللهم اجعل قبر ${n} روضة من رياض الجنة.`,

  (n) => `اللهم آنس وحشة ${n}، وأضئ قبرها بنور رحمتك.`,

  (n) =>
    `اللهم ارفع درجة ${n} في المهديين، واخلفها في عقبها في الغابرين.`,

  (n) => `اللهم اجعل ${n} من أهل الفردوس الأعلى برحمتك.`,

  (n) =>
    `اللهم أبدل ${n} دارًا خيرًا من دارها، وأهلًا خيرًا من أهلها.`,

  (n) =>
    `اللهم اجعل ما أصاب ${n} من تعب وألم كفارة لذنوبها.`,

  (n) =>
    `اللهم اسقِ ${n} من حوض نبيك شربة لا تظمأ بعدها أبدًا.`,

  (n) => `اللهم اجمعنا بـ${n} في جنات النعيم.`,

  (n) =>
    `اللهم وسّع على ${n} في قبرها، واجعلها في أمانك ورحمتك.`
];

const HISTORY_KEY = "athar-content-history-v1";
const REUSE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
const prayerEndings = [
  "برحمتك الواسعة يا أرحم الراحمين.", "بلطفك الخفي يا كريم.",
  "وبنور رضاك يا غفور.", "وبمنك وكرمك يا ودود.",
  "بفضلك الذي لا ينفد.", "بعفوك الذي ترجوه القلوب.",
  "وبشفاعة نبيك الكريم.", "وتقبّل دعاء المحبين.",
  "وأكرم الوفادة عندك.", "واجعل المصير إلى جنات النعيم."
];

function loadHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return value && value.ayahs && value.prayers ? value : { ayahs: {}, prayers: {} };
  } catch {
    return { ayahs: {}, prayers: {} };
  }
}

function isRecent(history, group, id, now = Date.now()) {
  return now - (history[group][id] || 0) < REUSE_AFTER_MS;
}

function saveHistory(history) {
  const cutoff = Date.now() - REUSE_AFTER_MS;
  for (const group of ["ayahs", "prayers"]) {
    for (const [id, usedAt] of Object.entries(history[group])) {
      if (usedAt < cutoff) delete history[group][id];
    }
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function addEnding(prayer, ending) {
  return `${prayer.replace(/[.،]\s*$/, "")} ${ending}`;
}

function pronounPrayer(prayer) {
  const pronoun = female ? "ها" : "ه";
  return prayer(pronoun).replace(/\s+(ه|ها)/g, "$1");
}

function chooseUnused(items, count, history) {
  const available = items.filter((item) => !isRecent(history, "prayers", item.id));
  if (available.length < count) return null;
  const chosen = [];
  while (chosen.length < count) chosen.push(available.splice(pick(available.length), 1)[0]);
  return chosen;
}

function prayers(history) {
  const source = female ? women : male;
  const gender = female ? "female" : "male";
  const named = [];
  const pronouns = [];

  source.forEach((prayer, prayerIndex) => {
    prayerEndings.forEach((ending, endingIndex) => {
      named.push({
        id: `named-${gender}-${prayerIndex}-${endingIndex}`,
        render: (name) => addEnding(prayer(name), ending)
      });
      pronouns.push({
        id: `pronoun-${gender}-${prayerIndex}-${endingIndex}`,
        render: () => addEnding(pronounPrayer(prayer), ending)
      });
    });
  });

  const first = chooseUnused(named, 1, history);
  const rest = chooseUnused(pronouns, 2, history);
  return first && rest ? [...first, ...rest] : null;
}

function chooseVerseRun(selected, history) {
  const sources = selected === "random"
    ? surahs
    : surahs.filter((s) => s.number === Number(selected));
  const options = [];

  for (const s of sources) {
    for (let start = 0; start <= s.ayahs.length - 3; start++) {
      const ayahs = s.ayahs.slice(start, start + 3);
      if (ayahs.every((a) => !isRecent(history, "ayahs", `${s.number}:${a.numberInSurah}`))) {
        options.push({ s, start, ayahs });
      }
    }
  }

  return options.length ? options[pick(options.length)] : null;
}

// إنشاء بوست جديد
function make() {
  const raw = $("name").value.trim();

  if (!raw) {
    $("status").textContent =
      "اكتب اسم المتوفى أولًا لإنشاء البوست.";

    $("name").focus();
    return;
  }

  if (!surahs.length) return;

  const selected = $("surah").value;
  const history = loadHistory();
  const verseRun = chooseVerseRun(selected, history);
  const selectedPrayers = prayers(history);

  if (!verseRun || !selectedPrayers) {
    $("status").textContent =
      "استُنفدت الخيارات الجديدة خلال آخر 30 يومًا. جرّب سورة أخرى أو انتظر انتهاء المدة.";
    return;
  }

  const { s, start, ayahs } = verseRun;
  const usedAt = Date.now();
  ayahs.forEach((a) => {
    history.ayahs[`${s.number}:${a.numberInSurah}`] = usedAt;
  });
  selectedPrayers.forEach((prayer) => {
    history.prayers[prayer.id] = usedAt;
  });
  saveHistory(history);
  lastKey = s.number + ":" + start;

  current = {
    name: raw,
    s,
    start,
    prayers: selectedPrayers
  };

  render();

  $("download").disabled = false;
  $("share").disabled = false;

  $("status").textContent =
    "تم إنشاء بوست جديد. تقبّل الله دعاءكم.";
}

// تقسيم النص إلى أسطر بحسب العرض
function lines(text, size, width) {
  ctx.font =
    `500 ${size}px "Amiri", "Noto Naskh Arabic", "Times New Roman", serif`;

  let out = [];
  let line = "";

  for (const word of text.split(/\s+/)) {
    const test = line ? line + " " + word : word;

    if (ctx.measureText(test).width > width && line) {
      out.push(line);
      line = word;
    } else {
      line = test;
    }
  }

  if (line) out.push(line);

  return out;
}

// رسم نص داخل التصميم
function text(t, x, y, size, color) {
  ctx.font =
    `500 ${size}px "Amiri", "Noto Naskh Arabic", "Times New Roman", serif`;

  ctx.fillStyle = color;
  ctx.fillText(t, x, y);
}

function ornament(x, y, radius, color, alpha = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 2;

  for (let turn = 0; turn < 2; turn++) {
    ctx.save();
    ctx.rotate((Math.PI / 4) * turn);
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.lineTo(radius, 0);
    ctx.lineTo(0, radius);
    ctx.lineTo(-radius, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPremiumFrame(h, bg, gold, dark) {
  const wash = ctx.createLinearGradient(0, 0, 1080, h);
  wash.addColorStop(0, dark ? "#111713" : "#fffdf7");
  wash.addColorStop(0.48, bg);
  wash.addColorStop(1, dark ? "#222a23" : "#f2ead8");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 1080, h);

  const halo = ctx.createRadialGradient(540, h * 0.28, 80, 540, h * 0.28, 670);
  halo.addColorStop(0, dark ? "#d9b96d18" : "#c6a2541a");
  halo.addColorStop(1, "#00000000");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, 1080, h);

  ctx.strokeStyle = gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, 1024, h - 56);
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1;
  ctx.strokeRect(42, 42, 996, h - 84);
  ctx.strokeRect(55, 55, 970, h - 110);
  ctx.globalAlpha = 1;

  for (const [x, y] of [[78, 78], [1002, 78], [78, h - 78], [1002, h - 78]]) {
    ornament(x, y, 26, gold, 0.9);
  }

  for (let x = 128; x <= 952; x += 56) {
    ornament(x, 58, 7, gold, 0.2);
    ornament(x, h - 58, 7, gold, 0.2);
  }

  ctx.save();
  ctx.fillStyle = dark ? "#111711cc" : "#fffaf0d9";
  ctx.strokeStyle = gold;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(250, 78, 580, 72, 36);
  ctx.fill();
  ctx.stroke();
  ornament(286, 114, 12, gold, 0.8);
  ornament(794, 114, 12, gold, 0.8);
  ctx.restore();
}

function drawFooterPanel(h, gold, dark) {
  const top = h - 212;
  const panel = ctx.createLinearGradient(120, top, 960, h - 54);
  panel.addColorStop(0, dark ? "#0d120ee8" : "#fffaf0e8");
  panel.addColorStop(1, dark ? "#283128e8" : "#f1e6d0e8");

  ctx.save();
  ctx.fillStyle = panel;
  ctx.strokeStyle = gold;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(140, top, 800, 140, 30);
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(230, h - 102);
  ctx.lineTo(850, h - 102);
  ctx.stroke();
  ctx.restore();

  ornament(174, top + 34, 13, gold, 0.8);
  ornament(906, top + 34, 13, gold, 0.8);
}

// رسم التصميم
function render() {
  let h = {
    square: 1080,
    portrait: 1350,
    story: 1920
  }[$("size").value];

  canvas.width = 1080;
  canvas.height = h;
  shareFile = null;
  shareFilePromise = null;
  shareVersion++;

  $("dimensions").textContent = `1080 × ${h} px`;

  const dark = theme === "dark";

  const bg = dark
    ? "#1d211e"
    : theme === "white"
      ? "#ffffff"
      : "#fcf8ed";

  const ink = dark ? "#f5f0df" : "#292c24";
  const gold = dark ? "#d7b974" : "#a7813b";

  drawPremiumFrame(h, bg, gold, dark);

  // توهّج ناعم خلف النص
  const glow = ctx.createRadialGradient(540, h * 0.4, 40, 540, h * 0.4, 620);
  glow.addColorStop(0, gold + (dark ? "26" : "1c"));
  glow.addColorStop(1, gold + "00");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1080, h);

  ctx.textAlign = "center";
  ctx.direction = "rtl";

  text(
    "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    540,
    126,
    31,
    gold
  );

  // المعاينة الأولية
  if (!current) {
    text(
      "آياتٌ ودعاء لمن نحب",
      540,
      h / 2 - 20,
      52,
      ink
    );

    text(
      "أدخل الاسم، واصنع أثرًا من الدعاء",
      540,
      h / 2 + 45,
      29,
      gold
    );

    return;
  }

  const { s, start, name } = current;

  // ثلاث آيات متتالية
  const verses = s.ayahs
    .slice(start, start + 3)
    .map(
      (a) =>
        a.text + " ﴿" + ar(a.numberInSurah) + "﴾"
    )
    .join(" ");

  const ds = current.prayers.map((prayer, index) =>
    index === 0 ? prayer.render(name) : prayer.render()
  );

  let size = 50;
  let ls;
  let pl;
  let need;
  const budget = h - 495;

  // ضبط حجم الخط ليتسع المحتوى
  do {
    ls = lines(verses, size, 930);

    pl = ds.map((t) => lines(t, size - 1, 930));

    need =
      ls.length * size * 1.65 +
      pl.reduce(
        (n, l) =>
          n + l.length * (size - 1) * 1.55 + 18,
        0
      ) + 72;

    if (need <= budget) break;

    size--;
  } while (size > 16);

  // يترك مسافة مريحة أسفل شريط البسملة والزخرفة العلوية.
  let y = 210;

  // رسم الآيات
  for (const l of ls) {
    text(l, 540, y, size, ink);
    y += size * 1.65;
  }

  // اسم السورة وأرقام الآيات
  text(
    `${s.name} • الآيات ${
      ar(s.ayahs[start].numberInSurah)
    }–${
      ar(s.ayahs[start + 2].numberInSurah)
    }`,
    540,
    y + 12,
    24,
    gold
  );

  y += 44;

  // الخط الفاصل
  for (const [x1, x2] of [[270, 510], [810, 570]]) {
    const g = ctx.createLinearGradient(x1, 0, x2, 0);
    g.addColorStop(0, gold + "00");
    g.addColorStop(1, gold + "cc");
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
  }
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.moveTo(540, y - 9); ctx.lineTo(549, y);
  ctx.lineTo(540, y + 9); ctx.lineTo(531, y);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 1;

  y += 26;

  // عنوان الأدعية
  text(
    female
      ? "اللهم ارحم من اشتقنا إليها"
      : "اللهم ارحم من اشتقنا إليه",
    540,
    y,
    29,
    gold
  );

  // فصل واضح بين عنوان الأدعية وأول دعاء كي لا تتداخل الحروف العربية.
  y += 58;

  // رسم الأدعية الثلاثة
  pl.forEach((l, i) => {
    for (const line of l) {
      text(line, 540, y, size - 1, ink);
      y += (size - 1) * 1.55;
    }

    y += 18;
  });

  drawFooterPanel(h, gold, dark);

  // أسفل التصميم
  text(
    "رحم الله روحًا لا تُنسى",
    540,
    h - 166,
    29,
    gold
  );

  text(
    name,
    540,
    h - 126,
    Math.min(
      37,
      (820 / Math.max(name.length, 1)) * 1.5
    ),
    ink
  );

  text(
    "\u062c\u0645\u064a\u0639\u0020\u0627\u0644\u062d\u0642\u0648\u0642\u0020\u0645\u062d\u0641\u0648\u0638\u0629\u0020SESMA Technology 2006",
    540,
    h - 76,
    15,
    gold
  );

}

// زر إنشاء بوست
$("generate").onclick = make;

// تحديد المتوفى أو المتوفاة
for (const sex of ["male", "female"]) {
  $(sex).onclick = () => {
    female = sex === "female";

    for (const id of ["male", "female"]) {
      $(id).classList.toggle("active", id === sex);
      $(id).setAttribute("aria-pressed", id === sex);
    }

    if (current) {
      const updatedPrayers = prayers(loadHistory());
      if (updatedPrayers) {
        current.prayers = updatedPrayers;
        render();
      }
    }
  };
}

// تغيير ألوان التصميم
document
  .querySelectorAll("[data-theme]")
  .forEach((b) => {
    b.onclick = () => {
      theme = b.dataset.theme;

      document
        .querySelectorAll("[data-theme]")
        .forEach((t) => {
          t.classList.toggle("chosen", t === b);
        });

      render();
    };
  });

// تغيير المقاس
$("size").onchange = render;

// تحديث الاسم في التصميم
$("name").oninput = () => {
  if (current) {
    if (!$("name").value.trim()) {
      $("download").disabled = true;
      $("share").disabled = true;
      return;
    }

    current.name = $("name").value.trim();

    $("download").disabled = false;
    $("share").disabled = false;

    render();
  }
};

// تحويل التصميم إلى صورة PNG
function blob() {
  return new Promise((r) =>
    canvas.toBlob(r, "image/png")
  );
}

// تحميل الصورة
$("download").onclick = async () => {
  const b = await blob();
  const url = URL.createObjectURL(b);
  const a = document.createElement("a");

  a.href = url;
  a.download = `athar-${$("size").value}.png`;
  a.click();

  setTimeout(() => URL.revokeObjectURL(url), 5000);
};

const shareModal = $("share-modal");
const shareNote = $("share-note");
const shareDownload = $("share-download");

const SHARE_TEXT = "آيات ودعاء لمن نحب";

function closeShareModal() {
  shareModal.hidden = true;
}

// يجهّز ملف الصورة مسبقًا حتى تكون المشاركة بضغطة واحدة
function prepareShareFile() {
  if (!shareFilePromise) {
    const version = shareVersion;
    shareFilePromise = blob().then((image) => {
      const file = new File(
        [image],
        `athar-${$("size").value}.png`,
        { type: "image/png" }
      );
      if (version === shareVersion) shareFile = file;
      return file;
    });
  }
  return shareFilePromise;
}

// تجهيز الصورة في الخلفية بعد كل تعديل على التصميم
function scheduleSharePrep() {
  clearTimeout(shareTimer);
  shareTimer = setTimeout(() => {
    if (!$("share").disabled) prepareShareFile().catch(() => {});
  }, 400);
}

function downloadShareFile() {
  const file = shareFile;
  if (!file) return;
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// بديل للمتصفحات التي لا تدعم مشاركة الملفات (مثل الحاسوب)
async function showShareFallback() {
  await prepareShareFile();
  downloadShareFile();
  shareModal.hidden = false;
  shareDownload.hidden = false;
  shareNote.textContent =
    "تم حفظ الصورة على جهازك. اختر المنصة لفتحها، ثم أرفق الصورة المحفوظة.";
}

function openPlatform(platform) {
  const text = encodeURIComponent(SHARE_TEXT);
  const pageUrl = encodeURIComponent(location.href);
  const urls = {
    WhatsApp: `https://wa.me/?text=${text}`,
    Facebook: `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`,
    Instagram: "https://www.instagram.com/"
  };
  if (urls[platform]) window.open(urls[platform], "_blank", "noopener");
  else closeShareModal();
}

// مشاركة بضغطة واحدة: تفتح قائمة المشاركة مباشرة مع الصورة مرفقة
async function shareNow() {
  const btn = $("share");
  navigator.vibrate?.(12);
  let file = shareFile;

  try {
    if (!file) {
      btn.disabled = true;
      $("status").textContent = "جارٍ تجهيز الصورة…";
      file = await prepareShareFile();
    }

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "آيات ودعاء",
        text: SHARE_TEXT
      });
      $("status").textContent = "تمت المشاركة. تقبّل الله منكم.";
      toast("تمت المشاركة. تقبّل الله منكم ✦");
    } else {
      await showShareFallback();
    }
  } catch (e) {
    if (e.name !== "AbortError") {
      $("status").textContent =
        "تعذّرت المشاركة. يمكنك تحميل الصورة ومشاركتها يدويًا.";
      await showShareFallback().catch(() => {});
    }
  } finally {
    if ($("name").value.trim()) btn.disabled = false;
  }
}

$("share").onclick = shareNow;
document.querySelectorAll("[data-share-close]").forEach((button) => {
  button.onclick = closeShareModal;
});
document.querySelectorAll("[data-share-platform]").forEach((button) => {
  button.onclick = () => openPlatform(button.dataset.sharePlatform);
});
shareDownload.onclick = downloadShareFile;


// ===== تحسينات الواجهة =====
function toast(msg) {
  const t = $("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("show"), 2800);
}

// حفظ التفضيلات (بدون الاسم)
const PREF = "athar-prefs";
const savePrefs = () => {
  try {
    localStorage.setItem(PREF, JSON.stringify({ theme, female, size: $("size").value }));
  } catch {}
};
try {
  const p = JSON.parse(localStorage.getItem(PREF) || "null");
  if (p) {
    if (["portrait", "square", "story"].includes(p.size)) $("size").value = p.size;
    if (p.female) $("female").click();
    document.querySelector(`[data-theme="${p.theme}"]`)?.click();
  }
} catch {}
["male", "female"].forEach((id) => $(id).addEventListener("click", savePrefs));
document.querySelectorAll("[data-theme]").forEach((b) => b.addEventListener("click", savePrefs));
$("size").addEventListener("change", savePrefs);

// Enter لإنشاء البوست
$("name").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.isComposing) {
    e.preventDefault();
    $("generate").click();
    $("name").blur();
  }
});

// حركة ظهور المعاينة عند الإنشاء
$("generate").addEventListener("click", () => {
  const wrap = document.querySelector(".canvas-wrap");
  wrap.classList.remove("reveal");
  void wrap.offsetWidth;
  wrap.classList.add("reveal");
  if (!$("name").value.trim()) $("name").classList.add("shake");
  setTimeout(() => $("name").classList.remove("shake"), 500);
});

// إظهار المعاينة الأولية
const _render = render;
render = function () {
  _render.apply(this, arguments);
  scheduleSharePrep();
};
render();
document.fonts?.ready.then(render);

// تحميل بيانات القرآن الكريم
fetch("quran.json")
  .then((r) => {
    if (!r.ok) throw Error();
    return r.json();
  })
  .then((d) => {
    surahs = d.data.surahs.filter(
      (s) => s.ayahs.length >= 3
    );

    for (const s of surahs) {
      let o = document.createElement("option");

      o.value = s.number;
      o.textContent = s.name;

      $("surah").append(o);
    }

    $("status").textContent =
      "جاهز. أدخل الاسم لإنشاء أول بوست.";
  })
  .catch(() => {
    $("status").textContent =
      "تعذّر تحميل النص القرآني. أعد تحميل الصفحة.";

    $("generate").disabled = true;
  });

// الهيدر: يصغر بسلاسة عند التمرير
(() => {
  const header = document.querySelector("header");
  let ticking = false;
  const update = () => {
    header.classList.toggle("scrolled", window.scrollY > 24);
    ticking = false;
  };
  addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();
