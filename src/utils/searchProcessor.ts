import { distance } from "fastest-levenshtein";

export const STOP_WORDS = [
  "for",
  "with",
  "the",
  "a",
  "an",
  "of",
  "to",
  "and",
  "or",
  "in",
  "on",
  "at",
  "by",
  "from",
];

export const SEARCH_PHRASES = [
  "black onyx",
  "white gold",
  "yellow gold",
  "rose gold",
  "sterling silver",
  "925 silver",
  "natural diamond",
  "lab diamond",
  "fresh water pearl",
  "moissanite diamond",
];

export const SEARCH_SYNONYMS: Record<string, string[]> = {
  ring: ["rings", "band", "bands"],

  earring: ["earrings"],

  bracelet: ["bracelets", "bangle", "bangles"],

  necklace: ["necklaces"],
};

export function normalizeWord(word: string) {
  word = word.toLowerCase().trim();

  if (word.length > 4 && word.endsWith("ies")) {
    return word.slice(0, -3) + "y";
  }

  if (word.length > 4 && /(ches|shes|xes|zes|sses)$/.test(word)) {
    return word.slice(0, -2);
  }

  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) {
    return word.slice(0, -1);
  }

  return word;
}

export function extractPhrases(query: string) {
  const found: string[] = [];

  let remaining = query.toLowerCase();

  for (const phrase of SEARCH_PHRASES) {
    const regex = new RegExp(`\\b${phrase.replace(/\s+/g, "\\s+")}\\b`, "i");

    if (regex.test(remaining)) {
      found.push(phrase);

      remaining = remaining.replace(regex, " ");
    }
  }

  return {
    phrases: found,
    remaining,
  };
}

export function removeStopWords(words: string[]) {
  return words.filter((word) => !STOP_WORDS.includes(word));
}

export function expandSynonyms(words: string[]) {
  const result = new Set<string>();

  for (const word of words) {
    const normalizedWord = normalizeWord(word);

    result.add(normalizedWord);

    for (const [key, values] of Object.entries(SEARCH_SYNONYMS)) {
      const normalizedKey = normalizeWord(key);

      if (normalizedKey === normalizedWord) {
        result.add(normalizedKey);

        values.map(normalizeWord).forEach((v) => result.add(v));
      }

      if (values.map(normalizeWord).includes(normalizedWord)) {
        result.add(normalizedKey);

        values.map(normalizeWord).forEach((v) => result.add(v));
      }
    }
  }

  return [...result];
}

export function processSearchQuery(query: string) {
  query = query.toLowerCase().trim();

  const phraseData = extractPhrases(query);

  const normalizedPhrases = phraseData.phrases.map((phrase) =>
    phrase.split(/\s+/).map(normalizeWord).join(" "),
  );

  let words = phraseData.remaining
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeWord);

  words = removeStopWords(words);

  words = expandSynonyms(words);

  const phraseTokens = normalizedPhrases.flatMap((phrase) => [
    phrase,
    ...phrase.split(" "),
  ]);

  const allTokens = [...phraseTokens, ...words];

  const normalizedQuery = [...normalizedPhrases, ...words].join(" ");

  return {
    normalizedQuery,

    phraseTokens,

    wordTokens: words,

    allTokens: [...new Set(allTokens)],
  };
}






export const SEARCH_DICTIONARY = [

    "ring",
    "earring",
    "bracelet",
    "necklace",
    "pendant",

    "silver",
    "sterling",
    "gold",
    "white",
    "yellow",
    "rose",

    "diamond",
    "moissanite",
    "onyx",
    "pearl",

    "women",
    "men",
    "kids",

    "925",

    "lab",
    "natural"

];

export function correctWord(word: string) {

    if (word.length <= 2) {
        return word;
    }

    let bestWord = word;
    let bestDistance = Infinity;

    for (const dictWord of SEARCH_DICTIONARY) {

        const d = distance(word, dictWord);

        if (d < bestDistance) {

            bestDistance = d;
            bestWord = dictWord;

        }

    }

    if (bestDistance <= 2) {
        return bestWord;
    }

    return word;

}

export function correctSearchQuery(query: string) {

    return query
        .split(/\s+/)
        .map(correctWord)
        .join(" ");

}
