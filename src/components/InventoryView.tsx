import { Component } from 'solid-js';
import './InventoryView.css';

interface InventoryViewProps {
    onNavigate: (view: any) => void;
}

const InventoryView: Component<InventoryViewProps> = (props) => {
    return (
        <section class="inventory-view">
            <div class="inventory-header">
                <h2>Inventory</h2>
                <div class="currency-display">
                    <span class="gold-icon">🪙</span>
                    <span class="gold-amount">0</span>
                </div>
            </div>

            <div class="empty-inventory-state">
                <div class="empty-icon">🎒</div>
                <h3>Your Bag is Empty</h3>
                <p>Complete quests and defeat bosses to earn loot!</p>
                <button class="secondary-btn" onClick={() => props.onNavigate('dashboard')}>
                    Back to Adventure
                </button>
            </div>

            {/* Placeholder for future grid */}
            <div class="inventory-grid placeholder">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div class="inventory-slot empty" title="Empty Slot"></div>
                ))}
            </div>
        </section>
    );
};

export default InventoryView;
