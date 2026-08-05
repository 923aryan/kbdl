import { readFileSync } from 'fs';
import path from 'path';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { parse as parseYaml } from 'yaml';

const openApiPath = path.resolve(process.cwd(), 'docs/openapi.yaml');
const openApiDocument = parseYaml(readFileSync(openApiPath, 'utf8'));

const swaggerRouter: Router = Router();

swaggerRouter.use('/', swaggerUi.serve);
swaggerRouter.get(
  '/',
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: 'KBDL API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  }),
);

/** Raw OpenAPI YAML — useful for diffing before/after schema refactors */
swaggerRouter.get('/openapi.yaml', (_req, res) => {
  res.type('text/yaml').send(readFileSync(openApiPath, 'utf8'));
});

swaggerRouter.get('/openapi.json', (_req, res) => {
  res.json(openApiDocument);
});

export default swaggerRouter;
export { openApiDocument };
