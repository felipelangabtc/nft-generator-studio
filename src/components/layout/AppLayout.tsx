import { Outlet, useLocation } from 'react-router-dom'
import { TopBar } from './TopBar'
import { StatusBar } from './StatusBar'

export function AppLayout() {
  const location = useLocation()
  const isEditor = location.pathname.startsWith('/editor/')

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <TopBar showEditorNav={isEditor} />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
      <StatusBar />
    </div>
  )
}
