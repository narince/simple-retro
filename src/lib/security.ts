
import DOMPurify from 'dompurify';

export const sanitize = (content: string): string => {
    // If running on server, return as is (or use JSDOM if really needed, but here we run in browser mostly)
    if (typeof window === 'undefined') return content;

    return DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'ul', 'li'], // Basic formatting
        ALLOWED_ATTR: ['href']
    });
};
