import { useRef, type RefObject } from 'react'

type InputEditorProps = {
  editorRef: RefObject<HTMLTextAreaElement | null>
  value: string
  numericSort: boolean
  showLineNumbers: boolean
  softWrap: boolean
  findPanel: {
    expanded: boolean
    query: string
    replaceWith: string
    caseSensitive: boolean
    wholeWord: boolean
    useRegex: boolean
    matches: Array<{ start: number; end: number }>
    activeMatchIndex: number
    error: string
  }
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
    find: string
    replace: string
    openFind: string
    closeFind: string
    previousMatch: string
    nextMatch: string
    replaceCurrent: string
    replaceAll: string
    caseSensitive: string
    wholeWord: string
    regex: string
    noResults: string
    resultCount: (active: number, total: number) => string
  }
  onChange: (value: string) => void
  onOpenFind: () => void
  onCloseFind: () => void
  onFindPanelChange: (values: Partial<InputEditorProps['findPanel']>) => void
  onFindPrevious: () => void
  onFindNext: () => void
  onReplaceCurrent: () => void
  onReplaceAll: () => void
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
  findPanel,
  text,
  onChange,
  onOpenFind,
  onCloseFind,
  onFindPanelChange,
  onFindPrevious,
  onFindNext,
  onReplaceCurrent,
  onReplaceAll,
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
  const hasMatches = findPanel.matches.length > 0
  const activeMatchNumber = hasMatches ? findPanel.activeMatchIndex + 1 : 0

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
              className="line-action-button icon-action-button"
              type="button"
              title={text.openFind}
              aria-label={text.openFind}
              onPointerDown={(event) => runToolbarAction(event, onOpenFind)}
              onClick={(event) => runKeyboardAction(event, onOpenFind)}
            >
              ⌕
            </button>
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
        {findPanel.expanded ? (
          <div className="find-replace-panel" role="search" aria-label={text.openFind}>
            <div className="find-row">
              <input
                className="find-input"
                value={findPanel.query}
                onChange={(event) => onFindPanelChange({ query: event.target.value })}
                placeholder={text.find}
                autoFocus
              />
              <div className="find-match-count" aria-live="polite">
                {findPanel.error
                  ? findPanel.error
                  : hasMatches
                    ? text.resultCount(activeMatchNumber, findPanel.matches.length)
                    : text.noResults}
              </div>
              <button className="find-icon-button" type="button" title={text.previousMatch} onClick={onFindPrevious}>
                ↑
              </button>
              <button className="find-icon-button" type="button" title={text.nextMatch} onClick={onFindNext}>
                ↓
              </button>
              <button className="find-icon-button" type="button" title={text.closeFind} onClick={onCloseFind}>
                ×
              </button>
            </div>
            <div className="find-row">
              <input
                className="find-input"
                value={findPanel.replaceWith}
                onChange={(event) => onFindPanelChange({ replaceWith: event.target.value })}
                placeholder={text.replace}
              />
              <button className="find-text-button" type="button" disabled={!hasMatches} onClick={onReplaceCurrent}>
                {text.replaceCurrent}
              </button>
              <button className="find-text-button" type="button" disabled={!hasMatches} onClick={onReplaceAll}>
                {text.replaceAll}
              </button>
            </div>
            <div className="find-options">
              <button
                className={findPanel.caseSensitive ? 'find-option active' : 'find-option'}
                type="button"
                aria-pressed={findPanel.caseSensitive}
                title={text.caseSensitive}
                onClick={() => onFindPanelChange({ caseSensitive: !findPanel.caseSensitive })}
              >
                Aa
              </button>
              <button
                className={findPanel.wholeWord ? 'find-option active' : 'find-option'}
                type="button"
                aria-pressed={findPanel.wholeWord}
                title={text.wholeWord}
                onClick={() => onFindPanelChange({ wholeWord: !findPanel.wholeWord })}
              >
                ab
              </button>
              <button
                className={findPanel.useRegex ? 'find-option active' : 'find-option'}
                type="button"
                aria-pressed={findPanel.useRegex}
                title={text.regex}
                onClick={() => onFindPanelChange({ useRegex: !findPanel.useRegex })}
              >
                .*
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default InputEditor
