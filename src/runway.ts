export interface RunwayCamera {
  travel: number;
  height: number;
  horizon: number;
  speed: number;
}

// Camera looks perpendicular to the aircraft's travel. Surface paint, lamps,
// and puddles all use the same X (forward) and Z (out the window) coordinates.
const vertex = `
attribute vec2 aPoint;
void main() { gl_Position = vec4(aPoint, 0.0, 1.0); }
`;

const fragment = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uSize;
uniform vec4 uCamera;
uniform sampler2D uAsphalt;

float ridge(float distance, float width, float softness) {
  return 1.0 - smoothstep(width, width + softness, abs(distance));
}

vec3 lampRow(vec2 world, float screenY, float z, float spacing, float offset, vec3 tint) {
  float across = mod(world.x + offset + spacing * .5, spacing) - spacing * .5;
  float lampY = uCamera.z + .81 * uCamera.y / z;
  float dx = across * uSize.y / z;
  float dy = (screenY - lampY) * uSize.y;
  float stretch = 1.1 + uCamera.w * 6.4 * (18.0 / z);
  float core = exp(-dot(vec2(dx / stretch, dy * 1.55), vec2(dx / stretch, dy * 1.55)) * .39);
  float glow = exp(-length(vec2(dx / (2.6 + stretch), dy * .72)) * .30);
  float ripple = .5 + .5 * sin(world.y * 27.1 + world.x * 5.1);
  float puddle = step(1.0, dy) * exp(-dy / (3.9 + 390.0 / z)) *
    exp(-abs(dx) * .49) * (.24 + ripple * .76);
  float range = clamp(34.0 / z, .35, 1.0);
  return tint * (core * 1.10 + glow * .29 + puddle * .65) * range;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uSize;
  float y = 1.0 - uv.y;
  float below = y - uCamera.z;
  if (below <= .001) { gl_FragColor = vec4(0.0); return; }
  float z = max(4.0, .81 * uCamera.y / below);
  float x = uCamera.x + (uv.x - .5) * (uSize.x / uSize.y) * z;
  vec2 world = vec2(x, z);
  float aa = clamp(.0018 * z * z / uCamera.y, .06, 3.0);
  vec3 road = texture2D(uAsphalt, world * .092).rgb;
  float broad = texture2D(uAsphalt, world * vec2(.035, .062) + vec2(.19, .48)).r;
  float surface = smoothstep(6.0, 8.0, z) * (1.0 - smoothstep(60.0, 64.0, z));
  vec3 grass = vec3(.024, .055, .064) * (.78 + broad);
  float wetness = smoothstep(.085, .20, broad);
  vec3 pavement = vec3(.025, .052, .077) + road * .43 + wetness * vec3(.027, .053, .071);
  vec3 color = mix(grass, pavement, surface);

  float verge = max(ridge(z - 11.3, .095, aa), ridge(z - 57.3, .095, aa));
  float stripeX = 1.0 - smoothstep(6.3, 6.9, abs(mod(x + 20.0, 40.0) - 20.0));
  float center = stripeX * ridge(z - 33.1, .20, aa);
  float illuminated = .55 + broad * .75;
  color += verge * vec3(.25, .28, .25) * illuminated;
  color += center * vec3(.28, .33, .32) * illuminated;
  color += ridge(z - 7.7, .10, aa) * vec3(.25, .13, .039);

  color += lampRow(world, y, 15.2, 12.0, 3.0, vec3(.27, .90, 1.0));
  color += lampRow(world, y, 29.4, 17.0, 7.0, vec3(.37, .86, 1.0));
  color += lampRow(world, y, 55.2, 20.0, 2.0, vec3(.31, .72, 1.0));
  color += lampRow(world, y, 75.0, 26.0, 12.0, vec3(1.0, .71, .35));

  float haze = smoothstep(48.0, 470.0, z);
  color = mix(color, vec3(.023, .077, .11), haze * .82);
  float opacity = smoothstep(.009, .045, below);
  gl_FragColor = vec4(color, opacity);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

export function createRunway(canvas: HTMLCanvasElement, asphalt: HTMLImageElement) {
  const gl = canvas.getContext('webgl', {
    alpha: true, premultipliedAlpha: false, antialias: false,
    depth: false, stencil: false, powerPreference: 'low-power',
  });
  if (!gl) return null;

  const vert = compile(gl, gl.VERTEX_SHADER, vertex);
  const frag = compile(gl, gl.FRAGMENT_SHADER, fragment);
  if (!vert || !frag) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const point = gl.getAttribLocation(program, 'aPoint');
  gl.enableVertexAttribArray(point);
  gl.vertexAttribPointer(point, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([49, 58, 63, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);
  function loadTexture() {
    if (!gl || gl.isContextLost() || !asphalt.naturalWidth) return;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, asphalt);
    gl.generateMipmap(gl.TEXTURE_2D);
  }
  if (asphalt.complete) loadTexture();
  else asphalt.addEventListener('load', loadTexture, { once: true });

  gl.uniform1i(gl.getUniformLocation(program, 'uAsphalt'), 0);
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), canvas.width, canvas.height);
  gl.viewport(0, 0, canvas.width, canvas.height);
  const cameraLocation = gl.getUniformLocation(program, 'uCamera');

  return {
    draw(camera: RunwayCamera) {
      if (gl.isContextLost()) return;
      gl.uniform4f(cameraLocation, camera.travel, camera.height, camera.horizon, camera.speed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
