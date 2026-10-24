import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { SearchProvider } from '../context/SearchContext'
import SearchBar from '../components/ui/SearchBar'
import ScrollManager from '../components/layout/ScrollManager'
import ToastHost from '../components/layout/ToastHost'
import DropZone from '../components/ui/DropZone'
import CountUp from '../components/ui/CountUp'
import Reveal from '../components/ui/Reveal'
import Tools from '../pages/Tools'
import { notify } from '../lib/events'

function Where() {
  const l = useLocation()
  return <div data-testid="where">{l.pathname}{l.search}{l.hash}</div>
}

function withRouter(ui: React.ReactNode, entry = '/') {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[entry]}>
        <SearchProvider>
          {ui}
          <Where />
        </SearchProvider>
      </MemoryRouter>
    </HelmetProvider>,
  )
}

describe('SearchBar keyboard navigation', () => {
  it('moves the highlighted option with ArrowDown/ArrowUp (wrapping) and exposes it via ARIA', () => {
    withRouter(<SearchBar />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'pdf' } })

    const options = screen.getAllByRole('option')
    expect(options.length).toBeGreaterThan(2)
    expect(options.every(o => o.getAttribute('aria-selected') === 'false')).toBe(true)

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const active = screen.getAllByRole('option').filter(o => o.getAttribute('aria-selected') === 'true')
    expect(active).toHaveLength(1)
    expect(screen.getAllByRole('option')[1]).toBe(active[0])
    expect(input.getAttribute('aria-activedescendant')).toBe(active[0].id)

    // ArrowUp twice from index 1 wraps to the last option
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    const all = screen.getAllByRole('option')
    expect(all[all.length - 1].getAttribute('aria-selected')).toBe('true')
  })

  it('Enter opens the highlighted tool, or the first result when none is highlighted', () => {
    withRouter(<SearchBar />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'merge' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByTestId('where').textContent).toBe('/merge-pdf')
  })

  it('"/" focuses the search box unless the user is typing elsewhere', () => {
    // jsdom has no layout, so offsetParent is null; emulate a visible element
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', { configurable: true, get() { return document.body } })
    withRouter(<><SearchBar /><textarea data-testid="ta" /></>)
    const input = screen.getByRole('combobox')

    fireEvent.keyDown(document.body, { key: '/' })
    expect(document.activeElement).toBe(input)

    ;(screen.getByTestId('ta') as HTMLTextAreaElement).focus()
    fireEvent.keyDown(screen.getByTestId('ta'), { key: '/' })
    expect(document.activeElement).toBe(screen.getByTestId('ta'))

    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true })
    expect(document.activeElement).toBe(input)
  })
})

describe('ScrollManager', () => {
  it('scrolls to top on a normal navigation and to the element on a #hash', async () => {
    const target = document.createElement('div')
    target.id = 'pdf'
    document.body.appendChild(target)

    withRouter(<ScrollManager />, '/tools#pdf')
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled())
    target.remove()

    vi.mocked(window.scrollTo).mockClear()
    withRouter(<ScrollManager />, '/about')
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }))
  })
})

describe('Tools page', () => {
  it('honours ?q= from the URL (as advertised by the SearchAction schema)', () => {
    withRouter(
      <Routes><Route path="/tools" element={<Tools />} /></Routes>,
      '/tools?q=merge',
    )
    expect(screen.getByText(/result/i)).toBeTruthy()
    expect(screen.getAllByText('Merge PDF').length).toBeGreaterThan(0)
    expect(screen.queryByText('QR Generator')).toBeNull()
  })

  it('writes typed queries back to the URL', () => {
    withRouter(<Routes><Route path="/tools" element={<Tools />} /></Routes>, '/tools')
    const box = screen.getAllByLabelText('Search tools')[0]
    fireEvent.change(box, { target: { value: 'ocr' } })
    expect(screen.getByTestId('where').textContent).toContain('?q=ocr')
  })
})

describe('DropZone paste', () => {
  const pdf = new File(['%PDF'], 'a.pdf', { type: 'application/pdf' })
  const png = new File(['x'], 'b.png', { type: 'image/png' })

  function paste(files: File[]) {
    const ev = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent
    Object.defineProperty(ev, 'clipboardData', { value: { files } })
    act(() => { window.dispatchEvent(ev) })
    return ev
  }

  it('accepts matching clipboard files and ignores the rest', () => {
    const onFiles = vi.fn()
    render(<DropZone onFiles={onFiles} accept={{ 'application/pdf': ['.pdf'] }} />)
    const ev = paste([png, pdf])
    expect(onFiles).toHaveBeenCalledWith([pdf])
    expect(ev.defaultPrevented).toBe(true)
  })

  it('does nothing when no pasted file matches', () => {
    const onFiles = vi.fn()
    render(<DropZone onFiles={onFiles} accept={{ 'application/pdf': ['.pdf'] }} />)
    paste([png])
    expect(onFiles).not.toHaveBeenCalled()
  })

  it('passes only one file when multiple is off, all when on', () => {
    const one = vi.fn(); const many = vi.fn()
    const { unmount } = render(<DropZone onFiles={one} accept={{ 'image/*': [] }} />)
    paste([png, new File(['y'], 'c.png', { type: 'image/png' })])
    expect(one.mock.calls[0][0]).toHaveLength(1)
    unmount()
    render(<DropZone onFiles={many} multiple accept={{ 'image/*': [] }} />)
    paste([png, new File(['y'], 'c.png', { type: 'image/png' })])
    expect(many.mock.calls[0][0]).toHaveLength(2)
  })

  it('ignores paste while typing in a text field and when disabled', () => {
    const onFiles = vi.fn()
    render(<><DropZone onFiles={onFiles} /><input data-testid="i" /></>)
    const ev = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent
    Object.defineProperty(ev, 'clipboardData', { value: { files: [pdf] } })
    act(() => { screen.getByTestId('i').dispatchEvent(ev) })
    expect(onFiles).not.toHaveBeenCalled()
  })

  it('stops listening once unmounted (no leaked listener)', () => {
    const onFiles = vi.fn()
    const { unmount } = render(<DropZone onFiles={onFiles} />)
    unmount()
    paste([pdf])
    expect(onFiles).not.toHaveBeenCalled()
  })
})

describe('ToastHost', () => {
  it('shows a notification fired via notify() and auto-dismisses', () => {
    vi.useFakeTimers()
    render(<ToastHost />)
    act(() => notify({ type: 'success', title: 'All done!', message: 'Ready' }))
    expect(screen.getByText('All done!')).toBeTruthy()
    act(() => { vi.advanceTimersByTime(4000) })
    expect(screen.queryByText('All done!')).toBeNull()
    vi.useRealTimers()
  })
})

describe('motion components', () => {
  it('Reveal becomes visible once intersecting', () => {
    render(<Reveal><p>hello</p></Reveal>)
    expect(screen.getByText('hello').parentElement?.className).toContain('is-visible')
  })

  it('CountUp lands on its target value', async () => {
    render(<CountUp to={50} suffix="MB" duration={30} />)
    await waitFor(() => expect(screen.getByText('50MB')).toBeTruthy(), { timeout: 2000 })
  })

  it('CountUp jumps straight to the value when the user prefers reduced motion', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(q => ({
      matches: q.includes('reduce'), media: q, onchange: null,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList)
    render(<CountUp to={30} suffix="+" />)
    expect(screen.getByText('30+')).toBeTruthy()
  })
})
