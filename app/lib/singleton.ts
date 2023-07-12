// since the dev server re-requires the bundle, do some shenanigans to make
// certain things persist across that 😆
// Borrowed/modified from https://github.com/jenseng/abuse-the-platform/blob/2993a7e846c95ace693ce61626fa072174c8d9c7/app/utils/singleton.ts

declare global {
  // eslint-disable-next-line prefer-let/prefer-let
  var __singletons: Record<string, any>;
}

export function singleton<Value>(name: string, value: () => Value): Value {
  global.__singletons ??= {};
  global.__singletons[name] ??= value();
  return global.__singletons[name];
}
