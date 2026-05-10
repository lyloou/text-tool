import type { ResultOutput } from '../services/tauriApi'

type ResultViewProps = {
  ignoreEmptyLines: boolean
  outputs: ResultOutput[]
  onIgnoreEmptyLinesChange: (value: boolean) => void
  onConvert: () => void
  onCopy: (output: string, label: string) => void
}

function ResultView({
  ignoreEmptyLines,
  outputs,
  onIgnoreEmptyLinesChange,
  onConvert,
  onCopy,
}: ResultViewProps) {
  return (
    <section className="result-panel workbench-panel">
      <div className="panel-header result-header">
        <div>
          <p className="eyebrow">Result Workbench</p>
          <h2>转换结果</h2>
        </div>
        <div className="result-actions">
          <label className="toggle">
            <input
              type="checkbox"
              checked={ignoreEmptyLines}
              onChange={(event) => onIgnoreEmptyLinesChange(event.target.checked)}
            />
            <span>忽略空行</span>
          </label>
          <button className="primary-button" type="button" onClick={onConvert}>
            转换
          </button>
        </div>
      </div>

      <div className="result-cards">
        {outputs.map((item) => (
          <article key={item.format} className="result-card">
            <div className="result-card-header">
              <div>
                <p className="eyebrow">Output Format</p>
                <h3>{item.label}</h3>
              </div>
              <button className="secondary-button" type="button" onClick={() => onCopy(item.output, item.label)}>
                复制
              </button>
            </div>
            <div className="result-surface">
              {item.output ? (
                <pre className="result-text">{item.output}</pre>
              ) : (
                <p className="empty-state">转换结果会显示在这里。</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ResultView
