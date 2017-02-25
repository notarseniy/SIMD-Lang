export { extend, addLocationDataFn } from './helpers';
export declare class CodeFragment {
    code: string;
    locationData: any;
    type: string;
    constructor(parent: any, code: any);
    toString(): string;
}
export declare abstract class Base {
    static name: any;
    soak: any;
    locationData: any;
    constructor();
    compile(o: any, lvl: any): any;
    compileToFragments(o: any, lvl: any): any;
    cacheToCodeFragments(cacheValues: any): any[];
    contains(pred: any): any;
    lastNonComment(list: any): any;
    toString(idt?: string, name?: any): string;
    eachChild(func: any): this;
    traverseChildren(crossScope: any, func: any): void;
    unwrapAll(): this;
    children: any[];
    isStatement: boolean;
    jumps: boolean;
    isComplex: boolean;
    isChainable: boolean;
    isAssignable: boolean;
    isNumber: boolean;
    unwrap(): any;
    unfoldSoak(o?: any): boolean;
    assigns(name?: any): any;
    updateLocationDataIfMissing(locationData: any): this;
    makeCode(code: any): CodeFragment;
    wrapInBraces(fragments: any): any[];
    joinFragmentArrays(fragmentsList: any, joinStr: any): any[];
}
export declare class Literal extends Base {
    value: any;
    constructor(value: any);
    static isComplex: boolean;
    assigns(name: any): boolean;
    compileNode(o: any): CodeFragment[];
    toString(): string;
}
export declare class LiteralHello extends Literal {
    constructor();
}
