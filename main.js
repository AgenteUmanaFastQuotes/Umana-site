gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const cursor = document.getElementById('cursor');
const cursorFollower = document.getElementById('cursor-follower');
let mouseX = 0, mouseY = 0, followerX = 0, followerY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  gsap.set(cursor, { x: mouseX, y: mouseY });
});

function animateFollower() {
  followerX += (mouseX - followerX) * 0.1;
  followerY += (mouseY - followerY) * 0.1;
  gsap.set(cursorFollower, { x: followerX, y: followerY });
  requestAnimationFrame(animateFollower);
}
animateFollower();

document.querySelectorAll('a, button, .service-item, .work-item').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

const loaderTl = gsap.timeline({
  onComplete: () => {
    document.getElementById('loader').style.display = 'none';
    initAnimations();
  }
});

loaderTl
  .to('.loader-fill', { width: '100%', duration: 1.8, ease: 'power2.inOut' })
  .to('#loader', { opacity: 0, duration: 0.5, ease: 'power2.out' }, '-=0.1');

function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 3;

  const count = 4000;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    sizes[i] = Math.random() * 2 + 0.5;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uColor: { value: new THREE.Color(0xc9a96e) },
    },
    vertexShader: `
      attribute float size;
      uniform float uTime;
      uniform vec2 uMouse;
      varying float vAlpha;
      void main() {
        vec3 pos = position;
        float dist = distance(pos.xy, uMouse * 6.0);
        pos.z += sin(uTime * 0.5 + pos.x * 0.3 + pos.y * 0.3) * 0.3;
        pos.x += sin(uTime * 0.3 + pos.z) * 0.05;
        pos.y += cos(uTime * 0.3 + pos.z) * 0.05;
        float repel = smoothstep(3.0, 0.0, dist);
        pos.z += repel * 1.5;
        vAlpha = 0.3 + 0.4 * (1.0 - abs(pos.z) / 4.0);
        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (250.0 / -mvPos.z);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  const torusGeo = new THREE.TorusKnotGeometry(1.2, 0.35, 120, 18, 2, 3);
  const torusMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, wireframe: true, transparent: true, opacity: 0.5 });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  torus.position.set(4, 0, -1);
  scene.add(torus);

  const mouse = new THREE.Vector2();
  window.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  const clock = new THREE.Clock();
  function render() {
    const t = clock.getElapsedTime();
    mat.uniforms.uTime.value = t;
    mat.uniforms.uMouse.value.lerp(mouse, 0.05);
    particles.rotation.y = t * 0.03;
    torus.rotation.x = t * 0.3;
    torus.rotation.y = t * 0.2;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  render();

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
}

function initAboutCanvas() {
  const canvas = document.getElementById('about-canvas');
  if (!canvas) return;
  const w = canvas.offsetWidth || 600;
  const h = canvas.offsetHeight || 450;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.setClearColor(0x1a1a1a, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
  camera.position.z = 3.5;

  const sGeo = new THREE.SphereGeometry(1.4, 64, 64);
  const sMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xc9a96e) } },
    vertexShader: `
      uniform float uTime;
      varying vec3 vNormal;
      varying float vDisplace;
      void main() {
        vNormal = normal;
        float d = sin(position.x * 2.0 + uTime) * 0.15
                + sin(position.y * 2.5 + uTime * 0.7) * 0.1
                + sin(position.z * 2.0 + uTime * 1.2) * 0.12;
        vDisplace = d;
        vec3 pos = position + normal * d;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec3 vNormal;
      varying float vDisplace;
      void main() {
        vec3 light = normalize(vec3(1.0, 1.0, 1.0));
        float diff = dot(vNormal, light) * 0.5 + 0.5;
        vec3 baseColor = mix(vec3(0.08, 0.08, 0.08), uColor, diff * (0.4 + vDisplace * 2.0));
        gl_FragColor = vec4(baseColor, 1.0);
      }
    `,
  });

  const sphere = new THREE.Mesh(sGeo, sMat);
  scene.add(sphere);

  const clock = new THREE.Clock();
  function render() {
    sMat.uniforms.uTime.value = clock.getElapsedTime();
    sphere.rotation.y += 0.003;
    sphere.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.1;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  render();
}

function initWorkCanvases() {
  document.querySelectorAll('.work-canvas').forEach(canvas => {
    const [r, g, b] = (canvas.dataset.color || '0.5,0.5,0.5').split(',').map(Number);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x111111, 1);

    const w = canvas.offsetWidth || 400;
    const h = canvas.offsetHeight || 300;
    renderer.setSize(w, h);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.z = 2.5;

    new ResizeObserver(() => {
      renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
      camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
      camera.updateProjectionMatrix();
    }).observe(canvas);

    const geo = new THREE.PlaneGeometry(4, 4, 32, 32);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(r, g, b) } },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying float vElevation;
        void main() {
          vUv = uv;
          float elev = sin(position.x * 2.0 + uTime) * 0.15
                     + sin(position.y * 3.0 + uTime * 0.8) * 0.1;
          vElevation = elev;
          vec3 pos = position;
          pos.z += elev;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec2 vUv;
        varying float vElevation;
        void main() {
          vec3 col = mix(vec3(0.05), uColor, vElevation + 0.3);
          float gx = step(0.97, fract(vUv.x * 8.0));
          float gy = step(0.97, fract(vUv.y * 8.0));
          col = mix(col, uColor * 0.5, (gx + gy) * 0.4);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    const plane = new THREE.Mesh(geo, mat);
    plane.rotation.x = -0.5;
    scene.add(plane);

    const clock = new THREE.Clock();
    function render() {
      mat.uniforms.uTime.value = clock.getElapsedTime();
      plane.rotation.z += 0.001;
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }
    render();
  });
}

function initContactCanvas() {
  const canvas = document.getElementById('contact-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, canvas.offsetHeight || 600);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / (canvas.offsetHeight || 600), 0.1, 100);
  camera.position.z = 4;

  const rings = [];
  for (let i = 0; i < 5; i++) {
    const geo = new THREE.TorusGeometry(1.2 + i * 0.4, 0.008, 4, 120);
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xc9a96e), transparent: true, opacity: 0.15 + i * 0.05 });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = Math.PI * 0.3 + i * 0.15;
    ring.rotation.y = i * 0.3;
    scene.add(ring);
    rings.push({ mesh: ring, speed: 0.003 + i * 0.002, axis: i % 2 === 0 ? 'x' : 'y' });
  }

  const pCount = 800;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const r = 0.5 + Math.random() * 1.5;
    pPos[i * 3]     = Math.cos(theta) * r;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
    pPos[i * 3 + 2] = Math.sin(theta) * r;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0xc9a96e, size: 0.015, transparent: true, opacity: 0.6,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));

  const clock = new THREE.Clock();
  function render() {
    const t = clock.getElapsedTime();
    rings.forEach(({ mesh, speed, axis }) => {
      mesh.rotation[axis] += speed;
      mesh.rotation.z = Math.sin(t * 0.3) * 0.1;
    });
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  render();

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, canvas.offsetHeight);
    camera.aspect = window.innerWidth / canvas.offsetHeight;
    camera.updateProjectionMatrix();
  });
}

function initNav() {
  const nav = document.getElementById('nav');
  ScrollTrigger.create({
    start: 100,
    onEnter: () => nav.classList.add('scrolled'),
    onLeaveBack: () => nav.classList.remove('scrolled'),
  });

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        gsap.to(window, { duration: 1.2, scrollTo: target, ease: 'power3.inOut' });
      }
    });
  });
}

function initHeroAnimations() {
  const tl = gsap.timeline({ delay: 0.3 });
  tl.to('.hero-tag', { opacity: 1, duration: 0.8, ease: 'power2.out' })
    .to('.hero-title .line span', { y: '0%', duration: 1.2, ease: 'power4.out', stagger: 0.1 }, '-=0.4')
    .to('.hero-sub', { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.6')
    .to('.hero-cta', { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.5')
    .to(['.hero-scroll', '.hero-number'], { opacity: 1, duration: 0.8 }, '-=0.4');
}

function initScrollAnimations() {
  gsap.from('.about-title', { scrollTrigger: { trigger: '#about', start: 'top 75%' }, y: 60, opacity: 0, duration: 1, ease: 'power3.out' });
  gsap.from('.about-lead, .about-body', { scrollTrigger: { trigger: '#about', start: 'top 65%' }, y: 40, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.2 });
  gsap.from('.about-tags span', { scrollTrigger: { trigger: '.about-tags', start: 'top 80%' }, y: 20, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' });
  gsap.from('.about-visual', { scrollTrigger: { trigger: '.about-visual', start: 'top 80%' }, y: 60, opacity: 0, duration: 1.2, ease: 'power3.out' });
  gsap.from('.stat', { scrollTrigger: { trigger: '.about-stat-block', start: 'top 90%' }, y: 20, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' });
  gsap.from('.services-header h2', { scrollTrigger: { trigger: '#services', start: 'top 75%' }, y: 50, opacity: 0, duration: 1, ease: 'power3.out' });
  gsap.from('.service-item', { scrollTrigger: { trigger: '.services-list', start: 'top 80%' }, x: -40, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out' });
  gsap.from('.work-header h2', { scrollTrigger: { trigger: '#work', start: 'top 75%' }, y: 50, opacity: 0, duration: 1, ease: 'power3.out' });
  gsap.from('.work-item', { scrollTrigger: { trigger: '.work-grid', start: 'top 80%' }, y: 60, opacity: 0, duration: 1, stagger: 0.15, ease: 'power3.out' });
  gsap.from('.contact-content h2, .contact-content p, .contact-content .btn-primary', { scrollTrigger: { trigger: '#contact', start: 'top 70%' }, y: 50, opacity: 0, duration: 1, stagger: 0.15, ease: 'power3.out' });
  gsap.from('.contact-detail', { scrollTrigger: { trigger: '.contact-info', start: 'top 85%' }, y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' });

  gsap.to('.hero-content', {
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
    y: 150, opacity: 0,
  });

  ScrollTrigger.create({
    trigger: '.about-stat-block',
    start: 'top 85%',
    onEnter: () => {
      const counters = [
        { el: document.querySelectorAll('.stat-num')[0], target: 12, suffix: '+', duration: 1.5 },
        { el: document.querySelectorAll('.stat-num')[1], target: 500, suffix: '+', duration: 2 },
        { el: document.querySelectorAll('.stat-num')[2], target: 98, suffix: '%', duration: 1.8 },
      ];
      counters.forEach(({ el, target, suffix, duration }) => {
        if (!el) return;
        const obj = { val: 0 };
        gsap.to(obj, { val: target, duration, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(obj.val) + suffix; } });
      });
    },
  });
}

function initMagnetic() {
  document.querySelectorAll('.btn-primary, .nav-cta').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    });
  });
}

function initServiceInteractions() {
  document.querySelectorAll('.service-item').forEach(item => {
    item.addEventListener('mouseenter', function() { gsap.to(this.querySelector('h3'), { x: 8, duration: 0.3, ease: 'power2.out' }); });
    item.addEventListener('mouseleave', function() { gsap.to(this.querySelector('h3'), { x: 0, duration: 0.4, ease: 'power2.out' }); });
  });
}

function initAnimations() {
  initHeroCanvas();
  initAboutCanvas();
  initWorkCanvases();
  initContactCanvas();
  initNav();
  initHeroAnimations();
  initScrollAnimations();
  initMagnetic();
  initServiceInteractions();
}

document.querySelectorAll('.hero-title .line').forEach(line => {
  line.innerHTML = `<span style="display:block">${line.innerHTML}</span>`;
});