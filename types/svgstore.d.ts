declare module "svgstore" {
  type Options = Partial<{
    /**
     * @description style attributes from SVG definitions, or a list of attributes to remove.
     * @default false
     */
    cleanDefs: boolean | Array<string>;
    /**
     * @description Remove style attributes from SVG objects, or a list of attributes to remove.
     * @default false
     */
    cleanSymbols: boolean | Array<string>;
    /**
     * @description A map of attributes to set on the root <svg> element. If you set an attribute's value to null, you remove that attribute. Values may be functions like jQuery.
     * @default false
     */
    svgAttrs: boolean | Record<string, string | null>;
    /**
     * @description A map of attributes to set on each <symbol> element. If you set an attribute's value to null, you remove that attribute. Values may be functions like jQuery.
     * @default false
     */
    symbolAttrs: boolean | Record<string, string | null>;
    /**
     * @description Attributes to have svgstore attempt to copy to the newly created <symbol> tag from it's source <svg> tag. The viewBox, aria-labelledby, and role attributes are always copied.
     * @default false
     */
    copyAttrs: boolean | Array<string>;
    /**
     * @description Rename defs content ids to make them inherit files' names so that it would help to avoid defs with same ids in the output file.
     * @default false
     */
    renameDefs: boolean;
  }>;
  export default function svgstore(options?: Options): {
    add(id: string, svg: string, options?: Options): void;
    toString(options?: Partial<{ inline: boolean }>): string;
  };
}
