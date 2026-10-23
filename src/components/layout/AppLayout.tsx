import type { ReactNode } from 'react';
import { Header } from './Header';
import { Toolbar } from './Toolbar';
import { StatusBar } from './StatusBar';
import { TabBar } from './TabBar';

interface AppLayoutProps {
  leftPanel: ReactNode;
  canvas: ReactNode;
  rightPanel: ReactNode;
}

export function AppLayout({ leftPanel, canvas, rightPanel }: AppLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-paper">
      <Header />
      <Toolbar />
      <TabBar />
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Object Library */}
        <aside className="w-64 bg-panel border-r border-line overflow-y-auto flex-shrink-0">
          {leftPanel}
        </aside>

        {/* Canvas */}
        <main className="flex-1 overflow-hidden">
          {canvas}
        </main>

        {/* Right Panel - Properties */}
        <aside className="w-72 bg-panel border-l border-line overflow-y-auto flex-shrink-0">
          {rightPanel}
        </aside>
      </div>
      <StatusBar />
    </div>
  );
}
