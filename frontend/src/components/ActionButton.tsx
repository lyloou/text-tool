import type { ButtonHTMLAttributes, MouseEvent, PointerEvent, ReactNode } from 'react'

type ActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'onPointerDown' | 'type'> & {
  children: ReactNode
  onAction: () => void
}

function ActionButton({ children, onAction, ...buttonProps }: ActionButtonProps) {
  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }

    event.preventDefault()
    onAction()
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (event.detail === 0) {
      onAction()
    }
  }

  return (
    <button {...buttonProps} type="button" onPointerDown={handlePointerDown} onClick={handleClick}>
      {children}
    </button>
  )
}

export default ActionButton
