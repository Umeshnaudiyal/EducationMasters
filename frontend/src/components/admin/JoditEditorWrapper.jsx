"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

const TinyMCEEditor = dynamic(
  () => import("@tinymce/tinymce-react").then((mod) => mod.Editor),
  { ssr: false },
);

export default function JoditEditorWrapper({
  value,
  onChange,
  onBlur,
  height = 420,
  placeholder = "Start typing...",
  showYearToken = false,
  yearToken = "{{year}}",
  config: configOverrides = {},
}) {
  const [editorValue, setEditorValue] = useState(value || "");

  // Sync external value changes without causing infinite loops
  useEffect(() => {
    if (value !== undefined && value !== editorValue) {
      setEditorValue(value || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const { setup: overrideSetup, toolbar: overrideToolbar, ...editorOverrides } = configOverrides || {};

  const init = useMemo(
    () => ({
      height,
      menubar: "file edit view insert format tools table help",
      placeholder,
      plugins: [
        "advlist",
        "autolink",
        "lists",
        "link",
        "image",
        "media",
        "table",
        "codesample",
        "searchreplace",
        "visualblocks",
        "code",
        "fullscreen",
        "insertdatetime",
        "preview",
        "anchor",
        "help",
        "wordcount",
      ],
      toolbar_mode: "sliding",
      branding: false,
      promotion: false,
      content_style:
        "body { font-family: Inter, Arial, sans-serif; font-size: 15px; line-height: 1.7; padding: 12px; } table { border-collapse: collapse; width: 100%; } table td, table th { border: 1px solid #cbd5e1; padding: 8px 10px; }",
      paste_data_images: true,
      setup: (editor) => {
        if (showYearToken) {
          editor.ui.registry.addButton("insertYearToken", {
            text: "Year",
            tooltip: "Insert year token",
            onAction: () => editor.insertContent(yearToken),
          });

          editor.ui.registry.addMenuItem("insertYearToken", {
            text: "Insert year token",
            onAction: () => editor.insertContent(yearToken),
          });
        }

        if (typeof overrideSetup === "function") {
          overrideSetup(editor);
        }
      },
      ...editorOverrides,
      toolbar:
        `${overrideToolbar || "undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | codesample code preview fullscreen"}${showYearToken ? " | insertYearToken" : ""}`,
    }),
    [height, placeholder, JSON.stringify(editorOverrides), overrideSetup, overrideToolbar, showYearToken, yearToken],
  );

  return (
    <TinyMCEEditor
      tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.3/tinymce.min.js"
      value={editorValue}
      init={init}
      onEditorChange={(newContent) => {
        setEditorValue(newContent);
        if (onChange) {
          onChange(newContent);
        }
      }}
      onBlur={(event, editor) => {
        const content = editor?.getContent?.() ?? editorValue;
        if (onChange) onChange(content);
        if (onBlur) onBlur(content);
      }}
    />
  );
}
