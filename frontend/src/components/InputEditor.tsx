import { useRef, type RefObject } from 'react'
import type { FindOptions, SearchMatch } from '../services/tauriApi'

type InputEditorProps = {
  editorRef: RefObject<HTMLTextAreaElement | null>
  findInputRef: RefObject<HTMLInputElement | null>
  replaceInputRef: RefObject<HTMLInputElement | null>
  value: string
  searchQuery: string
  replaceWith: string
  matches: SearchMatch[]
  findOptions: FindOptions
  findVisible: boolean
  replaceVisible: boolean
  numericSort: boolean
  showLineNumbers: boolean
  softWrap: boolean
  text: {
    copy: string
    copyHighlights: string
    paste: string
    clear: string
    lineTools: string
    reverseLines: string
    deduplicateLines: string
    sortLines: string
    sortLinesDescending: string
    numericSort: string
    commaToLines: string
    find: string
    replaceWith: string
    matchCount: (count: number) => string
    matchHint: (query: string, count: number) => string
    caseSensitive: string
    wholeWord: string
    useRegex: string
    showReplace: string
    hideReplace: string
    replaceOne: string
    replaceAll: string
    placeholder: string
  }
  onChange: (value: string) => void
  onSearchQueryChange: (value: string) => void
  onReplaceWithChange: (value: string) => void
  onFindOptionChange: (option: keyof FindOptions, value: boolean) => void
  onReplaceVisibleChange: (value: boolean) => void
  onReplace: () => void
  onReplaceAll: () => void
  onFindEscape: () => void
  onNumericSortChange: (value: boolean) => void
  onCopySource: () => void
  onCopyHighlights: () => void
  onClearSource: () => void
  onPasteSource: () => void
  showCopyHighlights: boolean
  canCopyHighlights: boolean
  onReverseLines: () => void
  onDeduplicateLines: () => void
  onSortLines: () => void
  onSortLinesDescending: () => void
  onCommaValuesToLines: () => void
}

function InputEditor({
  editorRef,
  findInputRef,
  replaceInputRef,
  value,
  searchQuery,
  replaceWith,
  matches,
  findOptions,
  findVisible,
  replaceVisible,
  numericSort,
  showLineNumbers,
  softWrap,
  text,
  onChange,
  onSearchQueryChange,
  onReplaceWithChange,
  onFindOptionChange,
  onReplaceVisibleChange,
  onReplace,
  onReplaceAll,
  onFindEscape,
  onNumericSortChange,
  onCopySource,
  onCopyHighlights,
  onClearSource,
  onPasteSource,
  showCopyHighlights,
  canCopyHighlights,
  onReverseLines,
  onDeduplicateLines,
  onSortLines,
  onSortLinesDescending,
  onCommaValuesToLines,
}: InputEditorProps) {
  const highlightRef = useRef<HTMLDivElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const lineNumbers = value.split('\n').map((_, index) => index + 1)

  function handleScroll(event: React.UIEvent<HTMLTextAreaElement>) {
    if (!highlightRef.current) {
      return
    }

    highlightRef.current.scrollTop = event.currentTarget.scrollTop
    highlightRef.current.scrollLeft = event.currentTarget.scrollLeft

    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = event.currentTarget.scrollTop
    }
  }

  function handleFindInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onFindEscape()
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
          {showCopyHighlights ? (
            <button
              className="secondary-button"
              type="button"
              onPointerDown={(event) => runToolbarAction(event, onCopyHighlights)}
              onClick={(event) => runKeyboardAction(event, onCopyHighlights)}
              disabled={!canCopyHighlights}
            >
              {text.copyHighlights}
            </button>
          ) : null}
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
        {findVisible ? (
          <div className={replaceVisible ? 'find-popover replace-open' : 'find-popover'} role="search">
            <div className="find-popover-main">
              <label className="find-field">
                <span>{text.find}</span>
                <input
                  ref={findInputRef}
                  value={searchQuery}
                  onChange={(event) => onSearchQueryChange(event.target.value)}
                  onKeyDown={handleFindInputKeyDown}
                />
              </label>
              <span className="find-match-pill">{text.matchCount(matches.length)}</span>
            </div>

            <div className="find-popover-options">
              <div className="find-option-group">
                <button
                  className={findOptions.caseSensitive ? 'option-chip active' : 'option-chip'}
                  type="button"
                  title={text.caseSensitive}
                  aria-label={text.caseSensitive}
                  aria-pressed={findOptions.caseSensitive}
                  onClick={() => onFindOptionChange('caseSensitive', !findOptions.caseSensitive)}
                >
                  Aa
                </button>
                <button
                  className={findOptions.wholeWord ? 'option-chip active' : 'option-chip'}
                  type="button"
                  title={text.wholeWord}
                  aria-label={text.wholeWord}
                  aria-pressed={findOptions.wholeWord}
                  onClick={() => onFindOptionChange('wholeWord', !findOptions.wholeWord)}
                >
                  Ab
                </button>
                <button
                  className={findOptions.useRegex ? 'option-chip active' : 'option-chip'}
                  type="button"
                  title={text.useRegex}
                  aria-label={text.useRegex}
                  aria-pressed={findOptions.useRegex}
                  onClick={() => onFindOptionChange('useRegex', !findOptions.useRegex)}
                >
                  .*
                </button>
              </div>
              <button
                className="secondary-button compact-button"
                type="button"
                aria-expanded={replaceVisible}
                onClick={() => onReplaceVisibleChange(!replaceVisible)}
              >
                {replaceVisible ? text.hideReplace : text.showReplace}
              </button>
            </div>

            {replaceVisible ? (
              <div className="replace-drawer">
                <label className="find-field">
                  <span>{text.replaceWith}</span>
                  <input
                    ref={replaceInputRef}
                    value={replaceWith}
                    onChange={(event) => onReplaceWithChange(event.target.value)}
                    onKeyDown={handleFindInputKeyDown}
                  />
                </label>
                <div className="replace-actions">
                  <button className="primary-button compact-button" type="button" onClick={onReplace}>
                    {text.replaceOne}
                  </button>
                  <button className="secondary-button compact-button" type="button" onClick={onReplaceAll}>
                    {text.replaceAll}
                  </button>
                </div>
              </div>
            ) : null}

            <p className="find-popover-hint">{text.matchHint(searchQuery, matches.length)}</p>
          </div>
        ) : null}
        {showLineNumbers ? (
          <div ref={lineNumbersRef} className="editor-line-numbers" aria-hidden="true">
            {lineNumbers.map((lineNumber) => (
              <span key={lineNumber}>{lineNumber}</span>
            ))}
          </div>
        ) : null}
        <div
          ref={highlightRef}
          className={[
            'editor-highlight-layer',
            showLineNumbers ? 'show-line-numbers' : '',
            softWrap ? 'soft-wrap' : 'no-soft-wrap',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden="true"
        >
          <pre className="editor-highlight-text">{renderHighlightedText(value, searchQuery, matches)}</pre>
        </div>
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
