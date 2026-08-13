import { Component, type ErrorInfo, type ReactNode } from 'react'
import SimulationError from './SimulationError'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class SimulationErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Simulation crashed', error, info)
  }

  render() {
    if (this.state.hasError) return <SimulationError />
    return this.props.children
  }
}
