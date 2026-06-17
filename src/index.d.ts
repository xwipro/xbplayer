import React from 'react'

export interface XbPlayerOptions {
  container?: string | HTMLElement
  src?: string
}

export declare class XbPlayer {
  constructor(options?: XbPlayerOptions)
  get src(): string
  set src(url: string)
  destroy(): void
}

export declare const XbPlayerComponent: React.FC<{
  v_url?: string
}>

export as namespace XbPlayer
