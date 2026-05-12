import { useRef, type RefObject } from 'react'

type InputEditorProps = {
  editorRef: RefObject<HTMLTextAreaElement | null>
  value: string
  numericSort: boolean
  showLineNumbers: boolean
  softWrap: boolean
  text: {
    copy: string
    paste: string
    clear: string
    lineTools: string
    reverseLines: string
    deduplicateLines: string
    sortLines: string
    sortLinesDescending: string
    numericSort: string
    commaToLines: string
    placeholder: string
  }
  onChange: (value: string) => void
  onNumericSortChange: (value: boolean) => void
  onCopySource: () => void
  onClearSource: () => void
  onPasteSource: () => void
  onReverseLines: () => void
  onDeduplicateLines: () => void
  onSortLines: () => void
  onSortLinesDescending: () => void
  onCommaValuesToLines: () => void
}

function InputEditor({
  editorRef,
  value,
  numericSort,
  showLineNumbers,
  softWrap,
  text,
  onChange,
  onNumericSortChange,
  onCopySource,
  onClearSource,
  onPasteSource,
  onReverseLines,
  onDeduplicateLines,
  onSortLines,
  onSortLinesDescending,
  onCommaValuesToLines,
}: InputEditorProps) {
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const lineNumbers = value.split('\n').map((_, index) => index + 1)

  function handleScroll(event: React.UIEvent<HTMLTextAreaElement>) {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = event.currentTarget.scrollTop
    }
  }

  function runToolbarAction(event: React.PointerEvent<HTMLButtonElement>, action: () => void) {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }

    event.preventDefault()
    action()
  }

  function runKeyboardAction(event: React.MouseEvent<HTMLButtonElement>, action: () => void) {
    if (event.detail === 0) {
      action()
    }
  }

  return (
    <section className="panel editor-panel">
      <div className="editor-toolbar" aria-label={text.lineTools}>
        <div className="line-action-bar">
          <div className="sort-action-group">
            <button
              className="line-action-button"
              type="button"
              onPointerDown={(event) => runToolbarAction(event, onSortLines)}
              onClick={(event) => runKeyboardAction(event, onSortLines)}
            >
              {text.sortLines}
            </button>
            <button
              className="line-action-button"
              type="button"
              onPointerDown={(event) => runToolbarAction(event, onSortLinesDescending)}
              onClick={(event) => runKeyboardAction(event, onSortLinesDescending)}
            >
              {text.sortLinesDescending}
            </button>
            <button
              className={numericSort ? 'sort-option-toggle active' : 'sort-option-toggle'}
              type="button"
              aria-pressed={numericSort}
              aria-label={text.numericSort}
              onClick={() => onNumericSortChange(!numericSort)}
            >
              <span className="toggle-track" aria-hidden="true">
                <span className="toggle-thumb" />
              </span>
              <span>{text.numericSort}</span>
            </button>
          </div>
          <div className="line-transform-group">
            <button
              className="line-action-button"
              type="button"
              onPointerDown={(event) => runToolbarAction(event, onReverseLines)}
              onClick={(event) => runKeyboardAction(event, onReverseLines)}
            >
              {text.reverseLines}
            </button>
            <button
              className="line-action-button"
              type="button"
              onPointerDown={(event) => runToolbarAction(event, onDeduplicateLines)}
              onClick={(event) => runKeyboardAction(event, onDeduplicateLines)}
            >
              {text.deduplicateLines}
            </button>
            <button
              className="line-action-button"
              type="button"
              onPointerDown={(event) => runToolbarAction(event, onCommaValuesToLines)}
              onClick={(event) => runKeyboardAction(event, onCommaValuesToLines)}
            >
              {text.commaToLines}
            </button>
          </div>
        </div>
        <div className="input-actions">
          <button
            className="secondary-button"
            type="button"
            onPointerDown={(event) => runToolbarAction(event, onCopySource)}
            onClick={(event) => runKeyboardAction(event, onCopySource)}
          >
            {text.copy}
          </button>
          <button
            className="secondary-button"
            type="button"
            onPointerDown={(event) => runToolbarAction(event, onPasteSource)}
            onClick={(event) => runKeyboardAction(event, onPasteSource)}
          >
            {text.paste}
          </button>
          <button
            className="secondary-button"
            type="button"
            onPointerDown={(event) => runToolbarAction(event, onClearSource)}
            onClick={(event) => runKeyboardAction(event, onClearSource)}
          >
            {text.clear}
          </button>
        </div>
      </div>
      <div className="editor-stack">
        {showLineNumbers ? (
          <div
            ref={lineNumbersRef}
            className={['editor-line-numbers', softWrap ? 'soft-wrap' : 'no-soft-wrap'].join(' ')}
            aria-hidden="true"
          >
            {lineNumbers.map((lineNumber) => (
              <span key={lineNumber}>{lineNumber}</span>
            ))}
          </div>
        ) : null}
        <textarea
          ref={editorRef}
          className={[
            'editor',
            'editor-overlay',
            showLineNumbers ? 'show-line-numbers' : '',
            softWrap ? 'soft-wrap' : 'no-soft-wrap',
          ]
            .filter(Boolean)
            .join(' ')}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onScroll={handleScroll}
          placeholder={text.placeholder}
          spellCheck={false}
          wrap={softWrap ? 'soft' : 'off'}
        />
      </div>
    </section>
  )
}

export default InputEditor
