import { useState } from 'react';
import { PlusIcon, XIcon } from 'lucide-react';
import { useTabsStore } from '../../stores';
import { useSettingsStore } from '../../stores';

export function TabBar() {
  const { tabs, activeTabId, createTab, closeTab, setActiveTab, renameTab } = useTabsStore();
  const { t } = useSettingsStore();
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreateTab = () => {
    createTab(t('room'));
  };

  const handleStartRename = (tabId: string, currentName: string) => {
    setEditingTabId(tabId);
    setEditingName(currentName);
  };

  const handleFinishRename = () => {
    if (editingTabId && editingName.trim()) {
      renameTab(editingTabId, editingName.trim());
    }
    setEditingTabId(null);
    setEditingName('');
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    if (tabs.length > 1 || confirm(t('confirmCloseTab'))) {
      closeTab(tabId);
    }
  };

  // If no tabs exist, create one
  if (tabs.length === 0) {
    return (
      <div className="h-9 bg-line border-b border-line flex items-center px-2">
        <button
          onClick={handleCreateTab}
          className="flex items-center gap-1 px-3 py-1 text-sm text-ink-secondary hover:bg-hover rounded"
        >
          <PlusIcon className="w-4 h-4" />
          <span>{t('newTab')}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-9 bg-line border-b border-line flex items-center px-1 gap-1 overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`group flex items-center gap-1 px-3 py-1.5 rounded-t text-sm cursor-pointer min-w-[100px] max-w-[200px] ${
            activeTabId === tab.id
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
              onDoubleClick={() => handleStartRename(tab.id, tab.name)}
            >
              {tab.name}
            </span>
          )}
          <button
            onClick={(e) => handleCloseTab(e, tab.id)}
            className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-hover"
            title={t('closeTab')}
          >
            <XIcon className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button
        onClick={handleCreateTab}
        className="p-1.5 text-ink-faint hover:bg-hover rounded"
        title={t('newTab')}
      >
        <PlusIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
