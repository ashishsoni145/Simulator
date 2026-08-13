export type Subject = 'physics' | 'chemistry'
export type ClassLevel = 11 | 12
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface Chapter {
  id: string
  title: string
  subject: Subject
  classLevel: ClassLevel
  concepts: string[]
  simulationIds: string[]
}

export interface SimulationMeta {
  id: string
  title: string
  subject: Subject
  classLevel: ClassLevel
  chapterId: string
  description: string
  difficulty: Difficulty
  tags: string[]
  type: 'simulation' | 'experiment'
  status: 'implemented' | 'planned'
}

const physics11Titles = [
  'Units & Measurements',
  'Motion in a Straight Line',
  'Motion in a Plane',
  'Laws of Motion',
  'Work, Energy & Power',
  'System of Particles',
  'Rotational Motion',
  'Gravitation',
  'Mechanical Properties of Solids',
  'Mechanical Properties of Fluids',
  'Thermal Properties of Matter',
  'Thermodynamics',
  'Kinetic Theory',
  'Oscillations',
  'Waves'
] as const

const physics12Titles = [
  'Electric Charges & Fields',
  'Electrostatic Potential & Capacitance',
  'Current Electricity',
  'Moving Charges & Magnetism',
  'Magnetism & Matter',
  'Electromagnetic Induction',
  'Alternating Current',
  'Electromagnetic Waves',
  'Ray Optics',
  'Wave Optics',
  'Dual Nature',
  'Atoms',
  'Nuclei',
  'Semiconductor Electronics'
] as const

const chemistry11Titles = [
  'Some Basic Concepts of Chemistry',
  'Structure of Atom',
  'Classification of Elements & Periodicity',
  'Chemical Bonding & Molecular Structure',
  'Thermodynamics',
  'Equilibrium',
  'Redox Reactions',
  'Organic Chemistry: Basic Principles',
  'Hydrocarbons'
] as const

const chemistry12Titles = [
  'Solutions',
  'Electrochemistry',
  'Chemical Kinetics',
  'd- and f-Block Elements',
  'Coordination Compounds',
  'Haloalkanes and Haloarenes',
  'Alcohols, Phenols and Ethers',
  'Aldehydes, Ketones and Carboxylic Acids',
  'Amines',
  'Biomolecules'
] as const

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

function chapter(title: string, subject: Subject, classLevel: ClassLevel, simulationIds: string[] = []): Chapter {
  return {
    id: `${subject}-${classLevel}-${slug(title)}`,
    title,
    subject,
    classLevel,
    concepts: [],
    simulationIds
  }
}

export const chapters: Chapter[] = [
  ...physics11Titles.map((title) =>
    chapter(
      title,
      'physics',
      11,
      title === 'Motion in a Plane'
        ? ['projectile-motion']
        : title === 'Laws of Motion'
          ? ['newtons-second-law', 'collision']
          : title === 'Gravitation'
            ? ['gravitation']
            : title === 'Oscillations'
              ? ['shm']
              : []
    )
  ),
  ...physics12Titles.map((title) =>
    chapter(
      title,
      'physics',
      12,
      title === 'Electric Charges & Fields'
        ? ['electric-field']
        : title === 'Ray Optics'
          ? ['ray-optics']
          : []
    )
  ),
  ...chemistry11Titles.map((title) =>
    chapter(
      title,
      'chemistry',
      11,
      title === 'Structure of Atom'
        ? ['atomic-structure', 'electron-configuration']
        : title === 'Chemical Bonding & Molecular Structure'
          ? ['molecular-geometry', 'hybridization']
          : title === 'Thermodynamics'
            ? ['gas-laws']
            : []
    )
  ),
  ...chemistry12Titles.map((title) =>
    chapter(title, 'chemistry', 12, title === 'Solutions' ? ['titration'] : [])
  )
]

export const simulations: SimulationMeta[] = [
  {
    id: 'projectile-motion',
    title: 'Projectile Motion',
    subject: 'physics',
    classLevel: 11,
    chapterId: 'physics-11-motion-in-a-plane',
    description: 'Launch a body with variable speed, angle, height, gravity, and drag. Track range, height, time, velocity, and acceleration.',
    difficulty: 'intermediate',
    tags: ['kinematics', 'trajectory', 'vectors', 'gravity'],
    type: 'simulation',
    status: 'implemented'
  },
  {
    id: 'newtons-second-law',
    title: "Newton's Second Law",
    subject: 'physics',
    classLevel: 11,
    chapterId: 'physics-11-laws-of-motion',
    description: 'Vary mass, applied force, and friction to see force vectors, net force, acceleration, and velocity.',
    difficulty: 'beginner',
    tags: ['force', 'mass', 'friction', 'acceleration'],
    type: 'simulation',
    status: 'implemented'
  },
  {
    id: 'collision',
    title: 'Collision Laboratory',
    subject: 'physics',
    classLevel: 11,
    chapterId: 'physics-11-laws-of-motion',
    description: 'Compare elastic and perfectly inelastic one-dimensional collisions with before/after momentum.',
    difficulty: 'intermediate',
    tags: ['momentum', 'elastic', 'inelastic'],
    type: 'simulation',
    status: 'implemented'
  },
  {
    id: 'gravitation',
    title: 'Universal Gravitation',
    subject: 'physics',
    classLevel: 11,
    chapterId: 'physics-11-gravitation',
    description: 'Control two masses and separation distance to calculate Newtonian gravitational force.',
    difficulty: 'beginner',
    tags: ['gravity', 'inverse-square', 'force'],
    type: 'simulation',
    status: 'implemented'
  },
  {
    id: 'shm',
    title: 'Simple Harmonic Motion',
    subject: 'physics',
    classLevel: 11,
    chapterId: 'physics-11-oscillations',
    description: 'Animate a spring-mass oscillator and inspect position, velocity, acceleration, and energy graphs.',
    difficulty: 'intermediate',
    tags: ['oscillation', 'spring', 'energy', 'graph'],
    type: 'simulation',
    status: 'implemented'
  },
  {
    id: 'electric-field',
    title: 'Electric Field',
    subject: 'physics',
    classLevel: 12,
    chapterId: 'physics-12-electric-charges-and-fields',
    description: 'Place positive and negative charges and visualize electric field vectors from Coulomb’s law.',
    difficulty: 'advanced',
    tags: ['electricity', 'field', 'charge', 'coulomb'],
    type: 'simulation',
    status: 'implemented'
  },
  {
    id: 'ray-optics',
    title: 'Ray Optics Lens Lab',
    subject: 'physics',
    classLevel: 12,
    chapterId: 'physics-12-ray-optics',
    description: 'Move an object and change focal length to calculate image position, magnification, and orientation.',
    difficulty: 'intermediate',
    tags: ['lens', 'image', 'magnification', 'optics'],
    type: 'simulation',
    status: 'implemented'
  },
  {
    id: 'atomic-structure',
    title: 'Atomic Structure',
    subject: 'chemistry',
    classLevel: 11,
    chapterId: 'chemistry-11-structure-of-atom',
    description: 'Adjust protons, neutrons, and electrons to inspect atomic number, mass number, and net charge.',
    difficulty: 'beginner',
    tags: ['atom', 'nucleus', 'electron', 'ion'],
    type: 'simulation',
    status: 'implemented'
  },
  {
    id: 'electron-configuration',
    title: 'Electron Configuration',
    subject: 'chemistry',
    classLevel: 11,
    chapterId: 'chemistry-11-structure-of-atom',
    description: 'Fill orbital boxes using Aufbau order with Hund and Pauli rule annotations.',
    difficulty: 'intermediate',
    tags: ['orbital', 'aufbau', 'hund', 'pauli'],
    type: 'simulation',
    status: 'implemented'
  },
  {
    id: 'molecular-geometry',
    title: 'Molecular Geometry',
    subject: 'chemistry',
    classLevel: 11,
    chapterId: 'chemistry-11-chemical-bonding-and-molecular-structure',
    description: 'Rotate VSEPR 3D molecular shapes including linear, bent, trigonal planar, tetrahedral, trigonal pyramidal, trigonal bipyramidal, and octahedral.',
    difficulty: 'intermediate',
    tags: ['vsepr', 'shape', 'lone pair', 'bond angle'],
    type: 'simulation',
    status: 'implemented'
  },
  {
    id: 'hybridization',
    title: 'Hybridization',
    subject: 'chemistry',
    classLevel: 11,
    chapterId: 'chemistry-11-chemical-bonding-and-molecular-structure',
    description: 'Visualize sp, sp², and sp³ orbital orientation in 3D.',
    difficulty: 'intermediate',
    tags: ['orbital', 'sp', 'sp2', 'sp3'],
    type: 'simulation',
    status: 'implemented'
  },
  {
    id: 'gas-laws',
    title: 'Gas Laws Particle Box',
    subject: 'chemistry',
    classLevel: 11,
    chapterId: 'chemistry-11-thermodynamics',
    description: 'Simulate gas particles with temperature, volume, and particle count controls plus ideal gas relationships.',
    difficulty: 'intermediate',
    tags: ['ideal gas', 'temperature', 'pressure', 'volume'],
    type: 'simulation',
    status: 'implemented'
  },
  {
    id: 'titration',
    title: 'Virtual Titration',
    subject: 'chemistry',
    classLevel: 12,
    chapterId: 'chemistry-12-solutions',
    description: 'Run a strong acid/strong base titration with pH, indicator color, and titration curve.',
    difficulty: 'advanced',
    tags: ['acid base', 'ph', 'indicator', 'curve'],
    type: 'experiment',
    status: 'implemented'
  }
]

export const getChapter = (id: string) => chapters.find((chapterItem) => chapterItem.id === id)
export const getSimulation = (id: string) => simulations.find((simulation) => simulation.id === id)

export const searchableItems = [
  ...chapters.map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: `${item.subject} · Class ${item.classLevel}`,
    kind: 'Chapter',
    url: `/lab/${item.subject}?class=${item.classLevel}`,
    text: `${item.title} ${item.subject} class ${item.classLevel} ${item.concepts.join(' ')}`
  })),
  ...simulations.map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: `${item.subject} · Class ${item.classLevel}`,
    kind: item.type === 'experiment' ? 'Experiment' : 'Simulation',
    url: `/lab/simulations/${item.id}`,
    text: `${item.title} ${item.description} ${item.tags.join(' ')} ${item.subject} class ${item.classLevel}`
  }))
]
