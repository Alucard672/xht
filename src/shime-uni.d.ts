/* eslint-disable @typescript-eslint/no-empty-object-type */
export {}

declare module 'vue' {
  type Hooks = App.AppInstance & Page.PageInstance
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ComponentCustomOptions extends Hooks {}
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
declare interface UniCloud {
  init?: () => void
}
