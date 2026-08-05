import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import { useNodeCallback } from '../providers/NodeCallbackContext';

type EditField = 'title' | 'content' | null;

export default function IdeaNode({ id, data, selected }: NodeProps) {
  const title = (data as any).label as string || 'New Node';
  const content = (data as any).content as string || '';

  const { onNodeUpdate } = useNodeCallback();

  // UI-only state — never persisted to Domain
  const [isExpanded, setIsExpanded] = useState(true);
  const [editField, setEditField] = useState<EditField>(null);
  const [editValue, setEditValue] = useState('');

  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const updateNodeInternals = useUpdateNodeInternals();

  const isEditing = editField !== null;

  // ---- Expand / Collapse: ARROW ONLY ----
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  // ---- Start editing a field ----
  const startEdit = useCallback((field: EditField, currentValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditField(field);
    setEditValue(currentValue);
  }, []);

  // ---- Commit: save value via context callback ----
  const commitEdit = useCallback(() => {
    if (editField === null) return;
    if (editField === 'title') {
      onNodeUpdate(id, { label: editValue.trim() || 'New Node' });
    } else if (editField === 'content') {
      onNodeUpdate(id, { content: editValue });
    }
    setEditField(null);
  }, [editField, editValue, id, onNodeUpdate]);

  // ---- Cancel: discard changes ----
  const cancelEdit = useCallback(() => {
    setEditField(null);
    setEditValue('');
  }, []);

  // Auto-focus the editor when it mounts
  useEffect(() => {
    if (editField === 'title') {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    } else if (editField === 'content') {
      const ta = contentTextareaRef.current;
      if (ta) {
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }
    }
  }, [editField]);

  // Notify React Flow of layout changes when expanded state changes
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, isExpanded, updateNodeInternals]);

  // ---- Keyboard: Title input ----
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  // ---- Keyboard: Content textarea ----
  const handleContentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      commitEdit();
    }
    // Plain Enter inserts a newline — browser default, no override needed
  };

  return (
    <div
      className={`idea-node ${isExpanded ? 'expanded' : 'collapsed'} ${selected ? 'selected' : ''} ${isEditing ? 'editing' : ''}`}
    >
      <Handle type="target" position={Position.Top} />

      {/* ── TITLE BAR ── */}
      <div className="idea-node-title">
        {editField === 'title' ? (
          /*
           * The `nodrag` class is the recommended React Flow mechanism to
           * prevent the node from being dragged when the user interacts with
           * this element. It allows native text selection and cursor movement
           * to work normally without any stopPropagation hacks.
           */
          <input
            ref={titleInputRef}
            className="idea-node-inline-input nodrag"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleTitleKeyDown}
            onBlur={commitEdit}
          />
        ) : (
          <span
            className="idea-node-title-text"
            onDoubleClick={(e) => startEdit('title', title, e)}
          >
            {title}
          </span>
        )}

        {/* Arrow button — ONLY trigger for expand/collapse */}
        <button
          className={`idea-node-toggle ${isExpanded ? 'expanded' : 'collapsed'}`}
          onClick={handleToggle}
          onMouseDown={(e) => e.stopPropagation()}
          tabIndex={-1}
          title={isExpanded ? 'Collapse' : 'Expand'}
          aria-label={isExpanded ? 'Collapse node' : 'Expand node'}
        >
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>

      {/* ── CONTENT ── */}
      {isExpanded && (
        editField === 'content' ? (
          /*
           * Same as above: `nodrag` tells React Flow to not initiate a drag
           * when the user clicks or drags inside this textarea, while
           * preserving all native text selection behavior.
           */
          <textarea
            ref={contentTextareaRef}
            className="idea-node-inline-textarea nodrag"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleContentKeyDown}
            onBlur={commitEdit}
          />
        ) : (
          <div
            className="idea-node-content"
            onDoubleClick={(e) => startEdit('content', content, e)}
          >
            {content
              ? content
              : <span className="idea-node-placeholder">Double-click to add content…</span>
            }
          </div>
        )
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
