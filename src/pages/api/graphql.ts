import { NextApiHandler } from 'next';
import { graphql } from 'graphql';
import { renderPlaygroundPage } from 'graphql-playground-html';

import { schema } from 'src/graphql/schema';
import { context } from 'src/graphql/context';

const handler: NextApiHandler = async (req, res) => {
  if (req.method === 'GET') {
    const playground = renderPlaygroundPage({
      endpoint: '/api/graphql',
      settings: {
        'request.credentials': 'include',
        'general.betaUpdates': true,
        'editor.cursorShape': 'line',
        'editor.fontFamily':
          "'Source Code Pro', 'Consolas', 'Inconsolata', 'Droid Sans Mono', 'Monaco', monospace",
        'editor.theme': 'dark',
        'editor.fontSize': 14,
        'editor.reuseHeaders': true,
        'tracing.hideTracingResponse': true,
      },
    });

    return res.send(playground);
  }

  const { query, variables, operationName } = req.body;

  const response = await graphql(
    schema,
    query,
    {},
    context({ req, res }),
    variables,
    operationName
  );
  return res.json(response);
};

export default handler;
