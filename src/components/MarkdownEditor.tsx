import { Box } from '@chakra-ui/react';
import Editor from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor';

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
  onSave: (content: string) => void;
  viewMode: 'edit' | 'preview' | 'split';
  onEditorMount?: (editor: editor.IStandaloneCodeEditor) => void;
}

export function MarkdownEditor({ content, onChange, onSave, viewMode, onEditorMount }: MarkdownEditorProps) {
  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    // Add save command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const currentContent = editor.getValue();
      onSave(currentContent);
    });

    // Call parent's onEditorMount if provided
    if (onEditorMount) {
      onEditorMount(editor);
    }
  };

  return (
    <Box 
      w={viewMode === 'split' ? '50%' : 'full'}
      height="calc(100vh - 112px)"
      overflowY="auto"
    >
      <Editor
        height="100%"
        language="markdown"
        value={content}
        onChange={(value) => onChange(value || '')}
        theme="vs-light"
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          wordWrap: 'on',
          lineHeight: 1.6,
          padding: { top: 20 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          suggestOnTriggerCharacters: true,
        }}
      />
    </Box>
  );
}