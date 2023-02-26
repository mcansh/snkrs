import type {
  LoaderFunction,
  V2_HtmlMetaDescriptor,
  V2_MetaFunction,
} from "@remix-run/node";

export function getPageTitle(title: string) {
  return `${title} | Snkrs`;
}

export const mergeMeta = <
  Loader extends LoaderFunction | unknown = unknown,
  ParentsLoaders extends Record<string, LoaderFunction> = {}
>(
  overrideFn: V2_MetaFunction<Loader, ParentsLoaders>,
  appendFn?: V2_MetaFunction<Loader, ParentsLoaders>
): V2_MetaFunction => {
  return (args) => {
    // get meta from parent routes
    let mergedMeta = args.matches.reduce<V2_HtmlMetaDescriptor[]>(
      (acc, match) => {
        return acc.concat(match.meta || []);
      },
      []
    );

    if (!args.data) return mergedMeta;

    // replace any parent meta with the same name or property with the override
    // @ts-expect-error
    let overrides = overrideFn(args);
    for (let override of overrides) {
      let index = mergedMeta.findIndex((meta) => {
        let name =
          "name" in meta && "name" in override && meta.name === override.name;
        let property =
          "property" in meta &&
          "property" in override &&
          meta.property === override.property;
        let title = "title" in meta && "title" in override;
        return name || property || title;
      });

      if (index !== -1) {
        mergedMeta.splice(index, 1, override);
      }
    }

    // append any additional meta
    if (typeof appendFn === "function") {
      // @ts-expect-error
      mergedMeta = mergedMeta.concat(appendFn(args));
    }

    return mergedMeta;
  };
};