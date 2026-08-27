/**
 * Physical constants, CODATA 2018 values, in SI base units.
 *
 * Every simulation and science module imports from here rather than inlining a
 * literal. NCERT textbook problems usually round `g` to 9.8 and `k` to 9e9, so
 * both the exact and the textbook value are exported where they differ — pick
 * the textbook one when the goal is for a student's hand-worked answer to match
 * the screen, and the exact one for anything cumulative.
 */

/** Speed of light in vacuum (m/s), exact by definition. */
export const SPEED_OF_LIGHT = 2.99792458e8

/** Elementary charge (C). */
export const ELEMENTARY_CHARGE = 1.602176634e-19

/** Planck constant (J·s), exact by definition. */
export const PLANCK = 6.62607015e-34

/** Reduced Planck constant ħ = h/2π (J·s). */
export const H_BAR = PLANCK / (2 * Math.PI)

/** Avogadro constant (1/mol), exact by definition. */
export const AVOGADRO = 6.02214076e23

/** Boltzmann constant (J/K), exact by definition. */
export const BOLTZMANN = 1.380649e-23

/** Molar gas constant R = N_A·k_B (J·mol⁻¹·K⁻¹). */
export const GAS_CONSTANT = AVOGADRO * BOLTZMANN

/** Molar gas constant in L·atm·mol⁻¹·K⁻¹ — the form NCERT gas-law problems use. */
export const GAS_CONSTANT_L_ATM = 0.0820573660809596

/** Newtonian constant of gravitation (N·m²/kg²). */
export const GRAVITATIONAL_CONSTANT = 6.6743e-11

/** Standard gravity at Earth's surface (m/s²). */
export const STANDARD_GRAVITY = 9.80665

/** The value NCERT problems use for g, so hand-worked answers match the screen. */
export const TEXTBOOK_GRAVITY = 9.8

/** Vacuum electric permittivity (F/m). */
export const EPSILON_0 = 8.8541878128e-12

/** Vacuum magnetic permeability (N/A²). */
export const MU_0 = 1.25663706212e-6

/** Coulomb constant k = 1/(4πε₀) (N·m²/C²). */
export const COULOMB_CONSTANT = 1 / (4 * Math.PI * EPSILON_0)

/** The rounded Coulomb constant NCERT uses: 9 × 10⁹ N·m²/C². */
export const TEXTBOOK_COULOMB_CONSTANT = 9e9

/** Electron rest mass (kg). */
export const ELECTRON_MASS = 9.1093837015e-31

/** Proton rest mass (kg). */
export const PROTON_MASS = 1.67262192369e-27

/** Neutron rest mass (kg). */
export const NEUTRON_MASS = 1.67492749804e-27

/** Unified atomic mass unit (kg). */
export const ATOMIC_MASS_UNIT = 1.66053906660e-27

/** Bohr radius a₀ (m). */
export const BOHR_RADIUS = 5.29177210903e-11

/** Rydberg energy — the ionisation energy of hydrogen, 13.6 eV, in joules. */
export const RYDBERG_ENERGY = 2.1798723611035e-18

/** Ionisation energy of hydrogen in electronvolts, as NCERT quotes it. */
export const RYDBERG_ENERGY_EV = 13.605693122994

/** One electronvolt in joules. */
export const ELECTRON_VOLT = ELEMENTARY_CHARGE

/** Standard atmospheric pressure (Pa). */
export const ATMOSPHERE = 101325

/** Ion product of water at 298 K. */
export const KW_298 = 1.0e-14

/** 0 °C expressed in kelvin. */
export const ZERO_CELSIUS = 273.15

/** Standard temperature for STP as NCERT defines it (273.15 K). */
export const STP_TEMPERATURE = ZERO_CELSIUS

/** Molar volume of an ideal gas at STP (L/mol) — the familiar 22.4 L. */
export const MOLAR_VOLUME_STP = 22.413969545014

/** Faraday constant (C/mol). */
export const FARADAY = AVOGADRO * ELEMENTARY_CHARGE

/** Earth's mass (kg). */
export const EARTH_MASS = 5.9722e24

/** Earth's mean radius (m). */
export const EARTH_RADIUS = 6.371e6

/** Moon's mass (kg). */
export const MOON_MASS = 7.342e22

/** Mean Earth–Moon distance (m). */
export const EARTH_MOON_DISTANCE = 3.844e8

/** Convert degrees to radians. */
export const DEG = Math.PI / 180

/** Convert radians to degrees. */
export const RAD = 180 / Math.PI
