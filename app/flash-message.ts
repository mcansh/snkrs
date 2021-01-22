function flashMessage(message: string, type: 'success' | 'error' | 'info') {
  return JSON.stringify({ message, type });
}

export { flashMessage };
