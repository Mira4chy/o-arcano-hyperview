/* O Arcano — cenário cósmico da autenticação */
(() => {
  'use strict';

  function mount(gate) {
    if (!gate || gate.dataset.authExperienceMounted === '1') return;
    gate.dataset.authExperienceMounted = '1';

    const layers = [...gate.querySelectorAll('[data-auth-depth]')];
    const fogCanvas = gate.querySelector('[data-auth-fog]');
    const dustCanvas = gate.querySelector('[data-auth-dust]');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = matchMedia('(max-width: 720px)').matches;
    const pointer = { targetX: 0, targetY: 0, x: 0, y: 0 };
    let width = innerWidth;
    let height = innerHeight;
    let frameId = 0;
    let lastFogFrame = 0;

    function onPointer(event) {
      if (reduced || mobile) return;
      pointer.targetX = (event.clientX / width - 0.5) * 2;
      pointer.targetY = (event.clientY / height - 0.5) * 2;
    }

    function resetPointer() {
      pointer.targetX = 0;
      pointer.targetY = 0;
    }

    function onResize() {
      width = innerWidth;
      height = innerHeight;
    }

    function makeFogRenderer(canvas) {
      if (!canvas) return () => {};
      const gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        powerPreference: 'low-power'
      });
      if (!gl) return () => {};

      const vertex = `
        attribute vec2 aPosition;
        void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
      `;
      const fragment = `
        precision mediump float;
        uniform vec2 uResolution;
        uniform vec2 uPointer;
        uniform float uTime;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.52;
          mat2 rotation = mat2(0.80, 0.60, -0.60, 0.80);
          for (int i = 0; i < 5; i++) {
            value += amplitude * noise(p);
            p = rotation * p * 2.03 + 17.17;
            amplitude *= 0.49;
          }
          return value;
        }

        void main() {
          vec2 uv = gl_FragCoord.xy / uResolution.xy;
          vec2 p = uv - 0.5;
          p.x *= uResolution.x / uResolution.y;
          float t = uTime * 0.035;
          vec2 drift = vec2(t * 0.38, -t * 0.13) + uPointer * 0.045;
          vec2 warp = vec2(fbm(p * 1.35 + drift), fbm(p * 1.35 + 6.2 - drift * 0.7));
          float volume = fbm(p * 1.72 + warp * 1.25 + drift);
          float horizon = exp(-pow((uv.y - 0.28) * 3.5, 2.0));
          float lowVeil = exp(-pow((uv.y - 0.14) * 5.1, 2.0));
          float density = smoothstep(0.48, 0.82, volume + horizon * 0.18);
          float alpha = density * (horizon * 0.20 + lowVeil * 0.13);
          vec3 violet = vec3(0.49, 0.05, 0.72);
          vec3 deepPurple = vec3(0.17, 0.01, 0.31);
          vec3 color = mix(deepPurple, violet, smoothstep(0.44, 0.76, volume));
          gl_FragColor = vec4(color, alpha);
        }
      `;

      function compile(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          throw new Error(gl.getShaderInfoLog(shader));
        }
        return shader;
      }

      try {
        const program = gl.createProgram();
        gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          throw new Error(gl.getProgramInfoLog(program));
        }
        gl.useProgram(program);

        const position = gl.getAttribLocation(program, 'aPosition');
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

        const resolution = gl.getUniformLocation(program, 'uResolution');
        const pointerUniform = gl.getUniformLocation(program, 'uPointer');
        const time = gl.getUniformLocation(program, 'uTime');

        function resize() {
          const dpr = Math.min(devicePixelRatio || 1, mobile ? 1 : 1.25);
          canvas.width = Math.round(innerWidth * dpr);
          canvas.height = Math.round(innerHeight * dpr);
          gl.viewport(0, 0, canvas.width, canvas.height);
        }

        resize();
        addEventListener('resize', resize, { passive: true });

        return (seconds) => {
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.uniform2f(resolution, canvas.width, canvas.height);
          gl.uniform2f(pointerUniform, pointer.x, pointer.y);
          gl.uniform1f(time, seconds);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        };
      } catch (error) {
        console.warn('[O Arcano] Névoa WebGL indisponível; mantendo o cenário estático.', error);
        return () => {};
      }
    }

    function makeDustRenderer(canvas) {
      if (!canvas) return () => {};
      const context = canvas.getContext('2d');
      const motes = Array.from({ length: mobile ? 16 : 36 }, () => ({
        x: Math.random(),
        y: Math.random(),
        size: 0.4 + Math.random() * 1.2,
        alpha: 0.05 + Math.random() * 0.22,
        speed: 0.000012 + Math.random() * 0.000026,
        sway: (Math.random() - 0.5) * 0.000016,
        phase: Math.random() * Math.PI * 2
      }));

      function resize() {
        const dpr = Math.min(devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(innerWidth * dpr);
        canvas.height = Math.round(innerHeight * dpr);
        canvas.style.width = `${innerWidth}px`;
        canvas.style.height = `${innerHeight}px`;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      resize();
      addEventListener('resize', resize, { passive: true });

      return (ms) => {
        context.clearRect(0, 0, innerWidth, innerHeight);
        for (const mote of motes) {
          if (!reduced) {
            mote.y -= mote.speed * 16;
            mote.x += Math.sin(ms * 0.00018 + mote.phase) * mote.sway;
            if (mote.y < -0.03) {
              mote.y = 1.03;
              mote.x = Math.random();
            }
          }
          const x = mote.x * innerWidth + pointer.x * mote.size * 7;
          const y = mote.y * innerHeight + pointer.y * mote.size * 5;
          const pulse = 0.55 + Math.sin(ms * 0.0007 + mote.phase) * 0.35;
          context.beginPath();
          context.arc(x, y, mote.size, 0, Math.PI * 2);
          context.fillStyle = `rgba(205, 174, 230, ${Math.max(0, mote.alpha * pulse)})`;
          context.shadowColor = 'rgba(160, 98, 205, 0.45)';
          context.shadowBlur = mote.size * 6;
          context.fill();
        }
        context.shadowBlur = 0;
      };
    }

    const renderFog = makeFogRenderer(fogCanvas);
    const renderDust = makeDustRenderer(dustCanvas);

    function frame(ms) {
      if (!gate.isConnected) {
        cancelAnimationFrame(frameId);
        removeEventListener('pointermove', onPointer);
        removeEventListener('pointerleave', resetPointer);
        removeEventListener('resize', onResize);
        return;
      }

      pointer.x += (pointer.targetX - pointer.x) * 0.075;
      pointer.y += (pointer.targetY - pointer.y) * 0.075;

      if (!reduced && !mobile) {
        for (const layer of layers) {
          const depth = Number(layer.dataset.authDepth) || 0;
          layer.style.setProperty('--auth-x', `${(pointer.x * depth).toFixed(2)}px`);
          layer.style.setProperty('--auth-y', `${(pointer.y * depth * 0.72).toFixed(2)}px`);
        }
      }

      if (ms - lastFogFrame > 32 || reduced) {
        renderFog(ms / 1000);
        lastFogFrame = ms;
      }
      renderDust(ms);
      if (!reduced) frameId = requestAnimationFrame(frame);
    }

    addEventListener('pointermove', onPointer, { passive: true });
    addEventListener('pointerleave', resetPointer, { passive: true });
    addEventListener('resize', onResize, { passive: true });
    requestAnimationFrame((ms) => {
      gate.classList.add('is-ready');
      frame(ms);
    });
  }

  window.ArcanoAuthExperience = { mount };
})();
