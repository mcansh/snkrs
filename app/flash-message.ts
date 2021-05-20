function flashMessage(message: string, type: 'error' | 'info' | 'success') {
  return JSON.stringify({ message, type });
}

export { flashMessage };
