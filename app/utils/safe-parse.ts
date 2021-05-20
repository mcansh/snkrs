function safeParse(json: string) {
  try {
    return JSON.parse(json);
  } catch (error: unknown) {
    // not valid json
    return undefined;
  }
}

export { safeParse };
