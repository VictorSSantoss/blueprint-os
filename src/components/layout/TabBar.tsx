import { useState } from 'react';
import { CopyIcon, PlusIcon, XIcon } from 'lucide-react';
import { useTabsStore, useSettingsStore } from '../../stores';
import { closeTab, createTab, currentPlan, duplicateTab, isPlanEmpty, renameTab, switchTab } from '../../stores/tabs';

export function TabBar() {
  const { tabs, activeTabId } = useTabsStore();
  const { t } = useSettingsStore();
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const base = t('defaultOptionName');

  const handleFinishRename = () => {
    if (editingTabId) renameTab(editingTabId, editingName);
    setEditingTabId(null);
    setEditingName('');
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const plan = tabId === activeTabId ? currentPlan() : tabs.find((tab) => tab.id === tabId)?.plan;
    if (!plan || isPlanEmpty(plan) || confirm(t('confirmCloseOption'))) {
      closeTab(tabId);
    }
  };

  return (
    <div className="h-9 bg-line border-b border-line flex items-center px-1 gap-1 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        return (
          <div
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`group flex items-center gap-1 px-3 py-1.5 rounded-t text-sm cursor-pointer min-w-[100px] max-w-[220px] ${
              isActive
                ? 'bg-panel text-ink border-t border-l border-r border-line'
                : 'bg-hover text-ink-secondary hover:bg-line-faint'
            }`}
          >
            {editingTabId === tab.id ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleFinishRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFinishRename();
                  if (e.key === 'Escape') {
                    setEditingTabId(null);
                    setEditingName('');
                  }
                }}
                className="flex-1 bg-transparent border-none outline-none text-sm min-w-0"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="flex-1 truncate"
                onDoubleClick={() => {
                  setEditingTabId(tab.id);
                  setEditingName(tab.name);
                }}
              >
                {tab.name}
              </span>
            )}
            {isActive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateTab(base);
                }}
                className="p-0.5 rounded text-ink-faint hover:bg-hover hover:text-ink"
                title={t('duplicateTab')}
              >
                <CopyIcon className="w-3 h-3" />
              </button>
            )}
            {tabs.length > 1 && (
              <button
                onClick={(e) => handleCloseTab(e, tab.id)}
                className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-hover"
                title={t('closeTab')}
              >
                <XIcon className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
      <button
        onClick={() => createTab(base)}
        className="p-1.5 text-ink-faint hover:bg-hover rounded"
        title={t('newTab')}
      >
        <PlusIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
