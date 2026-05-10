import { useRef } from 'react'
import type { SearchMatch } from '../services/tauriApi'

type InputEditorProps = {
  value: string
  searchQuery: string
  matches: SearchMatch[]
  onChange: (value: string) => void
  onClearSource: () => void
  onPasteSource: () => void
}

function InputEditor({ value, searchQuery, matches, onChange, onClearSource, onPasteSource }: InputEditorProps) {
  const highlightRef = useRef<HTMLDivElement>(null)

  function handleScroll(event: React.UIEvent<HTMLTextAreaElement>) {
    if (!highlightRef.current) {
      return
    }

    highlightRef.current.scrollTop = event.currentTarget.scrollTop
    highlightRef.current.scrollLeft = event.currentTarget.scrollLeft
  }

  return (
    <section className="panel editor-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Input</p>
          <h2>原始内容</h2>
        </div>
        <div className="input-actions">
          <button className="secondary-button" type="button" onClick={onPasteSource}>
            粘贴
          </button>
          <button className="secondary-button" type="button" onClick={onClearSource}>
            清除
          </button>
        </div>
      </div>
      <div className="editor-stack">
        <div ref={highlightRef} className="editor-highlight-layer" aria-hidden="true">
          <pre className="editor-highlight-text">{renderHighlightedText(value, searchQuery, matches)}</pre>
        </div>
        <textarea
          className="editor editor-overlay"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onScroll={handleScroll}
          placeholder="请输入内容"
          spellCheck={false}
        />
      </div>
    </section>
  )
}

function renderHighlightedText(value: string, searchQuery: string, matches: SearchMatch[]) {
  if (!value) {
    return ' '
  }

  if (!searchQuery || !matches.length) {
    return <span>{value}</span>
  }

  const parts: Array<{ text: string; highlighted: boolean }> = []
  let cursor = 0

  matches.forEach((match) => {
    if (cursor < match.start) {
      parts.push({ text: value.slice(cursor, match.start), highlighted: false })
    }

    parts.push({ text: value.slice(match.start, match.end), highlighted: true })
    cursor = match.end
  })

  if (cursor < value.length) {
    parts.push({ text: value.slice(cursor), highlighted: false })
  }

  return parts.map((part, index) =>
    part.highlighted ? (
      <mark key={`${part.text}-${index}`}>{part.text}</mark>
    ) : (
      <span key={`${part.text}-${index}`}>{part.text}</span>
    ),
  )
}

export default InputEditor
