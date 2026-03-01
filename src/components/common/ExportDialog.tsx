import { Component, createSignal, Show } from "solid-js";
import { HeroStory } from "../../types/state";

interface ExportDialogProps {
  isOpen: boolean;
  story: HeroStory | null;
  onClose: () => void;
}

const ExportDialog: Component<ExportDialogProps> = (props) => {
  const [copyStatus, setCopyStatus] = createSignal<string>("Copy to Clipboard");

  const getStoryJson = () => {
    if (!props.story) return "";
    return JSON.stringify(props.story, null, 2);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getStoryJson());
      setCopyStatus("Copied! ✅");
      setTimeout(() => setCopyStatus("Copy to Clipboard"), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setCopyStatus("Failed to copy ❌");
    }
  };

  return (
    <Show when={props.isOpen && props.story}>
      <div class="modal-overlay">
        <div class="modal export-modal">
          <h3>Export Quest: {props.story?.title}</h3>
          <p class="export-help-text">
            Copy the text below and save it as a <code>.json</code> file to
            backup or share your quest.
          </p>

          <textarea
            class="export-textarea"
            readonly
            value={getStoryJson()}
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          />

          <div class="modal-actions">
            <button class="secondary-btn" onClick={props.onClose}>
              Close
            </button>
            <div class="action-group">
              <button class="primary-btn" onClick={handleCopy}>
                {copyStatus()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default ExportDialog;
