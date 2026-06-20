import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GitignoreGenerator from '@/components/tools/GitignoreGenerator'

function getOutput(): string {
  const ta = document.querySelector('textarea[readonly]') as HTMLTextAreaElement | null
  return ta?.value ?? ''
}

function toggle(label: string) {
  fireEvent.click(screen.getByLabelText(label))
}

describe('GitignoreGenerator', () => {
  it('shows placeholder notice when nothing is selected', () => {
    render(<GitignoreGenerator />)
    expect(screen.getByText(/Select one or more templates/i)).toBeInTheDocument()
    expect(document.querySelector('textarea[readonly]')).toBeNull()
  })

  it('selecting Node includes node_modules/', () => {
    render(<GitignoreGenerator />)
    toggle('Node')
    expect(getOutput()).toContain('node_modules/')
  })

  it('selecting macOS includes .DS_Store', () => {
    render(<GitignoreGenerator />)
    toggle('macOS')
    expect(getOutput()).toContain('.DS_Store')
  })

  it('selecting Python includes __pycache__/', () => {
    render(<GitignoreGenerator />)
    toggle('Python')
    expect(getOutput()).toContain('__pycache__/')
  })

  it('output includes section header for each selected template', () => {
    render(<GitignoreGenerator />)
    toggle('Node')
    toggle('Go')
    const out = getOutput()
    expect(out).toContain('# === Node ===')
    expect(out).toContain('# === Go ===')
  })

  it('selecting multiple templates concatenates them all', () => {
    render(<GitignoreGenerator />)
    toggle('Node')
    toggle('Python')
    toggle('macOS')
    const out = getOutput()
    expect(out).toContain('node_modules/')
    expect(out).toContain('__pycache__/')
    expect(out).toContain('.DS_Store')
  })

  it('deselecting a template removes its content', () => {
    render(<GitignoreGenerator />)
    toggle('Node')
    toggle('Python')
    let out = getOutput()
    expect(out).toContain('node_modules/')
    expect(out).toContain('__pycache__/')

    // Deselect Node
    toggle('Node')
    out = getOutput()
    expect(out).not.toContain('node_modules/')
    expect(out).toContain('__pycache__/')
  })

  it('deselecting all templates returns to placeholder notice', () => {
    render(<GitignoreGenerator />)
    toggle('Rust')
    expect(getOutput()).toContain('/target/')
    toggle('Rust')
    expect(screen.getByText(/Select one or more templates/i)).toBeInTheDocument()
  })

  it('Windows template includes $RECYCLE.BIN/', () => {
    render(<GitignoreGenerator />)
    toggle('Windows')
    expect(getOutput()).toContain('$RECYCLE.BIN/')
  })

  it('VS Code template includes .vscode/*', () => {
    render(<GitignoreGenerator />)
    toggle('VS Code')
    expect(getOutput()).toContain('.vscode/*')
  })

  it('JetBrains template includes .idea/', () => {
    render(<GitignoreGenerator />)
    toggle('JetBrains')
    expect(getOutput()).toContain('.idea/')
  })

  it('Java template includes *.class', () => {
    render(<GitignoreGenerator />)
    toggle('Java')
    expect(getOutput()).toContain('*.class')
  })

  it('Linux template includes .Trash-*', () => {
    render(<GitignoreGenerator />)
    toggle('Linux')
    expect(getOutput()).toContain('.Trash-*')
  })

  it('Go template includes *.exe', () => {
    render(<GitignoreGenerator />)
    toggle('Go')
    expect(getOutput()).toContain('*.exe')
  })
})
