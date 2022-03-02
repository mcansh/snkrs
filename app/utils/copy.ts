function copy(textToCopy: string) {
  if ('clipboard' in navigator) {
    return navigator.clipboard.writeText(textToCopy);
  }

  // 0. save the current focused element so we can refocus it when we're done
  let currentFocus = document.activeElement as HTMLElement | null;
  // 1. create a new textarea for our clipboard shenanigans
  let textArea = document.createElement('textarea');
  // 2. set the value of the ta to what we want to copy
  textArea.value = textToCopy;
  // 3. append it to the body
  document.body.appendChild(textArea);
  // 4. select the text
  textArea.select();
  // 5. call copy
  document.execCommand('copy');
  // 6. cleanup and remove the now unneeded textarea
  textArea.remove();
  // 7. if the browser had something in focus before, refocus it
  if (currentFocus) {
    currentFocus.focus();
  }
  // 8. consistent return
  return Promise.resolve(undefined);
}

export { copy };
