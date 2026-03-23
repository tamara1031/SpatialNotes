# Use Case UC8: User Feedback & Notifications

| Item | Description |
| :--- | :--- |
| **Primary Actor** | User |
| **Secondary Actor** | System Component (Canvas, Sidebar, Sync Engine) |
| **Goal** | Provide immediate, non-blocking feedback for user actions or system events. |

## 1. Main Success Scenario (Trigger Feedback)
1. A **System Component** completes an action (e.g., Delete Node).
2. The component requests the **Notification Controller** to show a message.
3. The **Notification Controller** adds the message to the **Notification Store**.
4. The **Notification Boundary** (Island) detects the change and renders the snack-bar.
5. The message automatically disappears after a timeout.

## 2. Alternate Flow (Undo Action)
1. The **Notification Boundary** displays a message with an "Undo" action.
2. The **User** clicks the "Undo" button before expiration.
3. The **Notification Boundary** triggers the associated action (Control).
4. The system reverts the previous change.
5. The notification is immediately dismissed.

## 3. Post-conditions
- **Feedback**: User is aware of the result of their interaction.
- **Resilience**: Destructive actions are reversible via the notification UI.
- **Cleanliness**: Ephemeral state is purged automatically.
