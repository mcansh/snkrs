async function hash(password: string): Promise<string> {
  const crypto = await import('crypto');
  return new Promise((resolve, reject) => {
    // generate random 16 bytes long salt
    const salt = crypto.randomBytes(16).toString('hex');

    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function verify(password: string, hashed: string): Promise<boolean> {
  const crypto = await import('crypto');
  return new Promise((resolve, reject) => {
    const [salt, key] = hashed.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
}

export { hash, verify };
