const $ = (id) => document.getElementById(id);

const canvas = $("canvas");
const ctx = canvas.getContext("2d");

let surahs = [];
let female = false;
let theme = "ivory";
let current = null;
let lastKey = "";

const ar = (n) =>
  String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);

const pick = (n) =>
  crypto.getRandomValues(new Uint32Array(1))[0] % n;

// أدعية المتوفى — مأخوذة من ملف "أدعية شاملة للمتوفى"
// m = صيغة المذكر ، f = صيغة المؤنث
// named: يمكن إدخال اسم المتوفى فيه (يُستبدل أول "لَهُ/لَهَا" بالاسم، أو العلامة {n})
const DUAS = [
  {
    named: true,
    m: "اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ، وَعَافِهِ وَاعْفُ عَنْهُ، وَأَكْرِمْ نُزُلَهُ، وَوَسِّعْ مُدْخَلَهُ، وَاغْسِلْهُ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ، وَنَقِّهِ مِنَ الْخَطَايَا كَمَا نَقَّيْتَ الثَّوْبَ الْأَبْيَضَ مِنَ الدَّنَسِ، وَأَبْدِلْهُ دَارًا خَيْرًا مِنْ دَارِهِ، وَأَهْلًا خَيْرًا مِنْ أَهْلِهِ، وَزَوْجًا خَيْرًا مِنْ زَوْجِهِ، وَأَدْخِلْهُ الْجَنَّةَ، وَأَعِذْهُ مِنْ عَذَابِ الْقَبْرِ، أَوْ مِنْ عَذَابِ النَّارِ.",
    f: "اللَّهُمَّ اغْفِرْ لَهَا وَارْحَمْهَا، وَعَافِهَا وَاعْفُ عَنْهَا، وَأَكْرِمْ نُزُلَهَا، وَوَسِّعْ مُدْخَلَهَا، وَاغْسِلْهَا بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ، وَنَقِّهَا مِنَ الْخَطَايَا كَمَا نَقَّيْتَ الثَّوْبَ الْأَبْيَضَ مِنَ الدَّنَسِ، وَأَبْدِلْهَا دَارًا خَيْرًا مِنْ دَارِهَا، وَأَهْلًا خَيْرًا مِنْ أَهْلِهَا، وَزَوْجًا خَيْرًا مِنْ زَوْجِهَا، وَأَدْخِلْهَا الْجَنَّةَ، وَأَعِذْهَا مِنْ عَذَابِ الْقَبْرِ، أَوْ مِنْ عَذَابِ النَّارِ."
  },
  {
    m: "اللَّهُمَّ اغْفِرْ لِحَيِّنَا وَمَيِّتِنَا، وَشَاهِدِنَا وَغَائِبِنَا، وَصَغِيرِنَا وَكَبِيرِنَا، وَذَكَرِنَا وَأُنْثَانَا، اللَّهُمَّ مَنْ أَحْيَيْتَهُ مِنَّا فَأَحْيِهِ عَلَى الْإِسْلَامِ، وَمَنْ تَوَفَّيْتَهُ مِنَّا فَتَوَفَّهُ عَلَى الْإِيمَانِ، اللَّهُمَّ لَا تَحْرِمْنَا أَجْرَهُ، وَلَا تُضِلَّنَا بَعْدَهُ.",
    f: "اللَّهُمَّ اغْفِرْ لِحَيِّنَا وَمَيِّتِنَا، وَشَاهِدِنَا وَغَائِبِنَا، وَصَغِيرِنَا وَكَبِيرِنَا، وَذَكَرِنَا وَأُنْثَانَا، اللَّهُمَّ مَنْ أَحْيَيْتَهُ مِنَّا فَأَحْيِهِ عَلَى الْإِسْلَامِ، وَمَنْ تَوَفَّيْتَهُ مِنَّا فَتَوَفَّهُ عَلَى الْإِيمَانِ، اللَّهُمَّ لَا تَحْرِمْنَا أَجْرَهَا، وَلَا تُضِلَّنَا بَعْدَهَا."
  },
  {
    named: true,
    m: "اللَّهُمَّ إِنَّ {n} فِي ذِمَّتِكَ وَحَبْلِ جِوَارِكَ، فَقِهِ مِنْ فِتْنَةِ الْقَبْرِ وَعَذَابِ النَّارِ، وَأَنْتَ أَهْلُ الْوَفَاءِ وَالْحَقِّ، فَاغْفِرْ لَهُ وَارْحَمْهُ، إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ.",
    f: "اللَّهُمَّ إِنَّ {n} فِي ذِمَّتِكَ وَحَبْلِ جِوَارِكَ، فَقِهَا مِنْ فِتْنَةِ الْقَبْرِ وَعَذَابِ النَّارِ، وَأَنْتَ أَهْلُ الْوَفَاءِ وَالْحَقِّ، فَاغْفِرْ لَهَا وَارْحَمْهَا، إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ."
  },
  {
    m: "اللَّهُمَّ عَبْدُكَ وَابْنُ أَمَتِكَ احْتَاجَ إِلَى رَحْمَتِكَ، وَأَنْتَ غَنِيٌّ عَنْ عَذَابِهِ، إِنْ كَانَ مُحْسِنًا فَزِدْ فِي إِحْسَانِهِ، وَإِنْ كَانَ مُسِيئًا فَتَجَاوَزْ عَنْهُ.",
    f: "اللَّهُمَّ أَمَتُكَ وَبِنْتُ عَبْدِكَ احْتَاجَتْ إِلَى رَحْمَتِكَ، وَأَنْتَ غَنِيٌّ عَنْ عَذَابِهَا، إِنْ كَانَتْ مُحْسِنَةً فَزِدْ فِي إِحْسَانِهَا، وَإِنْ كَانَتْ مُسِيئَةً فَتَجَاوَزْ عَنْهَا."
  },
  {
    named: true,
    m: "اللَّهُمَّ أَنْتَ رَبُّهُ، وَأَنْتَ خَلَقْتَهُ، وَأَنْتَ هَدَيْتَهُ لِلْإِسْلَامِ، وَأَنْتَ قَبَضْتَ رُوحَهُ، وَأَنْتَ أَعْلَمُ بِسِرِّهِ وَعَلَانِيَتِهِ، جِئْنَا شُفَعَاءَ فَاغْفِرْ لَهُ.",
    f: "اللَّهُمَّ أَنْتَ رَبُّهَا، وَأَنْتَ خَلَقْتَهَا، وَأَنْتَ هَدَيْتَهَا لِلْإِسْلَامِ، وَأَنْتَ قَبَضْتَ رُوحَهَا، وَأَنْتَ أَعْلَمُ بِسِرِّهَا وَعَلَانِيَتِهَا، جِئْنَا شُفَعَاءَ فَاغْفِرْ لَهَا."
  },
  {
    named: true,
    m: "اللَّهُمَّ اغْفِرْ لَهُ وَارْفَعْ دَرَجَتَهُ فِي الْمَهْدِيِّينَ، وَاخْلُفْهُ فِي عَقِبِهِ فِي الْغَابِرِينَ، وَاغْفِرْ لَنَا وَلَهُ يَا رَبَّ الْعَالَمِينَ، وَافْسَحْ لَهُ فِي قَبْرِهِ، وَنَوِّرْ لَهُ فِيهِ.",
    f: "اللَّهُمَّ اغْفِرْ لَهَا وَارْفَعْ دَرَجَتَهَا فِي الْمَهْدِيِّينَ، وَاخْلُفْهَا فِي عَقِبِهَا فِي الْغَابِرِينَ، وَاغْفِرْ لَنَا وَلَهَا يَا رَبَّ الْعَالَمِينَ، وَافْسَحْ لَهَا فِي قَبْرِهَا، وَنَوِّرْ لَهَا فِيهِ."
  },
  {
    named: true,
    m: "اللَّهُمَّ ثَبِّتْهُ عِنْدَ السُّؤَالِ، اللَّهُمَّ اغْفِرْ لَهُ وَتَجَاوَزْ عَنْ سَيِّئَاتِهِ.",
    f: "اللَّهُمَّ ثَبِّتْهَا عِنْدَ السُّؤَالِ، اللَّهُمَّ اغْفِرْ لَهَا وَتَجَاوَزْ عَنْ سَيِّئَاتِهَا."
  },
  {
    m: "اللَّهُمَّ جَافِ الْأَرْضَ عَنْ جَنْبَيْهِ، وَصَعِّدْ رُوحَهُ، وَلَقِّهِ مِنْكَ رِضْوَانًا.",
    f: "اللَّهُمَّ جَافِ الْأَرْضَ عَنْ جَنْبَيْهَا، وَصَعِّدْ رُوحَهَا، وَلَقِّهَا مِنْكَ رِضْوَانًا."
  },
  {
    m: "اللَّهُمَّ أَنْزِلْ عَلَى قَبْرِهِ الضِّيَاءَ وَالنُّورَ، وَالْفَسْحَةَ وَالسُّرُورَ، وَجَازِهِ بِالْإِحْسَانِ إِحْسَانًا، وَبِالسَّيِّئَاتِ عَفْوًا وَغُفْرَانًا.",
    f: "اللَّهُمَّ أَنْزِلْ عَلَى قَبْرِهَا الضِّيَاءَ وَالنُّورَ، وَالْفَسْحَةَ وَالسُّرُورَ، وَجَازِهَا بِالْإِحْسَانِ إِحْسَانًا، وَبِالسَّيِّئَاتِ عَفْوًا وَغُفْرَانًا."
  },
  {
    m: "اللَّهُمَّ يَمِّنْ كِتَابَهُ، وَيَسِّرْ حِسَابَهُ، وَثَقِّلْ بِالْحَسَنَاتِ مِيزَانَهُ، وَثَبِّتْ عَلَى الصِّرَاطِ أَقْدَامَهُ، وَأَسْكِنْهُ فِي أَعْلَى الْجَنَّاتِ بِجِوَارِ نَبِيِّكَ وَمُصْطَفَاكَ ﷺ.",
    f: "اللَّهُمَّ يَمِّنْ كِتَابَهَا، وَيَسِّرْ حِسَابَهَا، وَثَقِّلْ بِالْحَسَنَاتِ مِيزَانَهَا، وَثَبِّتْ عَلَى الصِّرَاطِ أَقْدَامَهَا، وَأَسْكِنْهَا فِي أَعْلَى الْجَنَّاتِ بِجِوَارِ نَبِيِّكَ وَمُصْطَفَاكَ ﷺ."
  },
  {
    m: "اللَّهُمَّ إِنَّهُ جَاءَ بِبَابِكَ، وَأَخَذَ بِجَنَابِكَ، فَأَكْرِمْ نُزُلَهُ، وَلَا تُخْزِهِ يَوْمَ يُبْعَثُونَ.",
    f: "اللَّهُمَّ إِنَّهَا جَاءَتْ بِبَابِكَ، وَأَخَذَتْ بِجَنَابِكَ، فَأَكْرِمْ نُزُلَهَا، وَلَا تُخْزِهَا يَوْمَ يُبْعَثُونَ."
  },
  {
    m: "اللَّهُمَّ إِذَا كَانَ مُحْسِنًا فَزِدْ فِي إِحْسَانِهِ، وَإِنْ كَانَ مُسِيئًا فَتَجَاوَزْ عَنْ سَيِّئَاتِهِ، وَلَقِّهِ بِرَحْمَتِكَ الْأَمْنَ مِنْ عَذَابِكَ حَتَّى تَبْعَثَهُ آمِنًا إِلَى جَنَّتِكَ يَا أَرْحَمَ الرَّاحِمِينَ.",
    f: "اللَّهُمَّ إِذَا كَانَتْ مُحْسِنَةً فَزِدْ فِي إِحْسَانِهَا، وَإِنْ كَانَتْ مُسِيئَةً فَتَجَاوَزْ عَنْ سَيِّئَاتِهَا، وَلَقِّهَا بِرَحْمَتِكَ الْأَمْنَ مِنْ عَذَابِكَ حَتَّى تَبْعَثَهَا آمِنَةً إِلَى جَنَّتِكَ يَا أَرْحَمَ الرَّاحِمِينَ."
  },
  {
    m: "اللَّهُمَّ افْسَحْ لَهُ فِي قَبْرِهِ مَدَّ بَصَرِهِ، وَافْرُشْ قَبْرَهُ مِنْ فِرَاشِ الْجَنَّةِ، وَأَعِذْهُ مِنْ عَذَابِ الْقَبْرِ وَجَفَاءِ الْأَرْضِ عَنْ جَنْبَيْهِ.",
    f: "اللَّهُمَّ افْسَحْ لَهَا فِي قَبْرِهَا مَدَّ بَصَرِهَا، وَافْرُشْ قَبْرَهَا مِنْ فِرَاشِ الْجَنَّةِ، وَأَعِذْهَا مِنْ عَذَابِ الْقَبْرِ وَجَفَاءِ الْأَرْضِ عَنْ جَنْبَيْهَا."
  },
  {
    m: "اللَّهُمَّ أَظِلَّهُ تَحْتَ ظِلِّ عَرْشِكَ يَوْمَ لَا ظِلَّ إِلَّا ظِلُّكَ، وَلَا بَاقِيَ إِلَّا وَجْهُكَ، وَاسْقِهِ مِنْ حَوْضِ نَبِيِّكَ شَرْبَةً هَنِيئَةً لَا يَظْمَأُ بَعْدَهَا أَبَدًا.",
    f: "اللَّهُمَّ أَظِلَّهَا تَحْتَ ظِلِّ عَرْشِكَ يَوْمَ لَا ظِلَّ إِلَّا ظِلُّكَ، وَلَا بَاقِيَ إِلَّا وَجْهُكَ، وَاسْقِهَا مِنْ حَوْضِ نَبِيِّكَ شَرْبَةً هَنِيئَةً لَا تَظْمَأُ بَعْدَهَا أَبَدًا."
  },
  {
    m: "اللَّهُمَّ اكْفِهِ كُلَّ هَوْلٍ دُونَ الْجَنَّةِ، وَحُطَّ عَنْهُ وِزْرَهُ، وَارْفَعْ دَرَجَتَهُ، وَاجْعَلْ قَبْرَهُ رَوْضَةً مِنْ رِيَاضِ الْجَنَّةِ، وَلَا تَجْعَلْهُ حُفْرَةً مِنْ حُفَرِ النَّارِ.",
    f: "اللَّهُمَّ اكْفِهَا كُلَّ هَوْلٍ دُونَ الْجَنَّةِ، وَحُطَّ عَنْهَا وِزْرَهَا، وَارْفَعْ دَرَجَتَهَا، وَاجْعَلْ قَبْرَهَا رَوْضَةً مِنْ رِيَاضِ الْجَنَّةِ، وَلَا تَجْعَلْهَا حُفْرَةً مِنْ حُفَرِ النَّارِ."
  },
  {
    m: "اللَّهُمَّ إِنَّهُ حَلَّ بِكَ وَأَنْتَ خَيْرُ مَنْزُولٍ بِهِ، وَأَصْبَحَ فَقِيرًا إِلَى رَحْمَتِكَ وَأَنْتَ غَنِيٌّ عَنْ عَذَابِهِ، فَآتِهِ بِرَحْمَتِكَ الرِّضَا، وَقِهِ فِتْنَةَ الْقَبْرِ وَعَذَابَهُ.",
    f: "اللَّهُمَّ إِنَّهَا حَلَّتْ بِكَ وَأَنْتَ خَيْرُ مَنْزُولٍ بِهِ، وَأَصْبَحَتْ فَقِيرَةً إِلَى رَحْمَتِكَ وَأَنْتَ غَنِيٌّ عَنْ عَذَابِهَا، فَآتِهَا بِرَحْمَتِكَ الرِّضَا، وَقِهَا فِتْنَةَ الْقَبْرِ وَعَذَابَهُ."
  },
  {
    m: "اللَّهُمَّ اجْمَعْنَا بِهِ فِي جَنَّاتِ النَّعِيمِ، وَلَا تَفْتِنَّا بَعْدَهُ، وَلَا تَحْرِمْنَا أَجْرَهُ، وَاغْفِرْ لَنَا وَلَهُ يَا رَبَّ الْعَالَمِينَ.",
    f: "اللَّهُمَّ اجْمَعْنَا بِهَا فِي جَنَّاتِ النَّعِيمِ، وَلَا تَفْتِنَّا بَعْدَهَا، وَلَا تَحْرِمْنَا أَجْرَهَا، وَاغْفِرْ لَنَا وَلَهَا يَا رَبَّ الْعَالَمِينَ."
  },
  {
    m: "اللَّهُمَّ أَوْسِعْ قَبْرَهُ، وَارْحَمْهُ بِرَحْمَتِكَ الْوَاسِعَةِ، وَاكْتُبْهُ مِنَ الشُّهَدَاءِ، وَأَلْحِقْنَا بِهِ فِي جَنَّاتِ النَّعِيمِ.",
    f: "اللَّهُمَّ أَوْسِعْ قَبْرَهَا، وَارْحَمْهَا بِرَحْمَتِكَ الْوَاسِعَةِ، وَاكْتُبْهَا مِنَ الشُّهَدَاءِ، وَأَلْحِقْنَا بِهَا فِي جَنَّاتِ النَّعِيمِ."
  },
  {
    m: "اللَّهُمَّ اجْعَلْ مِنْ فَوْقِهِ نُورًا، وَمِنْ تَحْتِهِ نُورًا، وَعَنْ يَمِينِهِ نُورًا، وَعَنْ يَسَارِهِ نُورًا، وَمِنْ أَمَامِهِ نُورًا، وَمِنْ خَلْفِهِ نُورًا، اللَّهُمَّ اجْعَلْ قَبْرَهُ نُورًا.",
    f: "اللَّهُمَّ اجْعَلْ مِنْ فَوْقِهَا نُورًا، وَمِنْ تَحْتِهَا نُورًا، وَعَنْ يَمِينِهَا نُورًا، وَعَنْ يَسَارِهَا نُورًا، وَمِنْ أَمَامِهَا نُورًا، وَمِنْ خَلْفِهَا نُورًا، اللَّهُمَّ اجْعَلْ قَبْرَهَا نُورًا."
  },
  {
    m: "اللَّهُمَّ بَاعِدْ بَيْنَهُ وَبَيْنَ النَّارِ كَمَا بَاعَدْتَ بَيْنَ الْمَشْرِقِ وَالْمَغْرِبِ، اللَّهُمَّ حَاسِبْهُ بِرَحْمَتِكَ لَا بِأَعْمَالِهِ يَا أَرْحَمَ الرَّاحِمِينَ.",
    f: "اللَّهُمَّ بَاعِدْ بَيْنَهَا وَبَيْنَ النَّارِ كَمَا بَاعَدْتَ بَيْنَ الْمَشْرِقِ وَالْمَغْرِبِ، اللَّهُمَّ حَاسِبْهَا بِرَحْمَتِكَ لَا بِأَعْمَالِهَا يَا أَرْحَمَ الرَّاحِمِينَ."
  }
];

const HISTORY_KEY = "athar-content-history-v1";
const REUSE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_DUA_CHARS = 480;

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

function renderDua(dua, name) {
  const t = female ? dua.f : dua.m;
  if (!name) return t;
  if (t.includes("{n}")) return t.replace("{n}", name);
  return dua.named ? t.replace(/لَهُ|لَهَا/, `لـ${name}`) : t;
}

const plainLength = (t) => t.replace(/[\u064B-\u0652\u0670]/g, "").length;

function prayers(history) {
  const items = DUAS.map((dua, i) => ({
    id: `dua-${i}`,
    dua,
    named: !!dua.named,
    nameOnly: dua.m.includes("{n}"),
    render: (name) => renderDua(dua, name)
  }));

  const usedAt = (it) => history.prayers[it.id] || 0;
  const fresh = items.filter((it) => !isRecent(history, "prayers", it.id));
  const stale = items
    .filter((it) => isRecent(history, "prayers", it.id))
    .sort((a, b) => usedAt(a) - usedAt(b));

  const take = (ok) => {
    const pool = fresh.filter(ok);
    if (pool.length) {
      const it = pool[pick(pool.length)];
      fresh.splice(fresh.indexOf(it), 1);
      return it;
    }
    const old = stale.find(ok);
    if (old) stale.splice(stale.indexOf(old), 1);
    return old;
  };

  const chosen = [take((it) => it.named)];
  const wanted = 2 + pick(2);
  while (chosen.length < wanted) {
    const it = take((x) => !x.nameOnly);
    if (!it) break;
    chosen.push(it);
  }

  const total = chosen.reduce((n, it) => n + plainLength(it.dua.m), 0);
  if (chosen.length === 3 && total > MAX_DUA_CHARS) chosen.pop();

  return chosen;
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

function make() {
  const raw = $("name").value.trim();

  if (!raw) {
    $("status").textContent = "اكتب اسم المتوفى أولًا لإنشاء البوست.";
    $("name").focus();
    return;
  }

  if (!surahs.length) return;

  const selected = $("surah").value;
  const history = loadHistory();
  const verseRun = chooseVerseRun(selected, history);
  const selectedPrayers = prayers(history);

  if (!verseRun || !selectedPrayers) {
    $("status").textContent = "استُنفدت الخيارات الجديدة خلال آخر 30 يومًا. جرّب سورة أخرى أو انتظر انتهاء المدة.";
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

  $("status").textContent = "تم إنشاء بوست جديد. تقبّل الله دعاءكم.";
}

function lines(text, size, width) {
  ctx.font = `500 ${size}px "Amiri", "Noto Naskh Arabic", "Times New Roman", serif`;

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

function text(t, x, y, size, color) {
  ctx.font = `500 ${size}px "Amiri", "Noto Naskh Arabic", "Times New Roman", serif`;
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

function render() {
  let h = {
    square: 1080,
    portrait: 1350,
    story: 1920
  }[$("size").value];

  canvas.width = 1080;
  canvas.height = h;

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

  const glow = ctx.createRadialGradient(540, h * 0.4, 40, 540, h * 0.4, 620);
  glow.addColorStop(0, gold + (dark ? "26" : "1c"));
  glow.addColorStop(1, gold + "00");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1080, h);

  ctx.textAlign = "center";
  ctx.direction = "rtl";

  text("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", 540, 126, 31, gold);

  if (!current) {
    text("آياتٌ ودعاء لمن نحب", 540, h / 2 - 20, 52, ink);
    text("أدخل الاسم، واصنع أثرًا من الدعاء", 540, h / 2 + 45, 29, gold);
    return;
  }

  const { s, start, name } = current;

  const verses = s.ayahs
    .slice(start, start + 3)
    .map((a) => a.text + " ﴿" + ar(a.numberInSurah) + "﴾")
    .join(" ");

  const ds = current.prayers.map((prayer, index) =>
    index === 0 ? prayer.render(name) : prayer.render()
  );

  let size = 50;
  let ls;
  let pl;
  let need;
  const budget = h - 495;

  do {
    ls = lines(verses, size, 930);
    pl = ds.map((t) => lines(t, size - 1, 930));

    need =
      ls.length * size * 1.65 +
      pl.reduce((n, l) => n + l.length * (size - 1) * 1.55 + 18, 0) +
      72;

    if (need <= budget) break;

    size--;
  } while (size > 16);

  let y = 210;

  for (const l of ls) {
    text(l, 540, y, size, ink);
    y += size * 1.65;
  }

  text(
    `${s.name} • الآيات ${ar(s.ayahs[start].numberInSurah)}–${ar(s.ayahs[start + 2].numberInSurah)}`,
    540,
    y + 12,
    24,
    gold
  );

  y += 44;

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

  text(
    female ? "اللهم ارحم من اشتقنا إليها" : "اللهم ارحم من اشتقنا إليه",
    540,
    y,
    29,
    gold
  );

  y += 58;

  pl.forEach((l) => {
    for (const line of l) {
      text(line, 540, y, size - 1, ink);
      y += (size - 1) * 1.55;
    }
    y += 18;
  });

  drawFooterPanel(h, gold, dark);

  text("رحم الله روحًا لا تُنسى", 540, h - 166, 29, gold);
  text(name, 540, h - 126, Math.min(37, (820 / Math.max(name.length, 1)) * 1.5), ink);
  text("جميع الحقوق محفوظة SESMA Technology 2006", 540, h - 76, 15, gold);
}

$("generate").onclick = make;

for (const sex of ["male", "female"]) {
  $(sex).onclick = () => {
    female = sex === "female";

    for (const id of ["male", "female"]) {
      $(id).classList.toggle("active", id === sex);
      $(id).setAttribute("aria-pressed", id === sex);
    }

    if (current) render();
  };
}

document.querySelectorAll("[data-theme]").forEach((b) => {
  b.onclick = () => {
    theme = b.dataset.theme;

    document.querySelectorAll("[data-theme]").forEach((t) => {
      t.classList.toggle("chosen", t === b);
    });

    render();
  };
});

$("size").onchange = render;

$("name").oninput = () => {
  if (current) {
    if (!$("name").value.trim()) {
      $("download").disabled = true;
      return;
    }

    current.name = $("name").value.trim();

    $("download").disabled = false;
  
    render();
  }
};

function blob() {
  return new Promise((r) => canvas.toBlob(r, "image/png"));
}

$("download").onclick = async () => {
  const b = await blob();
  const url = URL.createObjectURL(b);
  const a = document.createElement("a");

  a.href = url;
  a.download = `athar-${$("size").value}.png`;
  a.click();

  setTimeout(() => URL.revokeObjectURL(url), 5000);
};

function toast(msg) {
  const t = $("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("show"), 2800);
}

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

$("name").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.isComposing) {
    e.preventDefault();
    $("generate").click();
    $("name").blur();
  }
});

$("generate").addEventListener("click", () => {
  const wrap = document.querySelector(".canvas-wrap");
  wrap.classList.remove("reveal");
  void wrap.offsetWidth;
  wrap.classList.add("reveal");
  if (!$("name").value.trim()) $("name").classList.add("shake");
  setTimeout(() => $("name").classList.remove("shake"), 500);
});

render();
document.fonts?.ready.then(render);

fetch("quran.json")
  .then((r) => {
    if (!r.ok) throw Error();
    return r.json();
  })
  .then((d) => {
    surahs = d.data.surahs.filter((s) => s.ayahs.length >= 3);

    for (const s of surahs) {
      let o = document.createElement("option");
      o.value = s.number;
      o.textContent = s.name;
      $("surah").append(o);
    }

    $("status").textContent = "جاهز. أدخل الاسم لإنشاء أول بوست.";
  })
  .catch(() => {
    $("status").textContent = "تعذّر تحميل النص القرآني. أعد تحميل الصفحة.";
    $("generate").disabled = true;
  });

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
/* ---- native feel: splash, haptics, ripple, reveal ---- */
(() => {
  document.documentElement.classList.add("js");
  const buzz = (n = 10) => navigator.vibrate?.(n);
  setTimeout(() => $("splash")?.classList.add("out"), 3000);
  document.addEventListener("pointerdown", (e) => {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    buzz(8);
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
    const s = document.createElement("span");
    s.className = "rp";
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(s);
    setTimeout(() => s.remove(), 600);
  });
  $("generate").addEventListener("click", () => {
    $("generate").classList.add("done");
    buzz([12, 40, 12]);
  });
  const io = new IntersectionObserver((es) => es.forEach((x) => x.isIntersecting && x.target.classList.add("in")), { threshold: 0.08 });
  document.querySelectorAll(".card,.preview,.foot").forEach((el, i) => {
    el.classList.add("rv");
    el.style.transitionDelay = i * 70 + "ms";
    io.observe(el);
  });
  const hdr = document.querySelector("header");
  addEventListener("scroll", () => hdr.classList.toggle("scrolled", scrollY > 24), { passive: true });
})();

/* ---- v4: size chips, clear, viewer, save toast ---- */
(() => {
  const sel = $("size"), chips = document.querySelectorAll("[data-size]");
  const sync = () => chips.forEach((c) => c.classList.toggle("on", c.dataset.size === sel.value));
  chips.forEach((c) => c.addEventListener("click", () => {
    sel.value = c.dataset.size;
    sel.dispatchEvent(new Event("change"));
    sync();
  }));
  sel.addEventListener("change", sync);
  sync();
  $("clearName").addEventListener("click", () => {
    $("name").value = "";
    $("name").dispatchEvent(new Event("input"));
    $("name").focus();
  });
  $("canvas").addEventListener("click", () => {
    const v = document.createElement("div");
    v.id = "viewer";
    v.innerHTML = `<img alt="معاينة"><span>×</span>`;
    v.firstChild.src = $("canvas").toDataURL("image/png");
    v.onclick = () => v.remove();
    document.body.appendChild(v);
  });
  $("download").addEventListener("click", () => {
    navigator.vibrate?.([10, 30, 10]);
    toast("تم حفظ الصورة ✓");
  });
})();

/* offline fonts: make sure canvas has them before first render */
Promise.all(["700 20px Amiri","400 20px Amiri","500 20px 'Noto Naskh Arabic'","700 20px 'Noto Naskh Arabic'"].map((f) => document.fonts.load(f, "أثر"))).then(() => render()).catch(() => {});
