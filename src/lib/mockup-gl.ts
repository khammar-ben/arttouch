import { facesOf, type MockupScene } from "./mockup";

/**
 * Même rendu que composeMockup, mais sur la carte graphique : la toile peinte est posée sur la photo
 * en un seul passage, ce qui rend l'aperçu instantané même pendant la frappe.
 */
export type MockupRenderer = {
  setScene(scene: MockupScene, photo: TexImageSource, shade: TexImageSource): void;
  render(art: TexImageSource): void;
};

const MAX_FACES = 2;
const EDGE_CODE = { front: 0, left: 1, right: 2, top: 3, bottom: 4 } as const;

const VERTEX = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D u_photo;
uniform sampler2D u_shade;
uniform sampler2D u_art;
uniform vec2 u_size;
uniform int u_faceCount;
uniform vec3 u_row0[${MAX_FACES}];
uniform vec3 u_row1[${MAX_FACES}];
uniform vec3 u_row2[${MAX_FACES}];
uniform vec3 u_lines[${MAX_FACES * 4}];
uniform int u_edge[${MAX_FACES}];
uniform vec3 u_light;

vec3 toLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 toSrgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }

void main() {
  // Centre du pixel dans le repère de la photo (y vers le bas)
  vec2 p = vec2(gl_FragCoord.x, u_size.y - gl_FragCoord.y);
  vec2 t = p / u_size;
  vec4 photo = texture2D(u_photo, t);
  vec4 shade = texture2D(u_shade, t);
  if (shade.a < 0.5) { gl_FragColor = vec4(photo.rgb, 1.0); return; }

  float best = -1.0e9;
  vec2 st = vec2(0.0);
  for (int f = 0; f < ${MAX_FACES}; f++) {
    if (f >= u_faceCount) break;
    float d = 1.0e9;
    for (int k = 0; k < 4; k++) {
      vec3 l = u_lines[f * 4 + k];
      d = min(d, l.x * p.x + l.y * p.y + l.z);
    }
    if (d > best) {
      best = d;
      vec3 h = vec3(p, 1.0);
      vec2 uv = vec2(dot(u_row0[f], h), dot(u_row1[f], h)) / dot(u_row2[f], h);
      int e = u_edge[f];
      // Les tranches prolongent la couleur du bord correspondant
      if (e == 1) uv.x = 0.0; else if (e == 2) uv.x = 1.0; else if (e == 3) uv.y = 0.0; else if (e == 4) uv.y = 1.0;
      st = clamp(uv, 0.0, 1.0);
    }
  }
  float coverage = clamp(best + 0.5, 0.0, 1.0);
  vec3 art = texture2D(u_art, st).rgb;
  float light = shade.r * (255.0 / 150.0);
  vec3 lit = clamp(toLinear(art) * u_light * light, 0.0, 1.0);
  gl_FragColor = vec4(mix(photo.rgb, toSrgb(lit), coverage), 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

function texture(gl: WebGLRenderingContext, unit: number, filter: number) {
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

function upload(gl: WebGLRenderingContext, unit: number, tex: WebGLTexture | null, source: TexImageSource, raw = false) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  // L'ombrage est une donnée, pas une image : aucune correction de couleur
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, raw ? gl.NONE : gl.BROWSER_DEFAULT_WEBGL);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
}

/**
 * Renvoie null si WebGL n'est pas disponible : l'appelant se replie sur le rendu processeur.
 * onLost est appelé si la carte graphique retire le contexte (veille, trop d'onglets…).
 */
export function createMockupRenderer(canvas: HTMLCanvasElement, onLost: () => void): MockupRenderer | null {
  // preserveDrawingBuffer : l'image reste affichée telle quelle entre deux rendus (rendu à la demande)
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl) return null;
  canvas.addEventListener(
    "webglcontextlost",
    (event) => {
      event.preventDefault();
      onLost();
    },
    { once: true },
  );
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // Un triangle qui couvre tout l'écran
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  const at = (name: string) => gl.getUniformLocation(program, name);
  const photoTex = texture(gl, 0, gl.NEAREST);
  const shadeTex = texture(gl, 1, gl.NEAREST);
  const artTex = texture(gl, 2, gl.LINEAR);
  gl.uniform1i(at("u_photo"), 0);
  gl.uniform1i(at("u_shade"), 1);
  gl.uniform1i(at("u_art"), 2);

  return {
    setScene(scene, photo, shade) {
      const [width, height] = scene.size;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      upload(gl, 0, photoTex, photo);
      upload(gl, 1, shadeTex, shade, true);

      const faces = facesOf(scene).slice(0, MAX_FACES);
      const rows = [new Float32Array(MAX_FACES * 3), new Float32Array(MAX_FACES * 3), new Float32Array(MAX_FACES * 3)];
      const lines = new Float32Array(MAX_FACES * 4 * 3);
      const edges = new Int32Array(MAX_FACES);
      faces.forEach((face, f) => {
        for (let r = 0; r < 3; r++) rows[r].set(face.inv.slice(r * 3, r * 3 + 3), f * 3);
        face.lines.forEach((line, k) => lines.set(line, (f * 4 + k) * 3));
        edges[f] = EDGE_CODE[face.edge];
      });
      gl.uniform2f(at("u_size"), width, height);
      gl.uniform1i(at("u_faceCount"), faces.length);
      gl.uniform3fv(at("u_row0"), rows[0]);
      gl.uniform3fv(at("u_row1"), rows[1]);
      gl.uniform3fv(at("u_row2"), rows[2]);
      gl.uniform3fv(at("u_lines"), lines);
      gl.uniform1iv(at("u_edge"), edges);
      gl.uniform3fv(at("u_light"), scene.tint.map((t) => t * scene.exposure));
    },
    render(art) {
      upload(gl, 2, artTex, art);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
