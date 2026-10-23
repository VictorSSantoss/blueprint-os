import { useState, useMemo } from 'react';
import { SearchIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { OBJECT_CATEGORIES, getObjectsByCategory, OBJECT_CATALOG } from '../../../constants';
import { useToolStore, useSettingsStore } from '../../../stores';
import type { ObjectCategory, ObjectType } from '../../../types';
import { getLocalizedObjectName } from '../../../utils/objectNames';
import type { TranslationKey } from '../../../i18n';

interface CategorySectionProps {
  category: { id: ObjectCategory; name: string };
  localizedCategoryName: string;
  isExpanded: boolean;
  onToggle: () => void;
  searchQuery: string;
  onSelectObject: (type: ObjectType) => void;
  onDragStart: (type: ObjectType) => void;
  onDragEnd: () => void;
}

function CategorySection({ category, localizedCategoryName, isExpanded, onToggle, searchQuery, onSelectObject, onDragStart, onDragEnd }: CategorySectionProps) {
  const { language } = useSettingsStore();

  const objects = useMemo(() => {
    const categoryObjects = getObjectsByCategory(category.id);
    if (!searchQuery) return categoryObjects;
    return categoryObjects.filter((obj) => {
      const localizedName = getLocalizedObjectName(obj.type, language);
      return (
        obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        localizedName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [category.id, searchQuery, language]);

  if (searchQuery && objects.length === 0) return null;

  return (
    <div className="border-b border-line-faint last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ink hover:bg-hover"
      >
        {isExpanded ? (
          <ChevronDownIcon className="w-4 h-4 text-ink-faint" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 text-ink-faint" />
        )}
        <span>{localizedCategoryName}</span>
        <span className="ml-auto text-xs text-ink-faint">{objects.length}</span>
      </button>
      {isExpanded && (
        <div className="px-2 pb-2 grid grid-cols-2 gap-1">
          {objects.map((obj) => (
            <ObjectThumbnail
              key={obj.type}
              type={obj.type}
              dimensions={obj.defaultDimensions}
              onClick={() => onSelectObject(obj.type)}
              onDragStart={() => onDragStart(obj.type)}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ObjectThumbnailProps {
  type: ObjectType;
  dimensions: { width: number; depth: number };
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

function ObjectThumbnail({ type, dimensions, onClick, onDragStart, onDragEnd }: ObjectThumbnailProps) {
  const { language } = useSettingsStore();
  const definition = OBJECT_CATALOG[type];
  const category = definition?.category;
  const localizedName = getLocalizedObjectName(type, language);

  // Get color based on category
  const bgColor = getCategoryColor(category);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/floor-maker-object', type);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart();
  };

  const handleDragEnd = () => {
    onDragEnd();
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className="flex flex-col items-center p-2 rounded hover:bg-hover text-center group cursor-grab active:cursor-grabbing select-none"
      title={`${localizedName} (${dimensions.width}x${dimensions.depth}cm)`}
    >
      <div
        className={`w-12 h-12 rounded flex items-center justify-center ${bgColor} mb-1 pointer-events-none`}
      >
        <ObjectIcon type={type} />
      </div>
      <span className="text-xs text-ink-secondary truncate w-full pointer-events-none">{localizedName}</span>
      <span className="text-xs text-ink-faint pointer-events-none">
        {dimensions.width}x{dimensions.depth}
      </span>
    </div>
  );
}

function getCategoryColor(category?: ObjectCategory): string {
  switch (category) {
    case 'doors':
      return 'bg-cat-door';
    case 'windows':
      return 'bg-cat-window';
    case 'living-room':
      return 'bg-cat-living';
    case 'bedroom':
      return 'bg-cat-bedroom';
    case 'dining':
      return 'bg-cat-dining';
    case 'kitchen':
      return 'bg-cat-kitchen';
    case 'bathroom':
      return 'bg-cat-bathroom';
    case 'heating':
      return 'bg-cat-heating';
    case 'structural':
      return 'bg-cat-structural';
    default:
      return 'bg-hover';
  }
}

function ObjectIcon({ type }: { type: ObjectType }) {
  // Simple text-based icons for now
  const iconMap: Record<string, string> = {
    'single-door': '🚪',
    'double-door': '🚪🚪',
    'sliding-door': '⬌',
    'pocket-door': '⬚',
    'french-door': '🚪🚪',
    'standard-window': '▭',
    'floor-window': '▯',
    'small-window': '□',
    'bay-window': '⌒',
    'sofa-2': '🛋',
    'sofa-3': '🛋',
    'sofa-l': '⌐',
    'armchair': '🪑',
    'coffee-table': '▬',
    'tv-stand': '📺',
    'bookshelf': '📚',
    'side-table': '▫',
    'floor-lamp': '💡',
    'rug-rect': '▮',
    'bed-single': '🛏',
    'bed-double': '🛏',
    'bed-queen': '🛏',
    'bed-king': '🛏',
    'nightstand': '▪',
    'wardrobe': '🚪',
    'dresser': '▭',
    'desk': '🖥',
    'office-chair': '🪑',
    'dining-table-4': '▭',
    'dining-table-6': '▭',
    'dining-table-8': '▭',
    'round-table-4': '●',
    'dining-chair': '🪑',
    'bar-stool': '⬭',
    'sideboard': '▭',
    'refrigerator': '❄',
    'dishwasher': '🍽',
    'washing-machine': '🧺',
    'dryer': '🌀',
    'oven': '🔥',
    'cooktop': '🔘',
    'microwave': '▭',
    'kitchen-sink': '🚰',
    'kitchen-cabinet-base': '▭',
    'kitchen-cabinet-wall': '▭',
    'kitchen-island': '▭',
    'toilet': '🚽',
    'bathtub': '🛁',
    'shower-square': '🚿',
    'shower-rect': '🚿',
    'bathroom-sink': '🚰',
    'vanity': '▭',
    'radiator-small': '🔥',
    'radiator-medium': '🔥',
    'radiator-large': '🔥',
    'radiator-vertical': '║',
    'ac-unit': '❄',
    'standing-fan': '🌀',
    'space-heater': '🔥',
    'void': '⬜',
    'column-square': '▪',
    'column-round': '●',
    'stairs-straight': '≡',
    'stairs-l': '⌐',
    'stairs-spiral': '◎',
    'ladder': '⫿',
  };

  return (
    <span className="text-xl">{iconMap[type] || '▭'}</span>
  );
}

export function ObjectLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<ObjectCategory>>(
    new Set(['living-room', 'bedroom'])
  );
  const { setPlacingObject, startDragging, stopDragging } = useToolStore();
  const { t } = useSettingsStore();

  const toggleCategory = (category: ObjectCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleSelectObject = (type: ObjectType) => {
    setPlacingObject(type);
  };

  const handleDragStart = (type: ObjectType) => {
    startDragging(type);
  };

  const handleDragEnd = () => {
    stopDragging();
  };

  // Auto-expand all categories when searching
  const effectiveExpanded = searchQuery
    ? new Set(OBJECT_CATEGORIES.map((c) => c.id))
    : expandedCategories;

  // Map category IDs to translation keys
  const getCategoryTranslationKey = (categoryId: ObjectCategory): TranslationKey => {
    const keyMap: Record<ObjectCategory, TranslationKey> = {
      'doors': 'categoryDoors',
      'windows': 'categoryWindows',
      'living-room': 'categoryLivingRoom',
      'bedroom': 'categoryBedroom',
      'dining': 'categoryDining',
      'kitchen': 'categoryKitchen',
      'bathroom': 'categoryBathroom',
      'heating': 'categoryHeating',
      'structural': 'categoryStructural',
    };
    return keyMap[categoryId];
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-line">
        <h2 className="font-semibold text-ink mb-2">{t('objects')}</h2>
        <div className="relative">
          <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input
            type="text"
            placeholder={t('searchObjects')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-line rounded bg-paper focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto">
        {OBJECT_CATEGORIES.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            localizedCategoryName={t(getCategoryTranslationKey(category.id))}
            isExpanded={effectiveExpanded.has(category.id)}
            onToggle={() => toggleCategory(category.id)}
            searchQuery={searchQuery}
            onSelectObject={handleSelectObject}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {/* Footer hint */}
      <div className="p-3 border-t border-line text-xs text-ink-faint">
        {t('objectPlacementHint')}
      </div>
    </div>
  );
}
