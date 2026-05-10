import { useEffect, useMemo, useState } from 'react'
import './App.css'
import InputEditor from './components/InputEditor'
import ResultView from './components/ResultView'
import Toolbar from './components/Toolbar'
import {
  convertAllFormats,
  commaValuesToLines,
  deduplicateLines,
  readClipboardText,
  replaceText,
  searchMatches,
  sortLinesAscending,
  writeClipboardText,
  type ResultOutput,
  type SearchMatch,
} from './services/tauriApi'

function App() {
  const [sourceText, setSourceText] = useState('')
  const [ignoreEmptyLines, setIgnoreEmptyLines] = useState(true)
  const [replaceQuery, setReplaceQuery] = useState('')
  const [replaceWith, setReplaceWith] = useState('')
  const [sourceMatches, setSourceMatches] = useState<SearchMatch[]>([])
  const [resultOutputs, setResultOutputs] = useState<ResultOutput[]>([])
  const [status, setStatus] = useState('Ready')
  const [toastMessage, setToastMessage] = useState('')

  const lineCount = useMemo(() => {
    if (!sourceText.length) {
      return 0
    }

    return sourceText.split('\n').length
  }, [sourceText])

  useEffect(() => {
    void refreshMatches(sourceText, replaceQuery)
  }, [sourceText, replaceQuery])

  useEffect(() => {
    void runConvert(sourceText)
  }, [ignoreEmptyLines])

  useEffect(() => {
    if (!toastMessage) {
      return
    }

    const timer = window.setTimeout(() => setToastMessage(''), 1600)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  async function runConvert(nextSourceText = sourceText) {
    const outputs = await convertAllFormats(nextSourceText, ignoreEmptyLines)
    setResultOutputs(outputs)
    setStatus('Converted')
  }

  async function runReplace() {
    const result = await replaceText(sourceText, replaceQuery, replaceWith)
    setSourceText(result.output)
    await runConvert(result.output)
    setStatus(replaceQuery ? 'Replaced source text' : 'No search term')
  }

  async function refreshMatches(text: string, query: string) {
    if (!query) {
      setSourceMatches([])
      return
    }

    const result = await searchMatches(text, query, false)
    setSourceMatches(result.matches)
  }

  async function handleReverseLines() {
    const reversedText = reverseLinesLocal(sourceText)
    setSourceText(reversedText)
    await runConvert(reversedText)
    setStatus('Reversed source lines')
  }

  async function handleDeduplicateLines() {
    const result = await deduplicateLines(sourceText)
    setSourceText(result.output)
    await runConvert(result.output)
    setStatus('Deduplicated source lines')
  }

  async function handleSortLines() {
    const result = await sortLinesAscending(sourceText)
    setSourceText(result.output)
    await runConvert(result.output)
    setStatus('Sorted source lines')
  }

  async function handleCommaValuesToLines() {
    const result = await commaValuesToLines(sourceText)
    setSourceText(result.output)
    await runConvert(result.output)
    setStatus('Converted comma values to lines')
  }

  async function handleClearSource() {
    setSourceText('')
    await runConvert('')
    setStatus('Cleared source text')
  }

  async function handlePasteSource() {
    const text = await readClipboardText()
    setSourceText(text)
    await runConvert(text)
    setStatus('Pasted from clipboard')
  }

  async function handleCopy(output: string, label: string) {
    if (!output) {
      return
    }

    await writeClipboardText(output)
    setStatus(`Copied ${label}`)
    setToastMessage('已复制')
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Text Utility</p>
          <h1>文本处理工作台</h1>
        </div>
        <div className="header-metrics" aria-label="Current document status">
          <span>{status}</span>
          <span>{lineCount} lines</span>
          <span>{sourceMatches.length} matches</span>
        </div>
      </header>

      <section className="workspace-grid">
        <div className="workbench-column source-column">
          <Toolbar
            replaceQuery={replaceQuery}
            replaceWith={replaceWith}
            matchCount={sourceMatches.length}
            onReplaceQueryChange={setReplaceQuery}
            onReplaceWithChange={setReplaceWith}
            onReplace={() => void runReplace()}
            onReverseLines={() => void handleReverseLines()}
            onDeduplicateLines={() => void handleDeduplicateLines()}
            onSortLines={() => void handleSortLines()}
            onCommaValuesToLines={() => void handleCommaValuesToLines()}
          />
          <InputEditor
            value={sourceText}
            searchQuery={replaceQuery}
            matches={sourceMatches}
            onChange={setSourceText}
            onClearSource={() => void handleClearSource()}
            onPasteSource={() => void handlePasteSource()}
          />
        </div>

        <ResultView
          ignoreEmptyLines={ignoreEmptyLines}
          outputs={resultOutputs}
          onIgnoreEmptyLinesChange={setIgnoreEmptyLines}
          onConvert={() => void runConvert()}
          onCopy={(output, label) => void handleCopy(output, label)}
        />
      </section>

      <footer className="status-bar">
        <span>Ready for UTF-8 source text</span>
        <span>UTF-8</span>
        <span>Local processing</span>
      </footer>

      {toastMessage ? (
        <div className="toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      ) : null}
    </main>
  )
}

function reverseLinesLocal(value: string) {
  return value.split('\n').reverse().join('\n')
}

export default App
