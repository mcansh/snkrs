import invariant from 'tiny-invariant';

export async function parseStringFormData(request: Request) {
  let formData = await request.formData();
  let obj: { [key: string]: string | undefined } = {};
  for (let [key, val] of formData.entries()) {
    invariant(typeof val === 'string', `expected string in for ${key}`);
    obj[key] = val;
  }
  return obj;
}
