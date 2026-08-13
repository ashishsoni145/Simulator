import { Link } from 'react-router-dom'
import Galaxy from '../components/Galaxy/Galaxy'
import Hero from '../components/Hero/Hero'

export default function LandingPage() {
  return (
    <div className="landing">
      <Galaxy
        mouseRepulsion
        mouseInteraction
        density={1.5}
        glowIntensity={0.5}
        saturation={0.8}
        hueShift={220}
        starSpeed={0.4}
        twinkleIntensity={0.35}
        rotationSpeed={0.08}
        transparent
      />
      <div className="landing__veil" />
      <main className="landing__main">
        <nav className="landing__nav" aria-label="Landing navigation">
          <div className="brand">
            <div className="brand__mark">S3D</div>
            <div>
              <div className="brand__title">Science 3D</div>
              <div className="brand__tagline">See the science. Interact with it. Understand it.</div>
            </div>
          </div>
          <Link className="button button--ghost" to="/lab">
            Enter Lab
          </Link>
        </nav>

        <section className="hero-grid">
          <div>
            <p className="eyebrow">Premium virtual laboratory for Class 11 and 12</p>
            <h1 className="hero-title">
              Science isn&apos;t meant to be memorized.
              <span>It&apos;s meant to be experienced.</span>
            </h1>
            <p className="hero-copy">
              Explore Physics and Chemistry through interactive 3D simulations, virtual experiments, and visual explanations built for Class 11 and 12.
            </p>
            <div className="actions">
              <Link className="button button--primary" to="/lab">
                Explore the Lab
              </Link>
              <a className="button button--ghost" href="#concepts">
                Browse Concepts
              </a>
            </div>
            <div className="concept-chips" aria-label="Featured concepts">
              {['Electric Field', 'Projectile Motion', 'Atomic Structure', 'VSEPR Geometry', 'Ray Optics', 'Titration'].map((item) => (
                <span className="chip" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
          <Hero />
        </section>

        <section className="section" id="concepts">
          <h2 className="section-title">The simulation is the product.</h2>
          <div className="grid grid--3">
            <article className="card glass">
              <h3>Interact</h3>
              <p>Change variables and see scientific laws respond immediately.</p>
            </article>
            <article className="card glass">
              <h3>Visualize</h3>
              <p>Turn invisible forces, fields, orbitals, and reactions into inspectable artifacts.</p>
            </article>
            <article className="card glass">
              <h3>Experiment</h3>
              <p>Use virtual laboratory setups when a real lab is unavailable or impractical.</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}
