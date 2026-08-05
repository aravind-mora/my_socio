import { Fragment } from "react";

/**
 * PrettyBotText — renders bot/AI replies with lightweight Markdown:
 *   **bold**, *italic*, `code`, # ## ### headings, •/- bullet lists,
 *   1. ordered lists, paragraphs with line breaks.
 * Dependency-free (no react-markdown) so nothing needs `npm install`.
 */

const INLINE_RE = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;

const inline = (text) =>
    String(text)
        .split(INLINE_RE)
        .map((p, idx) => {
            if (!p) return null;
            if (/^`[^`]+`$/.test(p)) return <code key={idx}>{p.slice(1, -1)}</code>;
            if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={idx}>{p.slice(2, -2)}</strong>;
            if (/^\*[^*]+\*$/.test(p)) return <em key={idx}>{p.slice(1, -1)}</em>;
            return <span key={idx}>{p}</span>;
        });

export default function PrettyBotText({ text }) {
    if (!text) return null;
    const lines = String(text).split(/\r?\n/);
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
        const trimmed = lines[i].trim();
        if (!trimmed) { i++; continue; }

        // headings
        const h = trimmed.match(/^(#{1,3})\s+(.+)$/);
        if (h) {
            const level = h[1].length;
            const Comp = level === 1 ? "h4" : level === 2 ? "h5" : "h6";
            blocks.push(<Comp key={blocks.length}>{inline(h[2])}</Comp>);
            i++;
            continue;
        }

        // unordered list
        if (/^[-*•]\s+/.test(trimmed)) {
            const items = [];
            while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
                items.push(
                    <li key={items.length}>{inline(lines[i].trim().replace(/^[-*•]\s+/, ""))}</li>
                );
                i++;
            }
            blocks.push(<ul key={blocks.length}>{items}</ul>);
            continue;
        }

        // ordered list
        if (/^\d+[.)]\s+/.test(trimmed)) {
            const items = [];
            while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
                items.push(
                    <li key={items.length}>{inline(lines[i].trim().replace(/^\d+[.)]\s+/, ""))}</li>
                );
                i++;
            }
            blocks.push(<ol key={blocks.length}>{items}</ol>);
            continue;
        }

        // paragraph (consecutive plain lines, keep line breaks)
        const para = [];
        while (i < lines.length) {
            const t = lines[i].trim();
            if (!t || /^(#{1,3})\s+/.test(t) || /^[-*•]\s+/.test(t) || /^\d+[.)]\s+/.test(t)) break;
            para.push(inline(lines[i]));
            i++;
        }
        blocks.push(
            <p key={blocks.length}>
                {para.map((el, idx) => (
                    <Fragment key={idx}>
                        {el}
                        {idx < para.length - 1 ? <br /> : null}
                    </Fragment>
                ))}
            </p>
        );
    }

    return <div className="pretty-bot">{blocks}</div>;
}
