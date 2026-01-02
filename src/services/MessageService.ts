import { MESSAGE_TIMEOUT_MS } from '../lib/constants';
import { logger } from '../lib/logger';

export class MessageService {
    static async send(type: string, payload?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const messageId = Math.random().toString(36).substring(2, 11);
            logger.debug('UI: Sending message:', { type, payload, messageId });

            const handler = (event: MessageEvent) => {
                // Ensure we only listen to messages from our plugin
                if (event.data?.type === 'PLUGIN_MESSAGE_RESPONSE' && event.data.messageId === messageId) {
                    logger.debug('UI: Received response:', event.data);
                    window.removeEventListener('message', handler);
                    clearTimeout(timeout);
                    resolve(event.data.result);
                }
            };

            const timeout = setTimeout(() => {
                window.removeEventListener('message', handler);
                logger.error('UI: Message timeout for:', type);
                reject(new Error('Message timeout'));
            }, MESSAGE_TIMEOUT_MS);

            window.addEventListener('message', handler);
            window.parent.postMessage({
                type: 'PLUGIN_MESSAGE',
                message: { type, payload },
                messageId
            }, '*');
        });
    }
}
