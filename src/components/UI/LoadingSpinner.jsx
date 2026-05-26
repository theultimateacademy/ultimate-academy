export default function LoadingSpinner({ fullPage = false, text = 'Chargement…' }) {
  if (fullPage) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <span>{text}</span>
      </div>
    )
  }
  return <div className="spinner spinner-sm" />
}
