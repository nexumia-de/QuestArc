import { Component, createSignal, Show } from "solid-js";

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => void;
}

const ImportDialog: Component<ImportDialogProps> = (props) => {
  const [importText, setImportText] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);

  const handleTextImport = () => {
    try {
      if (!importText().trim()) {
        setError("Please paste some JSON first.");
        return;
      }
      const json = JSON.parse(importText());
      props.onImport(json);
      resetAndClose();
    } catch (e) {
      setError("Invalid JSON format.");
    }
  };

  const handleFileUpload = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        props.onImport(json);
        resetAndClose();
      } catch (err) {
        setError("Failed to parse file.");
      }
    };
    reader.readAsText(file);
  };

  const resetAndClose = () => {
    setImportText("");
    setError(null);
    props.onClose();
  };

  return (
    <Show when={props.isOpen}>
      <div class="modal-overlay">
        <div class="modal import-modal">
          <h3>Import Quest</h3>
          <p class="export-help-text">
            Paste the quest JSON below or upload a .json file.
          </p>

          <textarea
            class="export-textarea"
            placeholder="Paste JSON here..."
            value={importText()}
            onInput={(e) => {
              setImportText((e.target as HTMLTextAreaElement).value);
              setError(null);
            }}
          />

          <Show when={error()}>
            <div
              class="error-message"
              style={{ color: "var(--hp-color)", "margin-bottom": "1rem" }}
            >
              {error()}
            </div>
          </Show>

          <div
            class="modal-actions"
            style={{ "justify-content": "space-between" }}
          >
            <div class="action-group">
              <label class="secondary-btn" style={{ cursor: "pointer" }}>
                📁 Upload File
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            <div class="action-group">
              <button class="secondary-btn" onClick={resetAndClose}>
                Cancel
              </button>
              <button class="primary-btn" onClick={handleTextImport}>
                Import
              </button>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default ImportDialog;
