import React, { type CSSProperties } from 'react'
import iconMap from '../icons'

interface IconProps {
  name: string
  size?: string
  color?: string
  className?: string
  onClick?: () => void
}

const Icon: React.FC<IconProps> = ({
  name,
  size,
  color,
  className,
  onClick,
}) => {
  const SvgComponent = iconMap[name]
  // 兜底：找不到图标返回空，避免白屏报错
  if (!SvgComponent) return null

  const Icon_style: CSSProperties = {
    fontSize: size,
    color: color
  }
  const iconStyle = `xb-icon ${className}`;
  return (
    <i className={iconStyle} style={Icon_style} onClick={onClick}>
        <SvgComponent />
    </i>
  )
}

export default Icon