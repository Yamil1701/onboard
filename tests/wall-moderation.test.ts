import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { checkFootprint } from '../src/wall-moderation.ts';

test('lets Spanish and French reflections through without substring false positives', () => {
  for (const message of ['Aprender juntos', 'Merci pour cette belle expérience !', 'La computadora y los materiales me ayudaron.', 'Disfruté equivocarme y aprender.', 'Un viaje hermoso ✨']) {
    const result=checkFootprint(message); assert.equal(result.ok,true,message);
    if(result.ok) assert.equal(result.status,'approved',message);
  }
});
test('rejects common insults, leetspeak, punctuation, accents and invisible separators', () => {
  for (const message of ['sos un pelotudo', 'p.u.t.a', 'p u t o', 'm13rd4', 'b\u200boludo', 'hijo de puta', 'connard', 'enculé', 'fuck you', 'te voy a matar', 'puuutaaa', 'p*uta', 'mier.da', 'imbécil']) assert.equal(checkFootprint(message).ok,false,message);
});
test('blocks links, personal contact data, markup and spam', () => {
  for(const message of ['https://mal.example', 'contacto@example.com', 'Llamame 387 555 1234', '<img src=x>', 'aaaaaaaaaaaa', 'hola hola hola hola hola']) assert.equal(checkFootprint(message).ok,false,message);
});
test('rejects uncertain masked content rather than waiting for manual review and validates length limits', () => {
  const result=checkFootprint('sos un p***ta'); assert.equal(result.ok,false);
  for(const message of ['', 'x', 'a'.repeat(161)]) assert.equal(checkFootprint(message).ok,false);
  const message='Una experiencia '.repeat(10).trim(); assert.equal(checkFootprint(message).ok,true);
});
