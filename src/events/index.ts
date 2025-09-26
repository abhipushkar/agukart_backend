import { EventEmitter } from "events";

const eventBus = new EventEmitter();

// Increase max listeners to avoid warning if you add many
eventBus.setMaxListeners(50);

export default eventBus;
