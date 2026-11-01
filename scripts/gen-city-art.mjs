#!/usr/bin/env node
/**
 * Draws the intro: the neon street, the cyber cafe inside, and the player.
 *
 * Every pixel in /public/assets/intro/ comes out of scripts/art/ - there is no
 * third-party art in the project, nothing to license and nothing to credit.
 *
 * What makes it read as pixel art rather than as a rendered gradient:
 *   - a fixed palette of 5-step ramps, with every colour snapped to one of them
 *   - ordered (Bayer 8x8) dithering wherever a value crosses between two steps
 *   - buildings assembled from hand-authored archetypes, not random rectangles
 *   - sprites drawn, then rim-lit, then outlined
 *
 *   npm run assets:intro
 *   node scripts/gen-city-art.mjs --preview=8 --out=<dir> [--only=player]
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { upscale } from './art/core.mjs';
import * as street from './art/street.mjs';
import * as people from './art/characters.mjs';
import * as cafe from './art/cafe.mjs';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'intro');

const assets = {
  // the street
  'sky.png': street.sky,
  'skyline.png': street.skyline,
  'buildings.png': street.buildings,
  'cables.png': street.cables,
  'street.png': street.street,
  'props.png': street.props,
  'cafe-front.png': street.cafeFront,
  'door.png': street.door,
  'billboard.png': street.billboard,
  'rickshaw.png': street.rickshaw,
  'note.png': street.note,
  'glow.png': street.glow,
  // the player
  'player-idle.png': people.playerIdle,
  'player-walk.png': people.playerWalk,
  'player-jump.png': people.playerJump,
  'player-sit.png': people.playerSit,
  // inside the cafe
  'cafe-wall.png': cafe.cafeWall,
  'cafe-desk.png': cafe.desk,
  'cafe-chair.png': cafe.chair,
  'cafe-npc.png': cafe.npcs,
  'cafe-counter.png': cafe.counter,
  'cafe-fan.png': cafe.fan,
  'cafe-decor.png': cafe.decor,
};

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith('--' + name + '='));
  return hit ? hit.slice(name.length + 3) : null;
};

const previewScale = Number(arg('preview')) || 0;
const previewDir = arg('out');
const only = arg('only');

mkdirSync(OUT_DIR, { recursive: true });
if (previewScale && previewDir) mkdirSync(previewDir, { recursive: true });

let total = 0;
let count = 0;
for (const [name, make] of Object.entries(assets)) {
  if (only && !name.startsWith(only)) continue;
  const img = make();
  const buf = img.png();
  writeFileSync(join(OUT_DIR, name), buf);
  total += buf.length;
  count += 1;
  console.log(
    '  ' + name.padEnd(20) + (img.w + 'x' + img.h).padEnd(10) + (buf.length / 1024).toFixed(1) + ' kB',
  );
  if (previewScale && previewDir) {
    writeFileSync(join(previewDir, name), upscale(img, previewScale).png());
  }
}
console.log('\n' + count + ' assets, ' + (total / 1024).toFixed(1) + ' kB total');
