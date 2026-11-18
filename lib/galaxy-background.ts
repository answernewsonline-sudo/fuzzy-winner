// Galactic drift behind the masthead. WebGL; silently does nothing where it is unavailable.
const VERT = "attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}";

const FRAG = [
  "precision mediump float;",
  "uniform vec2 u_res;",
  "uniform float u_time;",
  "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}",
  "float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);}",
  "float fbm(vec2 p){float v=0.0;float a=0.5;for(int k=0;k<5;k++){v+=a*noise(p);p*=2.03;a*=0.5;}return v;}",
  "float layer(vec2 p,float d,float r,float t){vec2 g=floor(p*d);vec2 f=fract(p*d);float h=hash(g);if(h<0.55){return 0.0;}vec2 c=vec2(hash(g+1.37),hash(g+7.13));float s=length(f-c);float tw=0.5+0.5*sin(t*1.7+h*63.0);return tw*(1.0-smoothstep(r*0.2,r,s));}",
  "void main(){",
  "vec2 uv=gl_FragCoord.xy/u_res;",
  "float ar=u_res.x/max(u_res.y,1.0);",
  "vec2 p=vec2(uv.x*ar,uv.y);",
  "float t=u_time;",
  "vec2 q=p*2.1+vec2(t*0.013,t*0.007);",
  "float n=fbm(q+fbm(q*1.8+t*0.021));",
  "n=smoothstep(0.36,0.95,n);",
  "vec3 col=vec3(0.07,0.10,0.30)*n*0.85;",
  "col+=vec3(0.26,0.07,0.32)*n*n*0.7;",
  "float s=layer(p+vec2(t*0.006,0.0),40.0,0.13,t)*1.0;",
  "s+=layer(p+vec2(t*0.012,0.0),70.0,0.11,t*1.4)*0.75;",
  "s+=layer(p+vec2(t*0.020,0.0),112.0,0.09,t*0.9)*0.5;",
  "col+=vec3(0.86,0.91,1.0)*s;",
  "float vg=1.0-smoothstep(0.30,1.15,length((uv-0.5)*vec2(1.0,1.7)));",
  "col*=vg;",
  "gl_FragColor=vec4(col,1.0);",
  "}"
].join("\n");

export function initGalaxy(host: HTMLElement | null) {
  if (!host) return;
  const canvas = host.querySelector<HTMLCanvasElement>(".mast-gl");
  if (!canvas) return;

  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
  } catch (e) {
    return;
  }
  if (!gl) return;
  const ctx = gl;

  const compile = (type: number, src: string) => {
    const s = ctx.createShader(type);
    if (!s) return null;
    ctx.shaderSource(s, src);
    ctx.compileShader(s);
    return ctx.getShaderParameter(s, ctx.COMPILE_STATUS) ? s : null;
  };
  const vs = compile(ctx.VERTEX_SHADER, VERT);
  const fs = compile(ctx.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  const prog = ctx.createProgram();
  if (!prog) return;
  ctx.attachShader(prog, vs);
  ctx.attachShader(prog, fs);
  ctx.linkProgram(prog);
  if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) return;
  ctx.useProgram(prog);

  const buf = ctx.createBuffer();
  ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
  ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), ctx.STATIC_DRAW);
  const loc = ctx.getAttribLocation(prog, "a");
  ctx.enableVertexAttribArray(loc);
  ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);

  const uRes = ctx.getUniformLocation(prog, "u_res");
  const uTime = ctx.getUniformLocation(prog, "u_time");

  const still = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const start = window.performance && performance.now ? performance.now() : Date.now();
  let w = 0;
  let h = 0;
  let raf = 0;
  let onScreen = true;

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const cw = Math.max(1, Math.round(host!.clientWidth * dpr));
    const ch = Math.max(1, Math.round(host!.clientHeight * dpr));
    if (cw === w && ch === h) return;
    w = cw;
    h = ch;
    canvas!.width = w;
    canvas!.height = h;
    ctx.viewport(0, 0, w, h);
    ctx.uniform2f(uRes, w, h);
  }

  function frame(now: number) {
    raf = 0;
    size();
    ctx.uniform1f(uTime, (now - start) / 1000);
    ctx.drawArrays(ctx.TRIANGLES, 0, 3);
    if (!still && onScreen && !document.hidden) raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function remeasure() {
    w = 0;
    kick();
  }

  if (window.IntersectionObserver) {
    new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      if (onScreen) kick();
    }).observe(host);
  }
  if (window.ResizeObserver) new ResizeObserver(remeasure).observe(host);
  window.addEventListener("resize", remeasure, { passive: true });
  document.addEventListener("visibilitychange", kick);

  kick();
}
