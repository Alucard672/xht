/// <reference types='@dcloudio/types' />
/* eslint-disable @typescript-eslint/no-empty-object-type */
export {}
import 'vue'

declare module '@vue/runtime-core' {
  type Hooks = App.AppInstance & Page.PageInstance

  interface ComponentCustomOptions extends Hooks {}
}
