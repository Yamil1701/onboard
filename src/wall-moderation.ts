export type WallCheck = { ok: false; reason: 'length' | 'links' | 'language' | 'spam' } | { ok: true; message: string; status: 'approved' | 'pending' };

export function checkFootprint(value: unknown): WallCheck {
  if (typeof value !== 'string') return { ok: false, reason: 'length' };
  const message = value.normalize('NFKC').replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '').replace(/\s+/gu, ' ').trim();
  if (Array.from(message).length < 2 || Array.from(message).length > 160) return { ok: false, reason: 'length' };
  if (/(?:https?:|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b[\w-]+\.(?:com|net|org|io|co|ar|fr|xyz|ru)\b|(?:\d[\s().+-]*){7,})/iu.test(message)) return { ok: false, reason: 'links' };
  if (/[<>]/u.test(message)) return { ok: false, reason: 'links' };
  let normalized = message.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[0134578@$!]/g, c => ({ '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i' })[c]!)
    .replace(/[^a-z]/g, ' ');
  normalized = normalized.replace(/\b(?:[a-z][\s]+){2,}[a-z]\b/g, part => part.replace(/\s/g, ''));
  const badWords = /\b(?:put[oa]s?|putitos?|putitas?|mierdas?|carajos?|bolud[oa]s?|pelotud[oa]s?|forr[oa]s?|conch[au](?:s)?|culiad[oa]s?|culos?|zorras?|imbecil(?:es)?|idiotas?|estupid[oa]s?|cogete|cojete|chupala|mogolic[oa]s?|maricones?|maricon|pendej[oa]s?|pijas?|vergas?|porno(?:grafia)?|matate|suicidate|merdes?|putain|putes?|connards?|connasses?|encules?|salope?s?|nique|fuck(?:ing|er|ers)?|shit|bitch(?:es)?|cunts?)\b/;
  const disguised = message.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/(?<=\p{L})[*#_.-]+(?=\p{L})/gu,'');
  const compact = normalized.replace(/\s/g, '');
  if (badWords.test(disguised) || badWords.test(normalized) || badWords.test(normalized.replace(/([a-z])\1+/g,'$1')) || /(?:hij[oa]s?deputa|andatealamierda|tevoyamatar|suce(?:ma|la)bite|vastefaire)/.test(compact)) return { ok: false, reason: 'language' };
  if (/(.)\1{6,}/iu.test(message) || /\b(\p{L}{2,})(?:\s+\1){4,}\b/iu.test(message)) return { ok: false, reason: 'spam' };
  // Disguised words and unsupported scripts wait for the owner's review.
  const doubtful = /\p{L}[*#_]{2,}\p{L}/u.test(message) || !/[a-z]/i.test(normalized)
    || /[^\p{Script=Latin}\p{M}\p{N}\p{P}\p{Z}\p{Extended_Pictographic}\uFE0F\u200D]/u.test(message);
  return { ok: true, message, status: doubtful ? 'pending' : 'approved' };
}
