import argon2 from 'argon2';
import Joi from '@hapi/joi';

import { withMethods } from 'src/utils/with-methods';
import { withSession, NextApiHandlerSession } from 'src/utils/with-session';
import { prisma } from 'prisma/db';

const schema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  password: Joi.string().alphanum().min(12).required(),
  repeat_password: Joi.ref('password'),
  username: Joi.string().alphanum().min(5).required(),
});

const handler: NextApiHandlerSession = async (req, res) => {
  const existingUserEmail = await prisma.user.findOne({
    where: { email: req.body.email },
  });

  if (existingUserEmail) {
    return res.status(422).json({
      error: `User with email ${req.body.email} already exists`,
    });
  }

  const existingUserUsername = await prisma.user.findOne({
    where: { username: req.body.username },
  });

  if (existingUserUsername) {
    return res.status(422).json({
      error: `User with username ${req.body.username} already exists`,
    });
  }

  const { error, errors } = schema.validate(req.body);
  if (errors ?? error) {
    return res.status(422).json(errors ? { errors } : { errors: error });
  }

  const hashedPassword = await argon2.hash(req.body.password);

  const user = await prisma.user.create({
    data: {
      email: req.body.email,
      name: req.body.name,
      password: hashedPassword,
      username: req.body.username,
    },
    select: {
      password: false,
      email: true,
      id: true,
      name: true,
      username: true,
    },
  });

  req.session.set('userId', user.id);
  await req.session.save();
  return res.status(201).json(user);
};

export default withSession(withMethods(handler, ['POST']));
