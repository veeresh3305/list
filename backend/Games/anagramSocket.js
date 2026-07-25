// --- Data: 50 Pre-existing Daily Anagram Prompts ---
const ANAGRAM_DATASET = [
  { id: 1,  scrambled: "LISTEN", baseWord: "LISTEN", validWords: ["SILENT", "INLETS", "ENLIST", "TINSEL", "LISTEN", "ELITES", "TILES", "INLET", "STEEL", "STILE", "STEIN", "LENTS", "TINES", "UNITS", "LINE", "SITE", "TIES", "NEST", "NETS", "LINT", "LITS", "LENS", "TIEL"] },
  { id: 2,  scrambled: "MASTER", baseWord: "MASTER", validWords: ["STREAM", "TAMERS", "SMART", "STEAM", "TEAMS", "TERMS", "MEATS", "MATES", "RATES", "TARES", "STARE", "TEARS", "SEAM", "TERM", "TEAM", "MEAT", "REST", "RATE", "RATS", "SEAT", "ARTS", "MAST", "STAR"] },
  { id: 3,  scrambled: "PLANET", baseWord: "PLANET", validWords: ["PLANTE", "PANEL", "PLANT", "PLEAT", "PETAL", "PLANE", "LEANT", "PLATE", "TALON", "PALE", "PEAT", "LEAP", "PLAN", "PLAT", "NEAT", "LANE", "LATE", "TAPE", "PEAL", "PANEL", "PANT", "PAST"] },
  { id: 4,  scrambled: "SILENT", baseWord: "SILENT", validWords: ["LISTEN", "ENLIST", "INLETS", "TINSEL", "TILES", "INLET", "STEIN", "STILE", "TINES", "LENTS", "LINE", "LINT", "LENS", "SITE", "NEST", "NETS", "TIES", "LIST", "SLIT", "TIEL"] },
  { id: 5,  scrambled: "TARGET", baseWord: "TARGET", validWords: ["GATTER", "GARTEN", "GRATE", "GREAT", "TEAR", "RATE", "GATE", "GEAR", "RAGE", "AGED", "TART", "GETS", "TAGS", "GRAT", "TEAT", "RAGE", "TARE"] },
  { id: 6,  scrambled: "GARAGE", baseWord: "GARAGE", validWords: ["AGREE", "AERAG", "RAGE", "GEAR", "AGAR", "AREA", "GALE", "RAGE", "GARE"] },
  { id: 7,  scrambled: "STATION", baseWord: "STATION", validWords: ["ASTON", "SATIN", "STAIT", "STAIN", "TAINT", "OATIS", "ANTI", "INTO", "OATS", "IONS", "SOT", "NOT", "TIN", "TON", "SIN", "SIT", "TAN"] },
  { id: 8,  scrambled: "DANGER", baseWord: "DANGER", validWords: ["GARDEN", "RANGED", "GANDER", "GRANDE", "RANGE", "ANGER", "GRADE", "GRAND", "READ", "DEAR", "DARE", "GEAR", "RAGE", "EARN", "NEAR", "BANE", "AGED"] },
  { id: 9,  scrambled: "RESCUE", baseWord: "RESCUE", validWords: ["SECURE", "CERUS", "CURSE", "RECUR", "CRUSE", "CURE", "USER", "SURE", "RUSE", "SEER", "RUE", "CUR", "SEE", "USE"] },
  { id: 10, scrambled: "CRADLE", baseWord: "CRADLE", validWords: ["CREAL", "ALDER", "CLEAR", "CALER", "LACE", "RACE", "ACRE", "DARE", "DEAR", "CARD", "READ", "CARE", "LARD", "LEAD", "DEAL"] },
  { id: 11, scrambled: "MONKEY", baseWord: "MONKEY", validWords: ["MONK", "YOKE", "OMEN", "CONE", "MONY", "YEN", "ONE", "KEY", "EON"] },
  { id: 12, scrambled: "SQUARE", baseWord: "SQUARE", validWords: ["SQUAR", "AQUES", "SQUARE", "SQUAT", "RAGE", "SURE", "USER", "ARSE", "SEAR", "RUSE", "QUAD"] },
  { id: 13, scrambled: "DESERT", baseWord: "DESERT", validWords: ["RESTED", "DETER", "RESET", "STEER", "REEST", "TERSE", "TREED", "DEER", "REST", "REED", "SEER", "TREES", "SEED"] },
  { id: 14, scrambled: "FOREST", baseWord: "FOREST", validWords: ["FOSTER", "SOFTER", "FORTE", "FORES", "FORT", "ROSE", "SOFT", "SORE", "FROST", "STORE", "FRET", "ROTE", "REST"] },
  { id: 15, scrambled: "FLOWER", baseWord: "FLOWER", validWords: ["REFLOW", "WOLFER", "LOWER", "ROWEL", "FLOW", "WOLF", "ROLE", "LORE", "LROW", "FOWL", "FROE"] },
  { id: 16, scrambled: "BRIGHT", baseWord: "BRIGHT", validWords: ["GIRTH", "RIGHT", "BRIT", "GRIT", "GIRT", "THIR", "BRIG"] },
  { id: 17, scrambled: "SPRING", baseWord: "SPRING", validWords: ["PRINGS", "RINGS", "PING", "RING", "GRIN", "SPIN", "SNIP", "SING", "GIRN"] },
  { id: 18, scrambled: "PENCIL", baseWord: "PENCIL", validWords: ["PLECIN", "PENIC", "LICE", "LINE", "PILE", "PINE", "LIP", "PEN", "NIL", "PIN", "LIE", "ICE"] },
  { id: 19, scrambled: "CASTLE", baseWord: "CASTLE", validWords: ["CLEATS", "CASTLE", "SCALE", "STALE", "TALES", "TEALS", "LACES", "CASTE", "CLEAT", "LEAST", "TALCS", "ACTS", "CATS", "LACE", "LATE", "TALE", "SEAT", "EAST", "LAST", "SALT"] },
  { id: 20, scrambled: "BRIDGE", baseWord: "BRIDGE", validWords: ["REDIG", "RIDGE", "DIRGE", "BIRD", "RIDE", "DIRE", "GRID", "BIDE", "BRED", "BERG"] },
  { id: 21, scrambled: "PIRATE", baseWord: "PIRATE", validWords: ["PARTIE", "PIRATE", "TEAPIR", "TAPIR", "PARTI", "PRATE", "TALIP", "TAPE", "PART", "PAIR", "TIER", "RITE", "PEAT", "PIER", "RIPT"] },
  { id: 22, scrambled: "CAMERA", baseWord: "CAMERA", validWords: ["CERAMA", "CREAM", "AMACE", "ARACE", "ACRE", "RACE", "CARE", "CAME", "ACME", "AMER", "AREA"] },
  { id: 23, scrambled: "BORDER", baseWord: "BORDER", validWords: ["REBORD", "ROBED", "ORDER", "BORER", "BORED", "ROBE", "BORE", "BRED", "RODE", "DRONE"] },
  { id: 24, scrambled: "GARDEN", baseWord: "GARDEN", validWords: ["DANGER", "RANGED", "GANDER", "GRANDE", "RANGE", "ANGER", "GRADE", "GRAND", "READ", "DEAR", "DARE", "GEAR", "RAGE", "EARN", "NEAR", "BANE", "AGED"] },
  { id: 25, scrambled: "FLIGHT", baseWord: "FLIGHT", validWords: ["LIGHT", "FILTH", "LIFT", "GIFT", "GILT", "FILT", "HILT"] },
  { id: 26, scrambled: "ACTION", baseWord: "ACTION", validWords: ["CATION", "ACORN", "COATI", "ONCIA", "COIN", "ICON", "ANTI", "INTO", "COAT", "ACTO"] },
  { id: 27, scrambled: "POCKET", baseWord: "POCKET", validWords: ["COPTE", "COPED", "POKE", "COPE", "PECK", "COPT", "KEPT", "TOP"] },
  { id: 28, scrambled: "BOTTLE", baseWord: "BOTTLE", validWords: ["BOTTEL", "LOBTE", "LOTT", "BOLT", "BLOT", "TOLL", "BOTE", "LOB", "BET", "LOT"] },
  { id: 29, scrambled: "RIVER",  baseWord: "RIVER",  validWords: ["RIVER", "RIVER", "RIVE", "RERUN", "RIVE", "VERI", "REV"] },
  { id: 30, scrambled: "CANDLE", baseWord: "CANDLE", validWords: ["LANCE", "CLEAN", "ACNED", "CANED", "LACE", "LEND", "LAND", "CANE", "ACNE", "LEAD", "DEAL", "ELAN"] },
  { id: 31, scrambled: "FROZEN", baseWord: "FROZEN", validWords: ["FRONE", "ZONER", "FORE", "ZONE", "FERN", "FROE", "ZERO"] },
  { id: 32, scrambled: "HAMMER", baseWord: "HAMMER", validWords: ["MAHER", "HAREM", "RAMME", "HAME", "HARE", "HEAR", "MARE", "TAME", "HERM"] },
  { id: 33, scrambled: "GUITAR", baseWord: "GUITAR", validWords: ["RAGUT", "TRIGA", "AGUTI", "GRAT", "GIRT", "GUTA", "TRIG", "TAUR", "AIRT"] },
  { id: 34, scrambled: "DRAGON", baseWord: "DRAGON", validWords: ["GROAN", "RADON", "ORGAN", "DORN", "ROAN", "DRAG", "GRAD", "GOAD", "ROAD", "DANG"] },
  { id: 35, scrambled: "PRINCE", baseWord: "PRINCE", validWords: ["CREPIN", "PINCER", "REPINE", "RICE", "PINE", "PRICE", "RIPEN", "NICE", "PIER", "PERC"] },
  { id: 36, scrambled: "ORANGE", baseWord: "ORANGE", validWords: ["ONAGER", "GROAN", "RANGE", "ANGER", "ORGAN", "GEAR", "RAGE", "EARN", "NEAR", "GONE", "ROAN", "OGRE"] },
  { id: 37, scrambled: "PURPLE", baseWord: "PURPLE", validWords: ["PULPER", "PURPLE", "LUPER", "PULP", "PERP", "RULE", "LURE", "PURE", "PERU"] },
  { id: 38, scrambled: "YELLOW", baseWord: "YELLOW", validWords: ["YOWLE", "YELOW", "WELL", "YELL", "WOLL", "YOW", "LWE", "LOW"] },
  { id: 39, scrambled: "BREEZE", baseWord: "BREEZE", validWords: ["BREEZ", "BEER", "ZEBU", "BEZE", "BEE", "ZER"] },
  { id: 40, scrambled: "SHADOW", baseWord: "SHADOW", validWords: ["WHOAD", "WASHO", "WOADS", "DASH", "SHOW", "SODA", "WASH", "WHOA", "SHAD"] },
  { id: 41, scrambled: "SUMMER", baseWord: "SUMMER", validWords: ["MMUSE", "MUSER", "MEMU", "SURE", "RUSE", "USER", "SEUM", "MUM", "RUM"] },
  { id: 42, scrambled: "WINTER", baseWord: "WINTER", validWords: ["TINER", "TWINE", "INTER", "TINER", "REWIN", "WIRE", "TIRE", "RITE", "TWIN", "RENT", "TIER", "WENT", "WINE"] },
  { id: 43, scrambled: "ISLAND", baseWord: "ISLAND", validWords: ["AILND", "SNAIL", "SLAND", "LADIN", "LAND", "SAIL", "NAIL", "LADS", "LID", "AID", "AND", "SAD", "SIN"] },
  { id: 44, scrambled: "MIRROR", baseWord: "MIRROR", validWords: ["ROIRR", "MIRR", "ROIM", "MRO", "RIM", "ROM"] },
  { id: 45, scrambled: "JUNGLE", baseWord: "JUNGLE", validWords: ["GLEN", "LUNG", "JUNE", "GLUE", "NUG", "LUG", "JUG", "GEL"] },
  { id: 46, scrambled: "SHELTER",baseWord: "SHELTER",validWords: ["RESET", "STEEL", "STALE", "TEELS", "SHEER", "TERSE", "EELS", "HERL", "REST", "LEET", "HEEL", "TREE"] },
  { id: 47, scrambled: "DOCTOR", baseWord: "DOCTOR", validWords: ["CORD", "ODOR", "ROOT", "TROD", "CORT", "OTTO", "COO", "TOO", "COT", "DOT"] },
  { id: 48, scrambled: "ROCKET", baseWord: "ROCKET", validWords: ["CORTK", "RECKO", "ROCKE", "CORKE", "CORK", "ROCK", "ROTE", "COTE", "ROKE", "TREK", "KORE"] },
  { id: 49, scrambled: "BEACH",  baseWord: "BEACH",  validWords: ["BEACH", "ACHE", "EACH", "BACH", "BEE", "ACE", "BAC"] },
  { id: 50, scrambled: "CIRCUS", baseWord: "CIRCUS", validWords: ["CRICU", "CRUSI", "CICS", "CRUS", "CURS", "SUIC", "SIC", "CUR"] }
];

// Helper: Pick a prompt deterministically based on today's date
function getDailyAnagramPrompt() {
  const today = new Date();
  const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const promptIndex = dateSeed % ANAGRAM_DATASET.length;
  return ANAGRAM_DATASET[promptIndex];
}

module.exports = function handleAnagramSockets(io) {
  io.on('connection', (socket) => {
    
    // 1. Send Daily Challenge Prompt
    socket.on('get_daily_anagram', () => {
      const dailyPrompt = getDailyAnagramPrompt();
      socket.emit('anagram_daily_data', {
        id: dailyPrompt.id,
        scrambled: dailyPrompt.scrambled,
        length: dailyPrompt.scrambled.length,
        totalPossibleWords: dailyPrompt.validWords.length
      });
    });

    // 2. Validate Word Input
    socket.on('submit_anagram_word', ({ promptId, word }) => {
      const prompt = ANAGRAM_DATASET.find(p => p.id === promptId) || getDailyAnagramPrompt();
      const cleanWord = (word || "").trim().toUpperCase();

      if (!cleanWord) return;

      const isValid = prompt.validWords.includes(cleanWord);

      socket.emit('anagram_word_result', {
        word: cleanWord,
        isValid
      });
    });
  });
};