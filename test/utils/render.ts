import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

export function render(component: any, options: any = {}) {
  const pinia = createPinia()

  return mount(component, {
    global: {
      plugins: [pinia],
      stubs: {
        view: true,
        text: true,
        'scroll-view': true,
        swiper: true,
        'swiper-item': true,
        button: true,
        'u-button': true,
        'u-input': true,
        'u-form': true,
        'u-form-item': true,
        'u-picker': true,
        'u-popup': true,
        'u-modal': true,
        'u-toast': true,
        'u-navbar': true,
        'u-tabbar': true,
        'u-icon': true,
        'u-image': true,
        'u-cell': true,
        'u-cell-group': true
      }
    },
    ...options
  })
}
