import { useRef, type RefObject } from 'react'
import type { SearchMatch } from '../services/tauriApi'

type InputEditorProps = {
  editorRef: RefObject<HTMLTextAreaElement | null>
  value: string
  searchQuery: string
  matches: SearchMatch[]
  text: {
    eyebrow: string
    title: string
    copy: string
    paste: string
    clear: string
    lineTools: string
    reverseLines: string
    deduplicateLines: string
    sortLines: string
    commaToLines: string
    placeholder: string
  }
  onChange: (value: string) => void
  onCopySource: () => void
  onClearSource: () => void
  onPasteSource: () => void
  onReverseLines: () => void
  onDeduplicateLines: () => void
  onSortLines: () => void
  onCommaValuesToLines: () => void
}

function InputEditor({
  editorRef,
  value,
  searchQuery,
  matches,
  text,
  onChange,
  onCopySource,
  onClearSource,
  onPasteSource,
  onReverseLines,
  onDeduplicateLines,
  onSortLines,
  onCommaValuesToLines,
}: InputEditorProps) {
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
          <p className="eyebrow">{text.eyebrow}</p>
          <h2>{text.title}</h2>
        </div>
        <div className="input-actions">
          <button className="secondary-button" type="button" onClick={onCopySource}>
            {text.copy}
          </button>
          <button className="secondary-button" type="button" onClick={onPasteSource}>
            {text.paste}
          </button>
          <button className="secondary-button" type="button" onClick={onClearSource}>
            {text.clear}
          </button>
        </div>
      </div>
      <div className="line-action-bar" aria-label={text.lineTools}>
        <span>{text.lineTools}</span>
        <button className="line-action-button" type="button" onClick={onReverseLines}>
          {text.reverseLines}
        </button>
        <button className="line-action-button" type="button" onClick={onDeduplicateLines}>
          {text.deduplicateLines}
        </button>
        <button className="line-action-button" type="button" onClick={onSortLines}>
          {text.sortLines}
        </button>
        <button className="line-action-button" type="button" onClick={onCommaValuesToLines}>
          {text.commaToLines}
        </button>
      </div>
      <div className="editor-stack">
        <div ref={highlightRef} className="editor-highlight-layer" aria-hidden="true">
          <pre className="editor-highlight-text">{renderHighlightedText(value, searchQuery, matches)}</pre>
        </div>
        <textarea
          ref={editorRef}
          className="editor editor-overlay"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onScroll={handleScroll}
          placeholder={text.placeholder}
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
