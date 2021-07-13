import { getCloudinaryURL } from '../../utils/cloudinary';

describe('generates a cloudinary url from publicId', () => {
  it('uses the base config', () => {
    expect(getCloudinaryURL('some-id')).toMatchInlineSnapshot(
      `"https://res.cloudinary.com/dof0zryca/image/upload/b_auto,f_auto,q_auto/some-id"`
    );
  });

  it('allows passing extra transforms', () => {
    expect(getCloudinaryURL('some-id', { width: 200 })).toMatchInlineSnapshot(
      `"https://res.cloudinary.com/dof0zryca/image/upload/b_auto,f_auto,q_auto/some-id"`
    );
  });

  it('allows overwriting the base config', () => {
    expect(
      getCloudinaryURL('some-id', {
        quality: 80,
        background: 'black',
        fetchFormat: 'avif',
      })
    ).toMatchInlineSnapshot(
      `"https://res.cloudinary.com/dof0zryca/image/upload/b_black,f_avif,q_80/some-id"`
    );
  });
});
