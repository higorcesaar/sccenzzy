import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BLOCK_TYPES, BLOCK_LABEL, newBlock, type Block, type BlockType } from "@/lib/admin/blocks";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { BlockPropsForm } from "./BlockPropsForm";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2, Copy, Eye, Plus, X } from "lucide-react";

export function PageBuilder({
  value,
  onChange,
}: {
  value: Block[];
  onChange: (b: Block[]) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = value.findIndex((b) => b.id === active.id);
    const newIdx = value.findIndex((b) => b.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    onChange(arrayMove(value, oldIdx, newIdx));
  }

  function add(type: BlockType) {
    const b = newBlock(type);
    onChange([...value, b]);
    setSelectedId(b.id);
  }
  function remove(id: string) {
    onChange(value.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  }
  function duplicate(id: string) {
    const idx = value.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const src = value[idx];
    const copy = newBlock(src.type);
    copy.props = JSON.parse(JSON.stringify(src.props));
    const arr = [...value];
    arr.splice(idx + 1, 0, copy);
    onChange(arr);
  }
  function update(id: string, props: Record<string, any>) {
    onChange(value.map((b) => (b.id === id ? { ...b, props } : b)));
  }

  const selected = value.find((b) => b.id === selectedId) ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] gap-4">
      {/* Palette */}
      <aside className="bg-white border border-stone-200 rounded-2xl p-3 space-y-2 h-fit lg:sticky lg:top-20">
        <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold px-2">Adicionar bloco</div>
        <div className="grid grid-cols-2 gap-2">
          {BLOCK_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => add(t)}
              className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg border border-stone-200 hover:border-amber-500 hover:bg-amber-50 transition text-[11px] font-medium text-neutral-700"
            >
              <Plus className="h-3.5 w-3.5" />
              {BLOCK_LABEL[t]}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={() => setShowPreview(true)}
        >
          <Eye className="h-3.5 w-3.5 mr-1" /> Pré-visualizar
        </Button>
      </aside>

      {/* Canvas (block list) */}
      <div className="bg-white border border-stone-200 rounded-2xl p-3 min-h-[400px]">
        {value.length === 0 ? (
          <div className="py-20 text-center text-sm text-stone-500">
            Nenhum bloco. Use a paleta à esquerda para adicionar.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEnd}>
            <SortableContext items={value.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {value.map((b) => (
                  <SortableBlockRow
                    key={b.id}
                    block={b}
                    active={selectedId === b.id}
                    onSelect={() => setSelectedId(b.id)}
                    onRemove={() => remove(b.id)}
                    onDuplicate={() => duplicate(b.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Inspector */}
      <aside className="bg-white border border-stone-200 rounded-2xl p-4 h-fit lg:sticky lg:top-20">
        {selected ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">
                {BLOCK_LABEL[selected.type]}
              </div>
              <button onClick={() => setSelectedId(null)} className="text-stone-400 hover:text-stone-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <BlockPropsForm key={selected.id} block={selected} onChange={(p) => update(selected.id, p)} />
          </>
        ) : (
          <div className="text-xs text-stone-500 text-center py-8">
            Selecione um bloco para editar suas propriedades.
          </div>
        )}
      </aside>

      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white/95 backdrop-blur px-4 py-2">
              <span className="text-xs uppercase tracking-widest font-bold text-stone-700">Pré-visualização</span>
              <button onClick={() => setShowPreview(false)} className="text-stone-500 hover:text-stone-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            <BlockRenderer blocks={value} />
          </div>
        </div>
      )}
    </div>
  );
}

function SortableBlockRow({
  block,
  active,
  onSelect,
  onRemove,
  onDuplicate,
}: {
  block: Block;
  active: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 rounded-xl border px-2 py-2 ${
        active ? "border-amber-500 bg-amber-50" : "border-stone-200 bg-white hover:border-stone-300"
      }`}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-stone-400 hover:text-stone-700 p-1">
        <GripVertical className="h-4 w-4" />
      </button>
      <button onClick={onSelect} className="flex-1 text-left text-sm font-medium text-neutral-800">
        {BLOCK_LABEL[block.type]}
        <span className="block text-[10px] text-stone-500 font-normal truncate">
          {block.props?.title || block.props?.alt || block.props?.html?.slice(0, 60) || "—"}
        </span>
      </button>
      <button onClick={onDuplicate} className="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-stone-900 p-1">
        <Copy className="h-3.5 w-3.5" />
      </button>
      <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-1">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
