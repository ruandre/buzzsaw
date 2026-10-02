import type { SoundDefinition } from '@rjvr/buzzsaw'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { buildRegisterAllSnippet, buildSnippets } from '.'

const definition: SoundDefinition = { frequency: 440, duration: 0.2 }
const hostileName = `x'); alert(1); ('`

function syntaxErrors(code: string): string[] {
  const { diagnostics = [] } = ts.transpileModule(code, { fileName: 'snippet.ts', reportDiagnostics: true })
  return diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
}

function literalArguments(code: string): string[] {
  const literals: string[] = []
  const visit = (node: ts.Node): void => {
    if ((ts.isCallExpression(node) || ts.isNewExpression(node)) && node.arguments)
      literals.push(...node.arguments.filter(ts.isStringLiteral).map(argument => argument.text))
    ts.forEachChild(node, visit)
  }
  visit(ts.createSourceFile('snippet.ts', code, ts.ScriptTarget.Latest))
  return literals
}

function snippetCode(name: string, id: string): string {
  return buildSnippets(name, definition).find(snippet => snippet.id === id)!.code
}

describe('buildSnippets', () => {
  it('quotes an ordinary name as a plain single-quoted literal', () => {
    const code = snippetCode('laser', 'core')

    expect(code).toContain(`new SoundManager().register('laser', `)
    expect(code).toContain(`await sounds.play('laser')`)
    expect(code).toContain(`const laser = new Sound('laser', `)
  })

  it('names the wav download after an ordinary name', () => {
    expect(snippetCode('laser', 'wav')).toContain(`downloadWav(definition, 'laser.wav')`)
  })

  it('escapes a name that tries to break out of its literal', () => {
    expect(snippetCode(hostileName, 'core')).toContain(`await sounds.play('x\\'); alert(1); (\\'')`)
  })

  it('keeps a hostile name inside each core literal', () => {
    const code = snippetCode(hostileName, 'core')

    expect(syntaxErrors(code)).toEqual([])
    expect(literalArguments(code).filter(literal => literal === hostileName)).toHaveLength(3)
  })

  it('keeps a hostile name inside the wav file name', () => {
    expect(literalArguments(snippetCode(hostileName, 'wav'))).toContain(`${hostileName}.wav`)
  })

  it('keeps the vanilla snippet parseable for a hostile name', () => {
    expect(syntaxErrors(snippetCode(hostileName, 'vanilla'))).toEqual([])
  })

  it.each([`back\\slash`, `double"quote`, 'line\nbreak', 'para\u2028graph'])('keeps %j inside its literal', (name) => {
    expect(literalArguments(snippetCode(name, 'core'))).toContain(name)
  })

  it.each(['class', 'await', 'default'])('avoids the reserved word %s as a variable name', (name) => {
    expect(syntaxErrors(snippetCode(name, 'core'))).toEqual([])
  })

  it.each(['sounds', 'handle', 'Sound', 'SoundManager'])('avoids shadowing the snippet\'s own %s binding', (name) => {
    expect(snippetCode(name, 'core')).toContain(`const _${name} = new Sound('${name}', `)
  })
})

describe('buildRegisterAllSnippet', () => {
  it('plays the first sound by its ordinary name', () => {
    expect(buildRegisterAllSnippet({ laser: definition }).code).toContain(`await sounds.play('laser')`)
  })

  it('keeps a hostile name inside the play literal', () => {
    const { code } = buildRegisterAllSnippet({ [hostileName]: definition })

    expect(syntaxErrors(code)).toEqual([])
    expect(literalArguments(code)).toContain(hostileName)
  })
})
