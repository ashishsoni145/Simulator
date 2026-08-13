import React, { useEffect, useRef } from 'react'
import './Galaxy.css'
import { Renderer, Camera, Transform, Mesh, Geometry, Program } from 'ogl'

// Simple OGL-based starfield adapted for the Galaxy background.
// Props allow basic tuning as requested in the spec.
export default function Galaxy({
  mouseRepulsion = false,
  mouseInteraction = false,
  density = 1.2,
  glowIntensity = 0.4,
  saturation = 0.8,
  hueShift = 220,
  starSpeed = 0.3,
  twinkleIntensity = 0.25,
  rotationSpeed = 0.05,
  transparent = true
}){
  const ref = useRef(null)
  const state = useRef({})

  useEffect(()=>{
    const parent = ref.current
    if(!parent) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const renderer = new Renderer({ alpha: true, antialias: true })
    const gl = renderer.gl
    renderer.setSize(parent.clientWidth, parent.clientHeight)
    parent.appendChild(gl.canvas)
    gl.canvas.style.width = '100%'
    gl.canvas.style.height = '100%'
    gl.canvas.style.display = 'block'

    const camera = new Camera(gl)
    camera.position.set(0,0,1)

    const scene = new Transform()
    const pointer = { x: 0, y: 0, active: 0 }

    // create particles
    const count = Math.floor((reducedMotion ? 360 : 820) * density)
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    for(let i=0;i<count;i++){
      positions[i*3+0] = (Math.random()*2-1) * 2.2
      positions[i*3+1] = (Math.random()*2-1) * 1.35
      positions[i*3+2] = Math.random()
      seeds[i] = Math.random()
    }

    const geometry = new Geometry(gl, {
      position: { size:3, data: positions },
      seed: { size: 1, data: seeds }
    })

    const vertex = `
      attribute vec3 position;
      attribute float seed;
      uniform float time;
      uniform vec2 pointer;
      uniform float pointerActive;
      uniform float mouseRepulsion;
      uniform float starSpeed;
      varying vec3 vPosition;
      varying float vSeed;

      void main(){
        vec3 p = position;
        p.y += sin(time * starSpeed + seed * 18.0) * 0.018;
        if(pointerActive > 0.5){
          vec2 delta = p.xy - pointer;
          float d = max(length(delta), 0.02);
          float influence = smoothstep(0.55, 0.0, d);
          p.xy += normalize(delta) * influence * 0.12 * mouseRepulsion;
        }
        vPosition = p;
        vSeed = seed;
        gl_Position = vec4(p.xy, 0.0, 1.0);
        gl_PointSize = mix(1.2, 3.4, seed);
      }`
    const fragment = `
      precision highp float;
      varying vec3 vPosition;
      varying float vSeed;
      uniform float time;
      uniform float glowIntensity;
      uniform float saturation;
      uniform float hueShift;
      uniform float twinkleIntensity;

      vec3 hsl2rgb(vec3 c) {
        vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
        return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
      }

      void main(){
        float d = length(gl_PointCoord - vec2(0.5));
        float core = 1.0 - smoothstep(0.08, 0.48, d);
        float halo = 1.0 - smoothstep(0.22, 0.5, d);
        float tw = 1.0 - twinkleIntensity + twinkleIntensity * (0.5 + 0.5*sin(time*4.0 + vSeed*30.0));
        float hue = mod(hueShift / 360.0 + vSeed * 0.08, 1.0);
        vec3 color = hsl2rgb(vec3(hue, saturation, 0.68));
        float alpha = (core + halo * glowIntensity) * tw;
        gl_FragColor = vec4(color, alpha);
      }`

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        time: { value: 0 },
        pointer: { value: [0, 0] },
        pointerActive: { value: 0 },
        mouseRepulsion: { value: mouseRepulsion ? 1 : 0 },
        starSpeed: { value: starSpeed },
        glowIntensity: { value: glowIntensity },
        saturation: { value: saturation },
        hueShift: { value: hueShift },
        twinkleIntensity: { value: twinkleIntensity }
      },
      transparent: true,
      depthTest: false
    })

    const mesh = new Mesh(gl, { geometry, program })
    mesh.setParent(scene)

    function resize(){
      renderer.setSize(parent.clientWidth, parent.clientHeight)
      const aspect = parent.clientWidth / parent.clientHeight
      camera.perspective({ aspect })
    }

    function onPointerMove(event){
      const rect = parent.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
      pointer.active = mouseInteraction ? 1 : 0
    }

    function onPointerLeave(){
      pointer.active = 0
    }

    function update(t){
      const now = t * 0.001
      program.uniforms.time.value = now
      program.uniforms.pointer.value = [pointer.x, pointer.y]
      program.uniforms.pointerActive.value = pointer.active
      if(!reducedMotion) mesh.rotation.z += rotationSpeed * 0.0005
      renderer.render({ scene, camera })
      state.current.raf = requestAnimationFrame(update)
    }

    resize()
    window.addEventListener('resize', resize)
    parent.addEventListener('pointermove', onPointerMove)
    parent.addEventListener('pointerleave', onPointerLeave)
    state.current.raf = requestAnimationFrame(update)

    return ()=>{
      cancelAnimationFrame(state.current.raf)
      window.removeEventListener('resize', resize)
      parent.removeEventListener('pointermove', onPointerMove)
      parent.removeEventListener('pointerleave', onPointerLeave)
      if(gl.canvas.parentElement === parent) parent.removeChild(gl.canvas)
      geometry.remove()
      renderer.gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [density, glowIntensity, hueShift, mouseInteraction, mouseRepulsion, rotationSpeed, saturation, starSpeed, twinkleIntensity])

  return (
    <div className="galaxy-canvas" ref={ref} aria-hidden style={{position:'absolute', inset:0, zIndex:0, pointerEvents: mouseInteraction ? 'auto' : 'none', opacity: transparent?0.95:1}} />
  )
}
