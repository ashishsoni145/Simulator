import { Fragment } from 'react'
import type { ReactNode } from 'react'

/**
 * Textbook-shaped formulas without a maths library.
 *
 * Adding KaTeX or MathJax would mean a megabyte of JavaScript and a webfont
 * download for what these simulations actually need: stacked fractions,
 * superscripts, subscripts and the occasional radical. So there is a small markup
 * instead, rendered with CSS grid, which weighs nothing and inherits the page font.
 *
 *   `{u² sin 2θ}/{g}`   → a stacked fraction
 *   `v^{2}`             → superscript
 *   `x_{0}`             → subscript
 *   `√{2gh}`            → radical with an overline
 *
 * Unbalanced or unrecognised markup renders as literal text rather than throwing,
 * because a formula that fails to parse should still be readable.
 */

type Node =
  | { kind: 'text'; value: string }
  | { kind: 'frac'; num: Node[]; den: Node[] }
  | { kind: 'sup'; body: Node[] }
  | { kind: 'sub'; body: Node[] }
  | { kind: 'sqrt'; body: Node[] }
  | { kind: 'group'; body: Node[] }

/** Reads a `{…}` group starting at `open`, honouring nesting. */
function readGroup(input: string, open: number): { content: string; next: number } | null {
  if (input[open] !== '{') return null
  let depth = 0
  for (let i = open; i < input.length; i += 1) {
    if (input[i] === '{') depth += 1
    else if (input[i] === '}') {
      depth -= 1
      if (depth === 0) return { content: input.slice(open + 1, i), next: i + 1 }
    }
  }
  return null
}

function parse(input: string): Node[] {
  const nodes: Node[] = []
  let text = ''
  let i = 0

  const flush = () => {
    if (text.length > 0) {
      nodes.push({ kind: 'text', value: text })
      text = ''
    }
  }

  while (i < input.length) {
    const char = input[i] as string

    if (char === '{') {
      const group = readGroup(input, i)
      if (!group) {
        text += char
        i += 1
        continue
      }
      // A group followed by `/{…}` is a fraction; otherwise it is just a group.
      if (input[group.next] === '/' && input[group.next + 1] === '{') {
        const den = readGroup(input, group.next + 1)
        if (den) {
          flush()
          nodes.push({ kind: 'frac', num: parse(group.content), den: parse(den.content) })
          i = den.next
          continue
        }
      }
      flush()
      nodes.push({ kind: 'group', body: parse(group.content) })
      i = group.next
      continue
    }

    if ((char === '^' || char === '_') && input[i + 1] === '{') {
      const group = readGroup(input, i + 1)
      if (group) {
        flush()
        nodes.push({ kind: char === '^' ? 'sup' : 'sub', body: parse(group.content) })
        i = group.next
        continue
      }
    }

    if (char === '√' && input[i + 1] === '{') {
      const group = readGroup(input, i + 1)
      if (group) {
        flush()
        nodes.push({ kind: 'sqrt', body: parse(group.content) })
        i = group.next
        continue
      }
    }

    text += char
    i += 1
  }

  flush()
  return nodes
}

function render(nodes: Node[], keyPrefix = ''): ReactNode {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`
    switch (node.kind) {
      case 'text':
        return <Fragment key={key}>{node.value}</Fragment>
      case 'group':
        return <Fragment key={key}>{render(node.body, key)}</Fragment>
      case 'sup':
        return <sup key={key}>{render(node.body, key)}</sup>
      case 'sub':
        return <sub key={key}>{render(node.body, key)}</sub>
      case 'sqrt':
        return (
          <span className="math__sqrt" key={key}>
            <span className="math__radical" aria-hidden="true">
              √
            </span>
            <span className="math__radicand">{render(node.body, key)}</span>
          </span>
        )
      case 'frac':
        return (
          <span className="math__frac" key={key}>
            <span className="math__num">{render(node.num, `${key}n`)}</span>
            <span className="math__bar" aria-hidden="true" />
            <span className="math__den">{render(node.den, `${key}d`)}</span>
          </span>
        )
      default:
        return null
    }
  })
}

/**
 * A plain-text rendering of the same markup, for `aria-label` and `title` — a
 * screen reader reading the DOM of a stacked fraction would otherwise hear
 * "u squared sin 2 theta g" with no division in it at all.
 */
export function mathToText(source: string): string {
  const walk = (nodes: Node[]): string =>
    nodes
      .map((node) => {
        switch (node.kind) {
          case 'text':
            return node.value
          case 'group':
            return walk(node.body)
          case 'sup':
            return ` to the power ${walk(node.body)} `
          case 'sub':
            return ` sub ${walk(node.body)} `
          case 'sqrt':
            return ` square root of (${walk(node.body)}) `
          case 'frac':
            return ` (${walk(node.num)}) divided by (${walk(node.den)}) `
          default:
            return ''
        }
      })
      .join('')
  return walk(parse(source)).replace(/\s+/g, ' ').trim()
}

export interface MathTextProps {
  children: string
  /** Render at display size, centred on its own line. */
  display?: boolean
  className?: string
}

export default function MathText({ children, display = false, className }: MathTextProps) {
  const nodes = parse(children)
  const classes = ['math']
  if (display) classes.push('math--display')
  if (className) classes.push(className)
  return (
    <span className={classes.join(' ')} role="math" aria-label={mathToText(children)}>
      <span aria-hidden="true">{render(nodes)}</span>
    </span>
  )
}
