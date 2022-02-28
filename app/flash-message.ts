function flashMessage(message: string, type: 'error' | 'info' | 'success') {
  return { message, type };
}

export { flashMessage };
