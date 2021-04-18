interface TranslateOptions {
    from?: string;
    to?: string;
}

declare module "translate-google" {
    function translate(input: string, options: TranslateOptions): Promise<string>;
    export = translate;
}
