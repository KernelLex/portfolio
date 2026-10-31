import Phaser from 'phaser';

/**
 * The look pass for the intro: bloom on the neon, CRT scanlines, a vignette,
 * edge chromatic aberration and a whisper of grain.
 *
 * Pixel art without a pass like this reads as a flat image; with it, it reads
 * as a screen. Everything is deliberately understated - the goal is a city
 * seen through glass and rain, not a broken television.
 *
 * WebGL only. The scene checks the renderer before attaching it, so the canvas
 * fallback simply renders without the pass.
 */
const FRAG = /* glsl */ `
precision mediump float;

uniform sampler2D uMainSampler;
uniform vec2 uResolution;
uniform float uTime;

varying vec2 outTexCoord;

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec2 uv = outTexCoord;
  vec2 off = uv - 0.5;
  float r2 = dot(off, off);

  // Chromatic aberration, scaled by distance so the centre stays clean.
  float ca = 0.0024 * r2;
  vec3 col;
  col.r = texture2D(uMainSampler, uv + off * ca).r;
  col.g = texture2D(uMainSampler, uv).g;
  col.b = texture2D(uMainSampler, uv - off * ca).b;

  // Cheap ring-sampled bloom, weighted so only already-bright pixels spill.
  vec2 texel = 1.0 / uResolution;
  vec3 bloom = vec3(0.0);
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 0.5236;
    float radius = 2.5 + mod(float(i), 3.0) * 4.0;
    vec2 d = vec2(cos(a), sin(a)) * radius * texel;
    vec3 s = texture2D(uMainSampler, uv + d).rgb;
    bloom += s * smoothstep(0.34, 0.85, luma(s));
  }
  col += (bloom / 12.0) * 1.7;

  // Scanlines on the authored 270px grid, not the screen's pixel grid, so the
  // spacing stays constant whatever size the canvas is scaled to.
  col *= 1.0 - 0.085 * (0.5 + 0.5 * sin(uv.y * 270.0 * 3.14159265));

  // Vignette.
  col *= 1.0 - r2 * 0.8;

  // Grain, to stop the large flat skies banding.
  float n = fract(sin(dot(uv * uResolution + uTime, vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - 0.5) * 0.016;

  gl_FragColor = vec4(col, 1.0);
}
`;

export class CityPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({ game, name: 'CityPostFX', fragShader: FRAG });
  }

  onPreRender(): void {
    this.set2f('uResolution', this.renderer.width, this.renderer.height);
    this.set1f('uTime', this.game.loop.time * 0.001);
  }
}
