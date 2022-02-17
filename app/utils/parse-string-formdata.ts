import invariant from 'tiny-invariant';

export async function parseStringFormData(request: Request) {
  const formData = await request.formData();
  const obj: { [key: string]: string | undefined } = {};
  for (const [key, val] of formData.entries()) {
    invariant(typeof val === 'string', `expected string in for ${key}`);
    obj[key] = val;
  }
  return obj;
}
