import Image from '@tiptap/extension-image';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { useRef, useState } from 'react';

const clamp = (n: number) => Math.max(15, Math.min(100, Math.round(n)));
const safeAlign = (a: unknown) => a === 'left' || a === 'right' ? a : 'center';

function ImageView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const width = clamp(Number(node.attrs.width) || 100);
  const align = safeAlign(node.attrs.align);
  const start = useRef({ x: 0, width: 100, parentWidth: 1 });

  function begin(e: React.PointerEvent<HTMLButtonElement>) {
    if (!editor.isEditable) return;
    e.preventDefault();
    const parentWidth = wrapper.current?.parentElement?.clientWidth || 1;
    start.current = { x: e.clientX, width, parentWidth };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent<HTMLButtonElement>) {
    if (!dragging) return;
    updateAttributes({ width: clamp(start.current.width + ((e.clientX - start.current.x) / start.current.parentWidth) * 100) });
  }
  function end() { setDragging(false); }

  return (
    <NodeViewWrapper className={`editor-image-node image-align-${align}`} data-drag-handle="false">
      <div ref={wrapper} className={`editor-image-frame ${selected ? 'is-selected' : ''}`} style={{ width: `${width}%` }}>
        <img src={node.attrs.src} alt={node.attrs.alt || ''} title={node.attrs.title || ''} draggable={false} />
        {editor.isEditable && selected && (
          <button type="button" className="editor-image-resize" aria-label="Drag to resize image" contentEditable={false}
            onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
            ↘
          </button>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 100,
        parseHTML: element => clamp(Number(element.getAttribute('data-width') || 100)),
        renderHTML: attrs => ({ 'data-width': String(clamp(Number(attrs.width) || 100)) }),
      },
      align: {
        default: 'center',
        parseHTML: element => safeAlign(element.getAttribute('data-align')),
        renderHTML: attrs => ({ 'data-align': safeAlign(attrs.align) }),
      },
    };
  },
  addNodeView() { return ReactNodeViewRenderer(ImageView); },
});
