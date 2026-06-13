/* ============================
   UMANA — MAIN.JS
   GSAP + Three.js Interactive Site
   ============================ */

'use strict';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// ============================
// CURSOR
// ============================
(function initCursor() {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let mouseX = 0, mouseY = 0;
  let followerX = 0, followerY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
  });

  function tickFollower() {
    followerX += (mouseX - followerX) * 0.10;
    followerY += (mouseY - followerY) * 0.10;
    ring.style.left = followerX + 'px';
    ring.style.top  = followerY + 'px';
    requestAnimationFrame(tickFollower);
  }
  tickFollower();

  document.querySelectorAll('.interactive, a, button').forEach((el) => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-expanded'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-expanded'));
  });
})();

// ============================
// LOADER → init everything
// ============================
window.addEventListener('load', function () {
  const loader = document.getElementById('loader');
  if (!loader) { initAll(); return; }

  gsap.to(loader, {
    opacity: 0,
    duration: 0.8,
    delay: 1.0,
    ease: 'power2.out',
    onComplete: () => {
      loader.style.display = 'none';
      initAll();
    }
  });
});

function initAll() {
  initNav();
  initHeroAnimations();
  initHeroThree();
  initAboutThree();
  initContactThree();
  initScrollReveal();
  initStatCounter();
  initAccordion();
  initWorkCards();
  initSmoothScroll();
  initMagneticButtons();
  initHeroParallax();
}

// ============================
// NAV
// ============================
function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  // Start with is-hero (hero is dark)
  nav.classList.add('is-hero');

  gsap.from(nav, { y: -80, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 1.3 });

  // White text while hero is in view
  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    onEnter:     () => nav.classList.add('is-hero'),
    onLeave:     () => nav.classList.remove('is-hero'),
    onEnterBack: () => nav.classList.add('is-hero'),
    onLeaveBack: () => nav.classList.remove('is-hero')
  });

  // Frosted glass after scroll
  ScrollTrigger.create({
    start: 'top -60px',
    onEnter:     () => nav.classList.add('is-scrolled'),
    onLeaveBack: () => nav.classList.remove('is-scrolled')
  });
}

// ============================
// HERO ANIMATIONS
// ============================
function initHeroAnimations() {
  const label   = document.querySelector('.hero-label');
  const lines   = document.querySelectorAll('.hero-title .line > span');
  const hint    = document.querySelector('.hero-scroll-hint');
  const explore = document.querySelector('.hero-cta-explore');

  const tl = gsap.timeline({ delay: 0.2 });

  if (label) {
    tl.to(label, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.2);
  }
  if (lines.length) {
    tl.to(lines, { y: '0%', duration: 1.2, ease: 'power4.out', stagger: 0.12 }, 0.35);
  }
  if (hint) {
    tl.to(hint, { opacity: 1, duration: 0.7, ease: 'power2.out' }, 1.2);
  }
  if (explore) {
    tl.to(explore, { opacity: 1, duration: 0.7, ease: 'power2.out' }, 1.35);
  }
}

// ============================
// THREE.JS — HERO TERRAIN
// Atmospheric landscape: animated terrain plane with warm amber highlights
// ============================
function initHeroThree() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x08060A, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x100810, 0.055);

  const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 200);
  camera.position.set(0, 5, 14);
  camera.lookAt(0, -1, 0);

  // Animated terrain
  const vShader = `
    uniform float uTime;
    varying float vElevation;

    void main() {
      vec3 pos = position;
      float e = sin(pos.x * 0.22 + uTime * 0.28) * 1.5
              + cos(pos.z * 0.18 - uTime * 0.20) * 1.2
              + sin(pos.x * 0.45 + pos.z * 0.38 + uTime * 0.35) * 0.55
              + cos(pos.x * 0.12 - pos.z * 0.22 + uTime * 0.15) * 0.9;
      pos.y += e;
      vElevation = e;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fShader = `
    varying float vElevation;

    void main() {
      float t = clamp((vElevation + 2.8) / 5.6, 0.0, 1.0);
      vec3 deep = vec3(0.045, 0.030, 0.038);
      vec3 mid  = vec3(0.14,  0.078, 0.048);
      vec3 high = vec3(0.91,  0.38,  0.10);
      vec3 col;
      if (t < 0.62) {
        col = mix(deep, mid, t / 0.62);
      } else {
        col = mix(mid, high, (t - 0.62) / 0.38);
      }
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const geo = new THREE.PlaneGeometry(55, 44, 90, 70);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.ShaderMaterial({
    vertexShader: vShader,
    fragmentShader: fShader,
    uniforms: { uTime: { value: 0 } }
  });

  const terrain = new THREE.Mesh(geo, mat);
  terrain.position.y = -3.5;
  scene.add(terrain);

  // Sparse stars
  const starCount = 600;
  const starPos   = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPos[i * 3]     = (Math.random() - 0.5) * 80;
    starPos[i * 3 + 1] = Math.random() * 18 + 3;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xFFDDCC,
    size: 0.055,
    transparent: true,
    opacity: 0.35,
    sizeAttenuation: true
  });
  scene.add(new THREE.Points(starGeo, starMat));

  let targetX = 0, targetY = 0;
  document.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth  - 0.5) * 2;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  function animate(t) {
    requestAnimationFrame(animate);
    const elapsed = t * 0.001;
    mat.uniforms.uTime.value = elapsed;
    camera.position.x += (targetX * 1.8 - camera.position.x) * 0.018;
    camera.position.y += (5 - targetY * 0.6 - camera.position.y) * 0.018;
    camera.lookAt(0, -1, 0);
    renderer.render(scene, camera);
  }
  animate(0);
}

// ============================
// THREE.JS — ABOUT MORPHING SPHERE
// ============================
function initAboutThree() {
  const canvas = document.getElementById('about-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0xF4F1EB, 1);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 4;

  const vShader = `
    uniform float uTime;
    varying vec3 vNormal;
    varying float vDisplace;

    float noise(vec3 p) {
      return sin(p.x * 2.3 + uTime * 0.6)
           * cos(p.y * 2.1 + uTime * 0.5)
           * sin(p.z * 1.9 + uTime * 0.4);
    }

    void main() {
      vNormal = normal;
      float d = noise(position) * 0.22;
      vDisplace = d;
      vec3 newPos = position + normal * d;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
    }
  `;

  const fShader = `
    uniform float uTime;
    varying vec3 vNormal;
    varying float vDisplace;

    void main() {
      vec3 cOrange = vec3(0.91, 0.38, 0.10);
      vec3 cCream  = vec3(0.96, 0.94, 0.91);
      float t = clamp(vDisplace * 2.0 + 0.5, 0.0, 1.0);
      vec3 col = mix(cCream, cOrange, t);
      float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
      col = mix(col, cOrange, fresnel * 0.45);
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const geo = new THREE.SphereGeometry(1.5, 64, 64);
  const mat = new THREE.ShaderMaterial({
    vertexShader: vShader,
    fragmentShader: fShader,
    uniforms: { uTime: { value: 0 } }
  });

  scene.add(new THREE.Mesh(geo, mat));

  function resize() {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let raf = null;
  function animate(t) {
    raf = requestAnimationFrame(animate);
    mat.uniforms.uTime.value = t * 0.001;
    scene.children[0].rotation.y += 0.003;
    scene.children[0].rotation.x += 0.001;
    renderer.render(scene, camera);
  }
  animate(0);

  ScrollTrigger.create({
    trigger: '#about',
    onEnter:     () => { if (!raf) animate(performance.now()); },
    onLeave:     () => { cancelAnimationFrame(raf); raf = null; },
    onEnterBack: () => { if (!raf) animate(performance.now()); },
    onLeaveBack: () => { cancelAnimationFrame(raf); raf = null; }
  });
}

// ============================
// THREE.JS — CONTACT TORUS RINGS
// ============================
function initContactThree() {
  const canvas = document.getElementById('contact-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 6;

  const rings = [];
  [
    { r: 2.0, tube: 0.018, opacity: 0.30, sx: 0.004,  sy: 0.007  },
    { r: 3.1, tube: 0.012, opacity: 0.18, sx: -0.003, sy: 0.005  },
    { r: 1.3, tube: 0.022, opacity: 0.22, sx: 0.006,  sy: -0.004 }
  ].forEach((cfg) => {
    const geo  = new THREE.TorusGeometry(cfg.r, cfg.tube, 16, 120);
    const mat  = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: cfg.opacity });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.random() * Math.PI;
    mesh.rotation.y = Math.random() * Math.PI;
    mesh._sx = cfg.sx;
    mesh._sy = cfg.sy;
    scene.add(mesh);
    rings.push(mesh);
  });

  function resize() {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  function animate() {
    requestAnimationFrame(animate);
    rings.forEach((r) => { r.rotation.x += r._sx; r.rotation.y += r._sy; });
    renderer.render(scene, camera);
  }
  animate();
}

// ============================
// SCROLL REVEAL
// ============================
function initScrollReveal() {
  document.querySelectorAll(
    '.section-tag, .section-title, .about-lead, .about-body, .contact-title, .contact-sub, .footer-copy'
  ).forEach((el) => {
    gsap.from(el, {
      y: 50,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none none'
      }
    });
  });

  // Statement quote — word reveal
  const quote = document.querySelector('.statement-quote');
  if (quote) {
    const words = quote.textContent.trim().split(/\s+/);
    quote.innerHTML = words.map(
      w => `<span style="display:inline-block;overflow:hidden"><span style="display:inline-block">${w}</span></span>`
    ).join(' ');

    gsap.from(quote.querySelectorAll('span > span'), {
      y: '100%',
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.035,
      scrollTrigger: { trigger: quote, start: 'top 82%', toggleActions: 'play none none none' }
    });

    const attr = document.querySelector('.statement-attr');
    if (attr) {
      gsap.from(attr, {
        y: 20, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.25,
        scrollTrigger: { trigger: quote, start: 'top 82%', toggleActions: 'play none none none' }
      });
    }
  }

  // About pills stagger
  const pills = document.querySelectorAll('.about-pills span');
  if (pills.length) {
    gsap.from(pills, {
      y: 20, opacity: 0, duration: 0.5, ease: 'power3.out', stagger: 0.07,
      scrollTrigger: { trigger: '.about-pills', start: 'top 88%', toggleActions: 'play none none none' }
    });
  }
}

// ============================
// STAT COUNTER
// ============================
function initStatCounter() {
  document.querySelectorAll('.stat-n[data-target]').forEach((el) => {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const suffix = el.dataset.suffix || '';
    const obj    = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 1.8,
      ease: 'power2.out',
      snap: { val: 1 },
      onUpdate: () => { el.textContent = Math.round(obj.val) + suffix; },
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });
  });
}

// ============================
// ACCORDION
// ============================
function initAccordion() {
  const items = document.querySelectorAll('.acc-item');
  if (!items.length) return;

  // Set initial heights
  items.forEach((item) => {
    const body = item.querySelector('.acc-body');
    if (!body) return;
    body.style.height = item.classList.contains('is-open') ? body.scrollHeight + 'px' : '0px';
  });

  items.forEach((item) => {
    const trigger = item.querySelector('.acc-trigger');
    const body    = item.querySelector('.acc-body');
    if (!trigger || !body) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      // Close all others
      items.forEach((other) => {
        if (other === item || !other.classList.contains('is-open')) return;
        other.classList.remove('is-open');
        const ob = other.querySelector('.acc-body');
        const ot = other.querySelector('.acc-trigger');
        if (ob) gsap.to(ob, { height: 0, duration: 0.45, ease: 'power3.inOut' });
        if (ot) ot.setAttribute('aria-expanded', 'false');
      });

      // Toggle this one
      if (isOpen) {
        item.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
        gsap.to(body, { height: 0, duration: 0.45, ease: 'power3.inOut' });
      } else {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        body.style.height = 'auto';
        const h = body.scrollHeight;
        body.style.height = '0px';
        gsap.to(body, { height: h, duration: 0.5, ease: 'power3.inOut' });
      }
    });
  });

  // Scroll reveal
  gsap.from(items, {
    y: 30, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.07,
    scrollTrigger: { trigger: '.accordion', start: 'top 88%', toggleActions: 'play none none none' }
  });
}

// ============================
// WORK CARDS
// ============================
function initWorkCards() {
  const cards = document.querySelectorAll('.work-card');
  if (!cards.length) return;

  gsap.from(cards, {
    y: 80,
    opacity: 0,
    duration: 0.85,
    ease: 'power3.out',
    stagger: 0.12,
    scrollTrigger: {
      trigger: '.work-grid',
      start: 'top 82%',
      toggleActions: 'play none none none'
    }
  });
}

// ============================
// SMOOTH SCROLL
// ============================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      gsap.to(window, {
        scrollTo: { y: target, offsetY: 72 },
        duration: 1.2,
        ease: 'power3.inOut'
      });
    });
  });
}

// ============================
// MAGNETIC BUTTONS
// ============================
function initMagneticButtons() {
  document.querySelectorAll('.contact-btn, .nav-cta').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width  / 2)) * 0.35;
      const dy = (e.clientY - (rect.top  + rect.height / 2)) * 0.35;
      gsap.to(btn, { x: dx, y: dy, duration: 0.35, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    });
  });
}

// ============================
// HERO PARALLAX ON SCROLL
// ============================
function initHeroParallax() {
  const heroContent = document.querySelector('.hero-content');
  if (!heroContent) return;

  gsap.to(heroContent, {
    y: 120,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  });
}
