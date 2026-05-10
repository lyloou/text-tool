type ToolbarProps = {
  replaceQuery: string
  replaceWith: string
  matchCount: number
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
          <p className="eyebrow">Source Text Operations</p>
          <h2>原始内容工作台</h2>
        </div>
        <p className="match-count">命中 {matchCount} 项</p>
      </div>

      <div className="tool-grid source-tool-grid">
        <div className="tool-block replace-tool">
          <div className="mini-tool-header">
            <p className="eyebrow">Replace</p>
            <h3>查找替换</h3>
          </div>
          <div className="field-row two-columns">
            <label>
              <span>查找</span>
              <input value={replaceQuery} onChange={(event) => onReplaceQueryChange(event.target.value)} />
            </label>
            <label>
              <span>替换为</span>
              <input value={replaceWith} onChange={(event) => onReplaceWithChange(event.target.value)} />
            </label>
          </div>
          <div className="source-action-row">
            <button className="primary-button" type="button" onClick={onReplace}>
              应用替换到原始内容
            </button>
          </div>
        </div>

        <div className="tool-block quick-actions">
          <div className="mini-tool-header">
            <p className="eyebrow">Line Tools</p>
            <h3>行处理</h3>
          </div>
          <div className="source-action-row compact-actions">
            <button className="secondary-button" type="button" onClick={onReverseLines}>
              按行逆序
            </button>
            <button className="secondary-button" type="button" onClick={onDeduplicateLines}>
              按行去重
            </button>
            <button className="secondary-button" type="button" onClick={onSortLines}>
              升序排序
            </button>
            <button className="secondary-button" type="button" onClick={onCommaValuesToLines}>
              逗号转行
            </button>
          </div>
        </div>

      </div>
    </section>
  )
}

export default Toolbar
