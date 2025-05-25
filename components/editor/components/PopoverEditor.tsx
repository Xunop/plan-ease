import { useEditor, EditorContent, Editor } from "@tiptap/react";
import { Collaboration } from "@tiptap/extension-collaboration";
import { Document } from "@tiptap/extension-document";
import { Text } from "@tiptap/extension-text";
import { ListItem } from "@tiptap/extension-list-item";
import { BulletList } from "@tiptap/extension-bullet-list";
import { HardBreak } from "@tiptap/extension-hard-break";
import Paragraph from "@tiptap/extension-paragraph";
import Image from "@tiptap/extension-image";
import { useEffect } from "react";
import { AmapPlace } from "@/lib/api/gaode/types";

const CustomDocument = Document.extend({
  content: "bulletList", // Only allow lists at the top level
});

export function PopoverEditor({
  mentionId,
  editor: mainEditor,
  place,
}: {
  mentionId: string;
  editor: Editor;
  place: AmapPlace | null;
}) {
  // Access the YDoc from the main editor's Collaboration extension
  const collaborationExt = mainEditor.extensionManager.extensions.find(
    (ext) => ext.name === "collaboration",
  );
  const yDoc = collaborationExt?.options.document;

  // Define a unique field for this mention's popover content
  const fieldName = `popover_${mentionId}`;

  // Initialize the popover editor
  const popoverEditor = useEditor({
    immediatelyRender: true,
    extensions: [
      Paragraph,
      CustomDocument,
      Text,
      ListItem,
      BulletList,
      Image,
      HardBreak.configure({ keepMarks: false }),
      Collaboration.configure({
        document: yDoc,
        field: fieldName,
      }),
    ],
    autofocus: "start",
  });

  // Initialize default content if the Yjs field is empty
  useEffect(() => {
    if (!popoverEditor || !yDoc) return;

    const isEmpty = popoverEditor.isEmpty;

    // FIXME: Now no check editor is empty
    // if (isEmpty) {
    // Build the default JSON content from AmapPlace
    const listItems = [];
    console.log("popover editor place: ", place)

    if (place !== null) {
      // Add address
      listItems.push({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: `Address: ${place.address || "N/A"}`,
              },
            ],
          },
        ],
      });

      // Add non-null business properties
      const businessEntries = Object.entries(place.business).filter(
        ([_, value]) => value != null && value !== "",
      );
      businessEntries.forEach(([key, value]) => {
        listItems.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `${key}: ${value}`,
                },
              ],
            },
          ],
        });
      });

      // Add photos (title and url as a link)
      if (place.photos && place.photos.length > 0) {
        place.photos.forEach((photo, index) => {
          listItems.push({
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: `Photo ${index + 1}: ${photo.title || "Untitled"}`,
                  },
                  {
                    type: "image",
                    attrs: {
                      src: photo.url,
                      alt: photo.title || "Untitled",
                    },
                  },
                ],
              },
            ],
          });
        });
      }
    }

    // Construct the JSON content
    const defaultContent = {
      type: "doc",
      content: [
        {
          type: "bulletList",
          content:
            listItems.length > 0
              ? listItems
              : [
                  {
                    type: "listItem",
                    content: [],
                  },
                ],
        },
      ],
    };

    // Set the default content
    // FIXME: always empty content if set default content
    popoverEditor.commands.setContent(defaultContent);
    // }

    return () => {
      popoverEditor.destroy();
    };
  }, [popoverEditor, yDoc, fieldName, place]);

  if (!popoverEditor) {
    return null;
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-1 h-80 overflow-auto">
      <EditorContent
        editor={popoverEditor}
        className="list-disc p-1 marker:text-gray-300"
      />
    </div>
  );
}
