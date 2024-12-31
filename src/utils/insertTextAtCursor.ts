import * as monaco from 'monaco-editor';
import { editor } from 'monaco-editor';

export function insertTextAtCursor(
  editorInstance: editor.IStandaloneCodeEditor | null,
  text: string
) {
  if (!editorInstance) return;

  const selection = editorInstance.getSelection();
  if (selection) {
    const position = selection.getPosition();
    const range = new monaco.Range(
      position.lineNumber,
      position.column,
      position.lineNumber,
      position.column
    );

    editorInstance.executeEdits('insert-image', [{
      range: range,
      text: text,
      forceMoveMarkers: true
    }]);
    
    // Move cursor after the inserted text
    editorInstance.setPosition({
      lineNumber: position.lineNumber,
      column: position.column + text.length
    });
    editorInstance.focus();
  }
}