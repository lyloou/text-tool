type ToolbarProps = {
  replaceQuery: string
  replaceWith: string
  matchCount: number
  text: {
    eyebrow: string
    title: string
    matchCount: (count: number) => string
    replaceEyebrow: string
    replaceTitle: string
    find: string
    replaceWith: string
    matchHint: (query: string, count: number) => string
    applyReplace: string
    lineToolsEyebrow: string
    lineToolsTitle: string
    reverseLines: string
    deduplicateLines: string
    sortLines: string
    commaToLines: string
  }
  onReplaceQueryChange: (value: string) => void
  onReplaceWithChange: (value: string) => void
  onReplace: () => void
  onReverseLines: () => void
  onDeduplicateLines: () => void
  onSortLines: () => void
  onCommaValuesToLines: () => void
}

function Toolbar({
  replaceQuery,
  replaceWith,
  matchCount,
  text,
  onReplaceQueryChange,
  onReplaceWithChange,
  onReplace,
  onReverseLines,
  onDeduplicateLines,
  onSortLines,
  onCommaValuesToLines,
}: ToolbarProps) {
  return (
    <section className="toolbar-panel source-toolbar">
      <div className="toolbar-row">
        <div>
          <p className="eyebrow">{text.eyebrow}</p>
          <h2>{text.title}</h2>
        </div>
        <p className="match-count">{text.matchCount(matchCount)}</p>
      </div>

      <div className="tool-grid source-tool-grid">
        <div className="tool-block replace-tool">
          <div className="mini-tool-header">
            <p className="eyebrow">{text.replaceEyebrow}</p>
            <h3>{text.replaceTitle}</h3>
          </div>
          <div className="field-row two-columns">
            <label>
              <span>{text.find}</span>
              <input value={replaceQuery} onChange={(event) => onReplaceQueryChange(event.target.value)} />
              <span className="match-hint">{text.matchHint(replaceQuery, matchCount)}</span>
            </label>
            <label>
              <span>{text.replaceWith}</span>
              <input value={replaceWith} onChange={(event) => onReplaceWithChange(event.target.value)} />
            </label>
          </div>
          <div className="source-action-row">
            <button className="primary-button" type="button" onClick={onReplace}>
              {text.applyReplace}
            </button>
          </div>
        </div>

        <div className="tool-block quick-actions">
          <div className="mini-tool-header">
            <p className="eyebrow">{text.lineToolsEyebrow}</p>
            <h3>{text.lineToolsTitle}</h3>
          </div>
          <div className="source-action-row compact-actions">
            <button className="secondary-button" type="button" onClick={onReverseLines}>
              {text.reverseLines}
            </button>
            <button className="secondary-button" type="button" onClick={onDeduplicateLines}>
              {text.deduplicateLines}
            </button>
            <button className="secondary-button" type="button" onClick={onSortLines}>
              {text.sortLines}
            </button>
            <button className="secondary-button" type="button" onClick={onCommaValuesToLines}>
              {text.commaToLines}
            </button>
          </div>
        </div>

      </div>
    </section>
  )
}

export default Toolbar
