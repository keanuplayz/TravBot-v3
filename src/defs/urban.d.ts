interface Definition {
    id: number;
    word: string;
    thumbsUp: number;
    thumbsDown: number;
    author: string;
    urbanURL: string;
    example: string;
    definition: string;
    tags: string[] | null;
    sounds: string[] | null;
}

declare module "relevant-urban" {
    function urban(query: string): Promise<Definition>;
    export = urban;
}
