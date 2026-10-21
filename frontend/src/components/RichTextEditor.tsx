import { useEffect, useRef } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Essentials, Paragraph, Heading, Bold, Italic, Underline, Strikethrough,
  Link, List, BlockQuote, Undo, Alignment, Font, Highlight,
  Table, TableToolbar, TableProperties, TableCellProperties, TableColumnResize, Image, ImageToolbar, ImageCaption, ImageStyle,
  ImageResize, ImageUpload, FileRepository, GeneralHtmlSupport,
  MediaEmbed,
} from "ckeditor5";
import type { Editor } from "ckeditor5";
import { uploadArticleMedia } from "../services/media";
import "ckeditor5/ckeditor5.css";
import "../styles/CKEditorArticle.css";

type Props = { value: string; onChange: (html: string) => void };

// Reuses the existing authenticated /api/media endpoint.
// CKEditor expects an upload adapter returning { default: publicImageUrl }.
function ArticleUploadAdapterPlugin(editor: Editor) {
  editor.plugins.get(FileRepository).createUploadAdapter = (loader) => ({
    upload: async () => {
      const file = await loader.file;
      if (!file) throw new Error("No image selected");
      if (!file.type.startsWith("image/")) throw new Error("Select an image file");
      const uploaded = await uploadArticleMedia(file);
      if (uploaded.type !== "image") throw new Error("Expected an image upload");
      return { default: uploaded.url };
    },
    abort: () => { /* Upload endpoint does not currently support cancellation. */ },
  });
}

const config = {
  // GPL is suitable only when your distribution satisfies GPL terms.
  // For incompatible distribution terms, obtain and configure a CKEditor license.
  licenseKey: "GPL",
  plugins: [
    Essentials, Paragraph, Heading, Bold, Italic, Underline, Strikethrough,
    Link, List, BlockQuote, Undo, Alignment, Font, Highlight,
    Table, TableToolbar, TableProperties, TableCellProperties, TableColumnResize, Image, ImageToolbar, ImageCaption, ImageStyle,
    ImageResize, ImageUpload, FileRepository, GeneralHtmlSupport, MediaEmbed,
  ],
  extraPlugins: [ArticleUploadAdapterPlugin],
  toolbar: {
    items: [
      "undo", "redo", "|", "heading", "|", "fontFamily", "fontSize",
      "fontColor", "fontBackgroundColor", "highlight", "|",
      "bold", "italic", "underline", "strikethrough", "|",
      "alignment", "bulletedList", "numberedList", "outdent", "indent", "|",
      "link", "uploadImage", "insertTable", "mediaEmbed", "blockQuote",
    ],
    shouldNotGroupWhenFull: true,
  },
  image: {
    toolbar: ["imageTextAlternative", "toggleImageCaption", "|", "imageStyle:inline", "imageStyle:alignLeft", "imageStyle:alignCenter", "imageStyle:alignRight", "imageStyle:alignBlockLeft", "imageStyle:alignBlockRight", "|", "resizeImage"],
    styles: ["inline", "block", "alignLeft", "alignCenter", "alignRight", "alignBlockLeft", "alignBlockRight"],
    resizeOptions: [
      { name: "resizeImage:original", value: null, label: "Original" },
      { name: "resizeImage:25", value: "25", label: "25%" },
      { name: "resizeImage:50", value: "50", label: "50%" },
      { name: "resizeImage:75", value: "75", label: "75%" },
    ],
    resizeUnit: "%",
  },
  table: {
    contentToolbar: [
      "tableColumn", "tableRow", "mergeTableCells", "|",
      "tableProperties", "tableCellProperties"
    ],
    tableProperties: {
      defaultProperties: { alignment: "center" }
    }
  },
  mediaEmbed: { previewsInData: true },
  // Retain a restricted set of HTML attributes from existing Tiptap articles.
  // This is editor compatibility, NOT server-side sanitisation.
  htmlSupport: {
    allow: [
      { name: /^(p|span|div|img|figure|figcaption|video|source)$/, attributes: ["src", "alt", "controls", "preload", "data-width", "data-align", "width", "height", "class"], classes: ["article-image", "align-center", "align-left", "align-right", "image", "image_resized", "media"], styles: { width: /^(?:\d{1,3}(?:\.\d+)?%|\d{1,4}px)$/, "text-align": /^(left|center|right|justify)$/ } },
    ],
  },
};

export default function RichTextEditor({ value, onChange }: Props) {
  const editorRef = useRef<Editor | null>(null);
  const lastEmitted = useRef<string>("");
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || value === lastEmitted.current || editor.getData() === value) return;
    editor.setData(value || "");
  }, [value]);

  return (
    <div className="article-ckeditor">
      <CKEditor
        editor={ClassicEditor}
        config={config}
        data={value || ""}
        onReady={(editor) => { editorRef.current = editor; }}
        onChange={(_event, editor) => {
          const html = editor.getData();
          lastEmitted.current = html;
          onChange(html);
        }}
        onError={(error) => { console.error("CKEditor error", error); }}
      />
    </div>
  );
}
