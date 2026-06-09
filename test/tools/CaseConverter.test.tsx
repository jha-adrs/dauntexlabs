import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CaseConverter from '@/components/tools/CaseConverter'

function getInputArea() {
  return screen.getByPlaceholderText('Enter text to convert — e.g. hello world, helloWorld, hello-world…')
}

/**
 * Find the value displayed next to a case label.
 * The component renders each case row as: <span>{label}</span> <code>{value}</code>
 */
function getCaseValue(label: string): string {
  // Find the label span, then get the sibling code element
  const labelEl = screen.getByText(label)
  // The code is a sibling in the same container div
  const container = labelEl.parentElement!
  const code = container.querySelector('code')
  return code?.textContent ?? ''
}

describe('CaseConverter', () => {
  it('renders all case labels in empty state', () => {
    render(<CaseConverter />)
    const labels = [
      'camelCase', 'PascalCase', 'snake_case', 'CONSTANT_CASE',
      'kebab-case', 'Title Case', 'Sentence case', 'lower case',
      'UPPER CASE', 'dot.case',
    ]
    for (const label of labels) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('converts "hello world" to all cases correctly', () => {
    render(<CaseConverter />)
    fireEvent.change(getInputArea(), { target: { value: 'hello world' } })
    expect(getCaseValue('camelCase')).toBe('helloWorld')
    expect(getCaseValue('PascalCase')).toBe('HelloWorld')
    expect(getCaseValue('snake_case')).toBe('hello_world')
    expect(getCaseValue('CONSTANT_CASE')).toBe('HELLO_WORLD')
    expect(getCaseValue('kebab-case')).toBe('hello-world')
    expect(getCaseValue('Title Case')).toBe('Hello World')
    expect(getCaseValue('Sentence case')).toBe('Hello world')
    expect(getCaseValue('lower case')).toBe('hello world')
    expect(getCaseValue('UPPER CASE')).toBe('HELLO WORLD')
    expect(getCaseValue('dot.case')).toBe('hello.world')
  })

  it('handles camelCase input "helloWorld"', () => {
    render(<CaseConverter />)
    fireEvent.change(getInputArea(), { target: { value: 'helloWorld' } })
    expect(getCaseValue('snake_case')).toBe('hello_world')
    expect(getCaseValue('kebab-case')).toBe('hello-world')
    expect(getCaseValue('CONSTANT_CASE')).toBe('HELLO_WORLD')
  })

  it('handles kebab-case input "example-tool-name"', () => {
    render(<CaseConverter />)
    fireEvent.change(getInputArea(), { target: { value: 'example-tool-name' } })
    expect(getCaseValue('camelCase')).toBe('exampleToolName')
    expect(getCaseValue('PascalCase')).toBe('ExampleToolName')
    expect(getCaseValue('snake_case')).toBe('example_tool_name')
    expect(getCaseValue('CONSTANT_CASE')).toBe('EXAMPLE_TOOL_NAME')
  })

  it('handles snake_case input "my_variable_name"', () => {
    render(<CaseConverter />)
    fireEvent.change(getInputArea(), { target: { value: 'my_variable_name' } })
    expect(getCaseValue('camelCase')).toBe('myVariableName')
    expect(getCaseValue('kebab-case')).toBe('my-variable-name')
    expect(getCaseValue('Title Case')).toBe('My Variable Name')
  })

  it('handles mixed input "helloWorld example-tool_name"', () => {
    render(<CaseConverter />)
    // splitWords("helloWorld example-tool_name"):
    //   1. camelCase expand: "hello World example-tool_name"
    //   2. split on non-alnum: ["hello", "World", "example", "tool", "name"]
    // camelCase: first word lowercased as-is, rest capitalised
    fireEvent.change(getInputArea(), { target: { value: 'helloWorld example-tool_name' } })
    expect(getCaseValue('camelCase')).toBe('helloWorldExampleToolName')
    expect(getCaseValue('snake_case')).toBe('hello_world_example_tool_name')
    expect(getCaseValue('CONSTANT_CASE')).toBe('HELLO_WORLD_EXAMPLE_TOOL_NAME')
    expect(getCaseValue('kebab-case')).toBe('hello-world-example-tool-name')
  })

  it('shows empty dash when input is blank', () => {
    render(<CaseConverter />)
    // When input is empty, code elements show an em-dash "—"
    const codes = screen.getAllByRole('code')
    // All code elements should be empty values (shown as "—")
    for (const code of codes) {
      expect(code.textContent).toBe('—')
    }
  })

  it('handles PascalCase input "MyComponentName"', () => {
    render(<CaseConverter />)
    fireEvent.change(getInputArea(), { target: { value: 'MyComponentName' } })
    expect(getCaseValue('camelCase')).toBe('myComponentName')
    expect(getCaseValue('snake_case')).toBe('my_component_name')
    expect(getCaseValue('kebab-case')).toBe('my-component-name')
  })
})
