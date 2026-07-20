'use client';

import { mergeAttributes, Node } from '@tiptap/core';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ChangeEvent, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';

type BlogStatus = 'draft' | 'review' | 'published' | 'archived';
type MediaLayout = 'single' | 'two-column' | 'three-column';

type CustomField = {
  id: string;
  key: string;
  value: string;
};

type MediaItem = {
  id: string;
  name: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  layout: MediaLayout;
};

type BlogDraft = {
  title: string;
  slug: string;
  excerpt: string;
  authorName: string;
  category: string;
  status: BlogStatus;
  publishAt: string;
  coverImageUrl: string;
  coverImageAlt: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  customFields: CustomField[];
  mediaItems: MediaItem[];
  contentHtml: string;
};

const STORAGE_KEY = 'kbdl-admin-blog-cms-draft';

const EMPTY_DRAFT: BlogDraft = {
  title: '',
  slug: '',
  excerpt: '',
  authorName: '',
  category: '',
  status: 'draft',
  publishAt: '',
  coverImageUrl: '',
  coverImageAlt: '',
  seoTitle: '',
  seoDescription: '',
  tags: [],
  customFields: [],
  mediaItems: [],
  contentHtml: '',
};

const inputClass =
  'h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

const textareaClass =
  'min-h-24 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

const buttonClass =
  'inline-flex h-9 items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50';

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function estimateReadingTime(html: string) {
  const text = html.replace(/<[^>]*>/g, ' ').trim();
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 220));
}

function loadDraftFromStorage(): BlogDraft | null {
  if (typeof window === 'undefined') return null;

  const savedDraft = window.localStorage.getItem(STORAGE_KEY);
  if (!savedDraft) return null;

  try {
    return JSON.parse(savedDraft) as BlogDraft;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function persistDraftToStorage(draftData: BlogDraft) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
}

async function uploadBlogImage(file: File) {
  // Replace this with your Cloudflare R2 signed-upload API later.
  // The editor contract only needs a public URL back.
  return URL.createObjectURL(file);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function ResizableImageNodeView(props: any) {
  const { node, updateAttributes, selected, editor } = props;
  const width = Number(node.attrs.width ?? 600);
  const height = Number(node.attrs.height ?? 400);
  const layout = node.attrs.layout ?? 'single';

  const dragState = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      startWidth: width,
      startHeight: height,
    };

    const onMove = (moveEvent: PointerEvent) => {
      if (!dragState.current) return;
      const deltaX = moveEvent.clientX - dragState.current.startX;
      const deltaY = moveEvent.clientY - dragState.current.startY;
      const nextWidth = Math.max(120, dragState.current.startWidth + deltaX);
      const nextHeight = Math.max(100, dragState.current.startHeight + deltaY);
      updateAttributes({ width: nextWidth, height: nextHeight });
    };

    const onUp = () => {
      dragState.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const wrapperStyle: React.CSSProperties = {
    display: layout === 'single' ? 'block' : 'inline-block',
    verticalAlign: 'top',
    width:
      layout === 'single'
        ? 'auto'
        : layout === 'two-column'
          ? '49%'
          : layout === 'three-column'
            ? '31%'
            : 'auto',
    marginRight: layout === 'single' ? undefined : '1%',
    fontSize: layout === 'single' ? undefined : '0',
  };

  const imageStyle: React.CSSProperties = {
    width: layout === 'single' ? `${width}px` : '100%',
    maxWidth: '100%',
    height: layout === 'single' ? `${height}px` : 'auto',
    aspectRatio: `${width} / ${height}`,
    objectFit: 'cover',
    borderRadius: '0.75rem',
    display: 'block',
    fontSize: layout === 'single' ? undefined : '1rem',
  };

  const wrapperClass =
    layout === 'single'
      ? `my-4 ${selected ? 'rounded-xl border border-blue-200 bg-blue-50/40 p-2' : ''}`
      : `inline-block align-top ${selected ? 'rounded-xl border border-blue-200 bg-blue-50/40 p-2' : ''} [&_img]:!w-full [&_img]:!max-w-none [&_img]:!h-auto [&_img]:!my-0`;

  return (
    <NodeViewWrapper as="div" className={wrapperClass} style={wrapperStyle}>
      <div className="relative w-full">
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          style={imageStyle}
          onClick={() => editor?.commands.setNodeSelection(node?.pos ?? 0)}
          onDoubleClick={(event) => {
            event.stopPropagation();
            editor?.commands.setNodeSelection(node?.pos ?? 0);
          }}
        />
        {selected && (
          <>
            <div
              className="absolute left-0 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize rounded-full border border-white bg-blue-600 shadow"
              onPointerDown={startResize}
            />
            <div
              className="absolute right-0 top-0 h-3 w-3 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize rounded-full border border-white bg-blue-600 shadow"
              onPointerDown={startResize}
            />
            <div
              className="absolute bottom-0 left-0 h-3 w-3 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize rounded-full border border-white bg-blue-600 shadow"
              onPointerDown={startResize}
            />
            <div
              className="absolute bottom-0 right-0 h-3 w-3 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-full border border-white bg-blue-600 shadow"
              onPointerDown={startResize}
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

const ResizableImageExtension = Node.create({
  name: 'resizableImage',
  group: 'block',
  draggable: true,
  selectable: true,
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      width: { default: 600 },
      height: { default: 400 },
      layout: { default: 'single' },
    };
  },
  parseHTML() {
    return [{ tag: 'img[src]' }];
  },
  renderHTML({ node }) {
    const layout = node.attrs.layout ?? 'single';
    const width = Number(node.attrs.width ?? 600);
    const height = Number(node.attrs.height ?? 400);
    const layoutStyle =
      layout === 'two-column'
        ? 'width:49%;'
        : layout === 'three-column'
          ? 'width:31%;'
          : `width:${width}px;`;

    return [
      'img',
      mergeAttributes(node.attrs, {
        src: node.attrs.src,
        alt: node.attrs.alt,
        width: String(node.attrs.width ?? 600),
        height: String(node.attrs.height ?? 400),
        style: `${layoutStyle}height:${layout === 'single' ? `${height}px;` : 'auto;'}max-width:100%;`,
      }),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNodeView);
  },
});

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-800">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${buttonClass} ${active ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}`}
    >
      {children}
    </button>
  );
}

export function BlogCmsScreen() {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<BlogDraft>(EMPTY_DRAFT);
  const [tagInput, setTagInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [mediaWidth, setMediaWidth] = useState(600);
  const [mediaHeight, setMediaHeight] = useState(400);
  const [mediaLayout, setMediaLayout] = useState<MediaLayout>('single');
  const [isEditorDragging, setIsEditorDragging] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: false,
      }),
      ResizableImageExtension,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
      Placeholder.configure({
        placeholder: 'Write the blog content here. Add images anywhere from the toolbar.',
      }),
    ],
    content: draft.contentHtml || '<p></p>',
    editorProps: {
      attributes: {
        class:
          'min-h-[460px] px-5 py-4 text-sm leading-7 text-gray-900 outline-none font-size-0 [&_img]:my-5 [&_img]:max-h-[420px] [&_img]:max-w-full [&_img]:rounded-lg [&_img]:w-auto [&_.inline-block]:font-size-normal [&_.inline-block_img]:!w-full [&_.inline-block_img]:!h-auto [&_.inline-block_img]:!my-0 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-200 [&_blockquote]:pl-4 [&_blockquote]:text-gray-600',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      setDraft((current) => ({ ...current, contentHtml: currentEditor.getHTML() }));
    },
  });

  useEffect(() => {
    const savedDraft = loadDraftFromStorage();
    if (!savedDraft) return;

    setDraft({ ...EMPTY_DRAFT, ...savedDraft });
  }, []);

  useEffect(() => {
    if (!editor) return;
    if (!draft.contentHtml) return;
    if (editor.getHTML() !== draft.contentHtml) {
      const frame = window.setTimeout(() => {
        editor.commands.setContent(draft.contentHtml, { emitUpdate: false });
      }, 0);
      return () => window.clearTimeout(frame);
    }
  }, [draft.contentHtml, editor]);

  useEffect(() => {
    if (!draft.mediaItems.length) {
      setSelectedMediaId(null);
      return;
    }

    if (!selectedMediaId || !draft.mediaItems.some((item) => item.id === selectedMediaId)) {
      const firstItem = draft.mediaItems[0];
      if (firstItem) setSelectedMediaId(firstItem.id);
    }
  }, [draft.mediaItems, selectedMediaId]);

  const outputPayload = useMemo(
    () => ({
      ...draft,
      readingTimeMinutes: estimateReadingTime(draft.contentHtml),
    }),
    [draft],
  );

  const updateDraft = <K extends keyof BlogDraft>(key: K, value: BlogDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const addTag = () => {
    const value = tagInput.trim();
    if (!value || draft.tags.includes(value)) return;
    updateDraft('tags', [...draft.tags, value]);
    setTagInput('');
  };

  const addCustomField = () => {
    updateDraft('customFields', [...draft.customFields, { id: createId(), key: '', value: '' }]);
  };

  const updateCustomField = (id: string, patch: Partial<CustomField>) => {
    updateDraft(
      'customFields',
      draft.customFields.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    );
  };

  const insertImage = (url: string) => {
    if (!editor || !url.trim()) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'resizableImage',
        attrs: {
          src: url.trim(),
          alt: 'Inserted image',
          width: mediaWidth,
          height: mediaHeight,
          layout: mediaLayout,
        },
      })
      .run();
    setImageUrlInput('');
  };

  const handleEditorImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await uploadBlogImage(file);
    insertImage(url);
    // clear input after handling so the FileList remains available during processing
    event.target.value = '';
  };

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await uploadBlogImage(file);
    updateDraft('coverImageUrl', url);
    if (!draft.coverImageAlt) updateDraft('coverImageAlt', file.name.replace(/\.[^.]+$/, ''));
    event.target.value = '';
  };

  const addMediaFromFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (!fileArray.length) return [] as MediaItem[];

    const newItems = await Promise.all(
      fileArray.map(async (file) => {
        const src = await readFileAsDataUrl(file);
        return {
          id: createId(),
          name: file.name.replace(/\.[^.]+$/, ''),
          src,
          alt: file.name.replace(/\.[^.]+$/, ''),
          width: 600,
          height: 400,
          layout: 'single' as MediaLayout,
        } satisfies MediaItem;
      }),
    );

    setDraft((current) => {
      const next = { ...current, mediaItems: [...current.mediaItems, ...newItems] };
      try {
        persistDraftToStorage(next);
      } catch (e) {
        // ignore storage errors during demo
        // eslint-disable-next-line no-console
        console.warn('Failed to persist draft to storage', e);
      }
      return next;
    });
    setSelectedMediaId(newItems[0]?.id ?? null);
    setMediaWidth(600);
    setMediaHeight(400);
    setMediaLayout('single');
    return newItems;
  };

  const handleMediaUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    // debug log to help trace selection issues
    // eslint-disable-next-line no-console
    console.log('handleMediaUpload: files selected', files);
    await addMediaFromFiles(files);
    // clear input after processing so same file can be selected again
    event.target.value = '';
  };

  const insertMediaItem = (item: MediaItem) => {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'resizableImage',
        attrs: {
          src: item.src,
          alt: item.alt,
          width: mediaWidth || item.width,
          height: mediaHeight || item.height,
          layout: mediaLayout,
        },
      })
      .run();
  };

  const insertMediaGallery = (items: MediaItem[]) => {
    if (!editor || !items.length) return;

    items.forEach((item) => {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'resizableImage',
          attrs: {
            src: item.src,
            alt: item.alt,
            width: mediaWidth || item.width,
            height: mediaHeight || item.height,
            layout: mediaLayout,
          },
        })
        .run();
    });
  };

  const handleEditorDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsEditorDragging(false);

    const files = event.dataTransfer.files;
    if (!files?.length) return;

    const addedItems = await addMediaFromFiles(files);
    if (addedItems[0]) {
      insertMediaItem(addedItems[0]);
    }
  };

  const saveDraft = () => {
    const nextDraft = { ...draft, contentHtml: editor?.getHTML() ?? draft.contentHtml };
    persistDraftToStorage(nextDraft);
    setDraft(nextDraft);
    editor?.commands.setContent(nextDraft.contentHtml || '<p></p>', { emitUpdate: false });
    setSavedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
  };

  const clearDraft = () => {
    if (!window.confirm('Clear this local blog draft?')) return;
    window.localStorage.removeItem(STORAGE_KEY);
    setDraft(EMPTY_DRAFT);
    editor?.commands.setContent('<p></p>', { emitUpdate: false });
    setSavedAt(null);
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              Content CMS
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-950">Blog Editor</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create rich blog posts with flexible fields and inline images.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={clearDraft} className={buttonClass}>
              Clear
            </button>
            <button
              type="button"
              onClick={saveDraft}
              className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Save Local Draft
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-5">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Field label="Title">
                  <input
                    value={draft.title}
                    onChange={(event) => {
                      const title = event.target.value;
                      setDraft((current) => ({
                        ...current,
                        title,
                        slug: current.slug || slugify(title),
                        seoTitle: current.seoTitle || title,
                      }));
                    }}
                    className={inputClass}
                    placeholder="Example: How KBDL helps employers hire faster"
                  />
                </Field>
                <Field label="Slug">
                  <div className="flex gap-2">
                    <input
                      value={draft.slug}
                      onChange={(event) => updateDraft('slug', slugify(event.target.value))}
                      className={inputClass}
                      placeholder="blog-post-url"
                    />
                    <button
                      type="button"
                      onClick={() => updateDraft('slug', slugify(draft.title))}
                      className={buttonClass}
                    >
                      Generate
                    </button>
                  </div>
                </Field>
                <Field label="Author">
                  <input
                    value={draft.authorName}
                    onChange={(event) => updateDraft('authorName', event.target.value)}
                    className={inputClass}
                    placeholder="Author name"
                  />
                </Field>
                <Field label="Category">
                  <input
                    value={draft.category}
                    onChange={(event) => updateDraft('category', event.target.value)}
                    className={inputClass}
                    placeholder="Hiring, Workforce, Operations"
                  />
                </Field>
                <Field label="Status">
                  <select
                    value={draft.status}
                    onChange={(event) => updateDraft('status', event.target.value as BlogStatus)}
                    className={inputClass}
                  >
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </Field>
                <Field label="Publish Date">
                  <input
                    type="datetime-local"
                    value={draft.publishAt}
                    onChange={(event) => updateDraft('publishAt', event.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Excerpt" hint="Short summary for cards, search, and social previews.">
                <textarea
                  value={draft.excerpt}
                  onChange={(event) => updateDraft('excerpt', event.target.value)}
                  className={textareaClass}
                  placeholder="Write a 1-2 line summary..."
                />
              </Field>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-wrap gap-2 border-b border-gray-200 p-3">
                <ToolbarButton
                  active={editor?.isActive('bold')}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                >
                  Bold
                </ToolbarButton>
                <ToolbarButton
                  active={editor?.isActive('italic')}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                >
                  Italic
                </ToolbarButton>
                <ToolbarButton
                  active={editor?.isActive('heading', { level: 2 })}
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                  H2
                </ToolbarButton>
                <ToolbarButton
                  active={editor?.isActive('heading', { level: 3 })}
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                >
                  H3
                </ToolbarButton>
                <ToolbarButton
                  active={editor?.isActive('bulletList')}
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                >
                  Bullets
                </ToolbarButton>
                <ToolbarButton
                  active={editor?.isActive('orderedList')}
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                >
                  Numbers
                </ToolbarButton>
                <ToolbarButton
                  active={editor?.isActive('blockquote')}
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                >
                  Quote
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => {
                    const url = window.prompt('Paste link URL');
                    if (!url) return;
                    editor?.chain().focus().setLink({ href: url }).run();
                  }}
                >
                  Link
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => {
                    const selectedMedia = draft.mediaItems.find(
                      (item) => item.id === selectedMediaId,
                    );
                    if (selectedMedia) {
                      insertMediaItem(selectedMedia);
                    }
                  }}
                >
                  Insert Selected
                </ToolbarButton>
              </div>

              <div className="border-b border-gray-200 p-3">
                <div className="mb-3 flex flex-col gap-2 md:flex-row">
                  <input
                    value={imageUrlInput}
                    onChange={(event) => setImageUrlInput(event.target.value)}
                    className={inputClass}
                    placeholder="Paste Cloudflare R2 public image URL"
                  />
                  <button
                    type="button"
                    onClick={() => insertImage(imageUrlInput)}
                    className={buttonClass}
                  >
                    Insert URL
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Use the Media Library panel to upload and manage images, then insert them below.
                </p>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditorImageUpload}
                  className="hidden"
                />
              </div>

              <div
                onDrop={handleEditorDrop}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsEditorDragging(true);
                }}
                onDragLeave={() => setIsEditorDragging(false)}
                className={`rounded-b-lg p-2 transition ${isEditorDragging ? 'bg-blue-50' : 'bg-white'}`}
              >
                {isEditorDragging && (
                  <div className="mb-2 rounded-md border-2 border-dashed border-blue-400 bg-blue-50 p-2 text-center text-sm text-blue-700">
                    Drop images here to add them to the blog
                  </div>
                )}
                <EditorContent editor={editor} />
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-950">Cover Image</h2>
              <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                {draft.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.coverImageUrl}
                    alt={draft.coverImageAlt}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center text-sm text-gray-400">
                    No cover selected
                  </div>
                )}
              </div>
              <div className="mt-3 space-y-3">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className={buttonClass}
                >
                  Upload Cover
                </button>
                <input
                  value={draft.coverImageUrl}
                  onChange={(event) => updateDraft('coverImageUrl', event.target.value)}
                  className={inputClass}
                  placeholder="Or paste R2 cover URL"
                />
                <input
                  value={draft.coverImageAlt}
                  onChange={(event) => updateDraft('coverImageAlt', event.target.value)}
                  className={inputClass}
                  placeholder="Alt text"
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-sm font-bold text-gray-950">Media Library</h2>
                <button
                  type="button"
                  onClick={() => mediaInputRef.current?.click()}
                  className={buttonClass}
                >
                  Upload
                </button>
              </div>
              <input
                ref={mediaInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleMediaUpload}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mb-3">
                Upload images here first, then select and insert into the editor.
              </p>

              <div className="space-y-2 mb-3">
                {draft.mediaItems.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 p-3 text-sm text-gray-500 text-center">
                    No images uploaded yet. Click Upload or drop images here.
                  </div>
                ) : (
                  draft.mediaItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedMediaId(item.id);
                        setMediaWidth(item.width);
                        setMediaHeight(item.height);
                        setMediaLayout(item.layout);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition ${
                        selectedMediaId === item.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={item.src}
                        alt={item.alt}
                        className="h-16 w-16 rounded-md object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {item.width} × {item.height}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {selectedMediaId && (
                <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs font-medium text-gray-600">
                      <span className="mb-1 block">Width (px)</span>
                      <input
                        type="number"
                        min="100"
                        value={mediaWidth}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (!Number.isNaN(value)) {
                            setMediaWidth(value);
                            setDraft((current) => ({
                              ...current,
                              mediaItems: current.mediaItems.map((item) =>
                                item.id === selectedMediaId ? { ...item, width: value } : item,
                              ),
                            }));
                          }
                        }}
                        className={inputClass}
                      />
                    </label>
                    <label className="text-xs font-medium text-gray-600">
                      <span className="mb-1 block">Height (px)</span>
                      <input
                        type="number"
                        min="100"
                        value={mediaHeight}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (!Number.isNaN(value)) {
                            setMediaHeight(value);
                            setDraft((current) => ({
                              ...current,
                              mediaItems: current.mediaItems.map((item) =>
                                item.id === selectedMediaId ? { ...item, height: value } : item,
                              ),
                            }));
                          }
                        }}
                        className={inputClass}
                      />
                    </label>
                  </div>
                  <label className="block text-xs font-medium text-gray-600">
                    <span className="mb-1 block">Layout</span>
                    <select
                      value={mediaLayout}
                      onChange={(event) => {
                        const value = event.target.value as MediaLayout;
                        setMediaLayout(value);
                        setDraft((current) => ({
                          ...current,
                          mediaItems: current.mediaItems.map((item) =>
                            item.id === selectedMediaId ? { ...item, layout: value } : item,
                          ),
                        }));
                      }}
                      className={inputClass}
                    >
                      <option value="single">Single column</option>
                      <option value="two-column">Two columns</option>
                      <option value="three-column">Three columns</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const selectedMedia = draft.mediaItems.find(
                        (item) => item.id === selectedMediaId,
                      );
                      if (selectedMedia) {
                        insertMediaItem(selectedMedia);
                      }
                    }}
                    className="w-full inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Insert into blog
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft((current) => ({
                        ...current,
                        mediaItems: current.mediaItems.filter(
                          (item) => item.id !== selectedMediaId,
                        ),
                      }));
                      setSelectedMediaId(null);
                    }}
                    className="w-full text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Delete from library
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-950">Tags</h2>
              <div className="mt-3 flex gap-2">
                <input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addTag();
                    }
                  }}
                  className={inputClass}
                  placeholder="Add tag"
                />
                <button type="button" onClick={addTag} className={buttonClass}>
                  Add
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {draft.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      updateDraft(
                        'tags',
                        draft.tags.filter((item) => item !== tag),
                      )
                    }
                    className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
                  >
                    {tag} x
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-gray-950">Dynamic Fields</h2>
                <button type="button" onClick={addCustomField} className={buttonClass}>
                  Add Field
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {draft.customFields.map((field) => (
                  <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <input
                      value={field.key}
                      onChange={(event) => updateCustomField(field.id, { key: event.target.value })}
                      className={inputClass}
                      placeholder="Key"
                    />
                    <input
                      value={field.value}
                      onChange={(event) =>
                        updateCustomField(field.id, { value: event.target.value })
                      }
                      className={inputClass}
                      placeholder="Value"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft(
                          'customFields',
                          draft.customFields.filter((item) => item.id !== field.id),
                        )
                      }
                      className={buttonClass}
                    >
                      x
                    </button>
                  </div>
                ))}
                {draft.customFields.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Add optional fields like campaign, region, source, or landing label.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-950">SEO</h2>
              <div className="mt-3 space-y-3">
                <input
                  value={draft.seoTitle}
                  onChange={(event) => updateDraft('seoTitle', event.target.value)}
                  className={inputClass}
                  placeholder="SEO title"
                />
                <textarea
                  value={draft.seoDescription}
                  onChange={(event) => updateDraft('seoDescription', event.target.value)}
                  className={textareaClass}
                  placeholder="SEO description"
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-950">Output Preview</h2>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <dt className="text-gray-500">Reading time</dt>
                <dd className="font-semibold text-gray-900">
                  {outputPayload.readingTimeMinutes} min
                </dd>
                <dt className="text-gray-500">Status</dt>
                <dd className="font-semibold capitalize text-gray-900">{draft.status}</dd>
              </dl>
              {savedAt && <p className="mt-3 text-xs text-green-700">Saved locally at {savedAt}</p>}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
