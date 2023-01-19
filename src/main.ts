import Alpine from 'alpinejs'

import ts from 'typescript'

import testCode from '@assets/test.ts?raw'

// import testCode from '../assets/test.ts?raw'
// import testCode from './assets/test.ts?raw'

(window as any).Alpine = Alpine

// console.log('babylon url: '+babylonUrl)

document.querySelector<HTMLDivElement>('#app')!.innerHTML = /* html */`
<a href="/fake/route">
  <img src="/vite.svg" class="logo" alt="Vite logo" />
</a>
<a href="/another/route">
  <img src="typescript.svg" class="logo vanilla" alt="TypeScript logo" />
</a>
<h1 x-data="{ message: 'I ❤️ Vite + TypeScript + Alpine' }" x-text="message"></h1>
<div x-data="{ count: 0 }" class="card">
  <button id="counter" type="button" x-on:click="count += 1">Count: <span x-text="count"></span></button>
</div>
<p class="read-the-docs">
  Click on the Vite and TypeScript logos to learn more
</p>
`

Alpine.start()

const compilerOptions: ts.CompilerOptions = {
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ESNext,
  removeComments: true,
  //target: ts.ScriptTarget.ES5
  // paths: {
  //   '*': 'node_modules'
  // }
}
// const compilerOptions = tsConfigJson.compilerOptions

function firstParent(node: ts.Node, kind: ts.SyntaxKind): ts.Node | null {
  if (node == null || node.parent == null) return null
  if (node.parent.kind == kind) return node.parent
  return firstParent(node.parent, kind)

}


export async function importModuleFromString(text: string) {

  const sourceFile = ts.createSourceFile(
    'test.ts', text, ts.ScriptTarget.Latest, true
  )
  const transformerFactory: ts.TransformerFactory<ts.Node> = (
    context: ts.TransformationContext
  ) => {
    return (rootNode) => {
      function visit(_node: ts.Node): ts.Node {
        _node = ts.visitEachChild(_node, visit, context)

        if (ts.isPropertyAssignment(_node)) {
          const node = _node as ts.PropertyAssignment
          // console.log('property '+(node.name as ts.Identifier).text)
          if (node.name.getText() == 'diameter') {
            let parent = firstParent(node, ts.SyntaxKind.VariableDeclaration) as ts.VariableDeclaration
            if (parent && parent.name.getText() == 'otherSphere') {
              return context.factory.updatePropertyAssignment(node, context.factory.createStringLiteral('diameter'),
                context.factory.createNumericLiteral(1.0)
              )
            }
            // return context.factory.createPropertyAssignment('diameter',
            //   context.factory.createNumericLiteral(3.0)
            // )
          }
          return node
        } else {
          // console.log('node? '+ts.SyntaxKind[_node.kind])
          return _node
        }
      }
      
      return ts.visitNode(rootNode, visit)
    }
  }

  const transformationResult = ts.transform(
    sourceFile, [transformerFactory]
  )
  console.log(transformationResult)
  let transformedNode = transformationResult.transformed[0] as ts.SourceFile

  const printer = ts.createPrinter();

  const transformedText = printer.printNode(
      ts.EmitHint.Unspecified,
      transformedNode,
      sourceFile
  );

  const js = ts.transpileModule(transformedText, { compilerOptions }).outputText

  // console.log(transformedText)
  // console.log(js)

  const blobData = new Blob([js], {
    type: 'text/javascript'
  })
  const url = URL.createObjectURL(blobData)
  return import(url)
}

let refreshing = false
navigator.serviceWorker.addEventListener('controllerchange', () => {
  if (!refreshing) {
    // TODO: Show notification to refresh page.
    window.location.href = '/'
    refreshing = true
  }
})

async function compile() {
  const game = await importModuleFromString(testCode)
  console.log('Loaded game!')
  console.log('testing 123!')
  
  document.querySelector<HTMLDivElement>('#app')!.innerHTML += game.html
	const canvas = document.getElementById("game") as HTMLCanvasElement
  game.start(canvas)
}
compile()