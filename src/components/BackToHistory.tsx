import { useLocation, useNavigate } from 'react-router-dom'

/** Goes back to where the user came from, or to Verlauf when there is no in-app history. */
export function useBackToHistory(): () => void {
  const navigate = useNavigate()
  const location = useLocation()
  return () => {
    if (location.key !== 'default') navigate(-1)
    else navigate('/verlauf', { replace: true })
  }
}

export default function BackToHistory() {
  const back = useBackToHistory()
  return (
    <button type="button" className="btn back-link" onClick={back}>
      ‹ Verlauf
    </button>
  )
}
