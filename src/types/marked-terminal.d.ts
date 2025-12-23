declare module "marked-terminal" {
    import type { MarkedExtension } from "marked";

    export interface TerminalRendererOptions {
        code?: (code: string) => string;
        blockquote?: (quote: string) => string;
        html?: (html: string) => string;
        heading?: (text: string, level: number) => string;
        firstHeading?: (text: string, level: number) => string;
        hr?: () => string;
        listitem?: (text: string, task: boolean, checked: boolean) => string;
        list?: (body: string, ordered: boolean) => string;
        table?: (header: string, body: string) => string;
        tablerow?: (content: string) => string;
        tablecell?: (content: string, flags: object) => string;
        paragraph?: (text: string) => string;
        strong?: (text: string) => string;
        em?: (text: string) => string;
        codespan?: (text: string) => string;
        br?: () => string;
        del?: (text: string) => string;
        link?: (href: string, title: string, text: string) => string;
        image?: (href: string, title: string, text: string) => string;
        text?: (text: string) => string;
        width?: number;
        reflowText?: boolean;
        showSectionPrefix?: boolean;
        unescape?: boolean;
        emoji?: boolean;
        tableOptions?: object;
        tab?: number;
    }

    export interface HighlightOptions {
        theme?: object;
    }

    export function markedTerminal(
        options?: TerminalRendererOptions,
        highlightOptions?: HighlightOptions,
    ): MarkedExtension;
}
