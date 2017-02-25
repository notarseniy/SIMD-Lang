export declare class Lexer {
    literate: any;
    indent: number;
    baseIndent: number;
    indebt: number;
    outdebt: number;
    indents: Array<any>;
    ends: Array<any>;
    tokens: Array<any>;
    seenFor: boolean;
    seenImport: boolean;
    seenExport: boolean;
    exportSpecifierList: boolean;
    chunkLine: number;
    chunkColumn: number;
    chunk: string;
    constructor();
    tokenize(code: string, opts?: any): any[] | {
        tokens: any[];
        index: number;
    };
    clean(code: any): any;
    getLineAndColumnFromChunk(offset: any): any[];
    makeToken(tag: any, value: any, offsetInChunk?: number, length?: any): any[];
    token(tag: any, value: any, offsetInChunk?: any, length?: any, origin?: any): any;
    helloToken(): any;
}
