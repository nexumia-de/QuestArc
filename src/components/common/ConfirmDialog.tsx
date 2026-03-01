import { Component, Show } from "solid-js";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  showCancel?: boolean;
  isDanger?: boolean;
  customActions?: any;
}

const ConfirmDialog: Component<ConfirmDialogProps> = (props) => {
  return (
    <Show when={props.isOpen}>
      <div class="modal-overlay">
        <div class="modal">
          <h3>{props.title}</h3>
          <p>{props.message}</p>
          <div class="modal-actions">
            <Show
              when={props.customActions}
              fallback={
                <>
                  <Show when={props.showCancel !== false}>
                    <button class="secondary-btn" onClick={props.onCancel}>
                      {props.cancelText || "Cancel"}
                    </button>
                  </Show>
                  <button
                    class={`primary-btn ${props.isDanger ? "danger-btn" : ""}`}
                    onClick={props.onConfirm}
                  >
                    {props.confirmText || "Confirm"}
                  </button>
                </>
              }
            >
              {props.customActions}
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default ConfirmDialog;
