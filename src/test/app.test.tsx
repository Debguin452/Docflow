import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import App from '../App'
import { ALL_TOOLS } from '../data/tools'

function renderAt(path: string) {
  window.history.pushState({}, '', path)
  return render(
    <HelmetProvider>
      <App />
    </HelmetProvider>,
  )
}

beforeEach(() => localStorage.clear())

describe('<App/> routing', () => {
  it('renders the home page with hero, skip link and search', async () => {
    renderAt('/')
    expect(await screen.findByText(/you'll ever need/i, {}, { timeout: 8000 })).toBeTruthy()
    expect(screen.getByText('Skip to content')).toBeTruthy()
    expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0)
    expect(document.getElementById('main')).toBeTruthy()
  })

  it('renders the tools directory', async () => {
    renderAt('/tools')
    expect(await screen.findByRole('heading', { level: 1, name: 'All Tools' }, { timeout: 8000 })).toBeTruthy()
  })

  it('shows a not-found page for unknown routes', async () => {
    renderAt('/definitely-not-a-page')
    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' }, { timeout: 8000 })).toBeTruthy()
  })

  it('records a visited tool in "recently used"', async () => {
    const tool = ALL_TOOLS.find(t => t.slug === 'merge-pdf')!
    renderAt('/merge-pdf')
    await screen.findByRole('heading', { level: 1, name: tool.name }, { timeout: 8000 })
    expect(JSON.parse(localStorage.getItem('filedit:recent') ?? '[]')).toContain(tool.id)
  })

  // Mounts every single tool route through the real router + lazy loaders
  for (const tool of ALL_TOOLS) {
    it(`mounts /${tool.slug}`, async () => {
      const { unmount } = renderAt(`/${tool.slug}`)
      expect(await screen.findByRole('heading', { level: 1, name: tool.name }, { timeout: 10_000 })).toBeTruthy()
      // every tool must offer a way to add a file or an input
      unmount()
    })
  }
})
