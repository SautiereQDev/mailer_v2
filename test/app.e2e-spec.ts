import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('Routes E2E', () => {
  let validToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Générer un token valide pour les tests
    const jwtService = app.get(JwtService);
    validToken = jwtService.sign({ sub: 'testuser', role: 'admin' });
  });

  it("renvoie les informations de l'API sur GET /", async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          name: string;
          version: string;
          description: string;
          endpoints: any;
        };
        expect(body).toHaveProperty('name');
        expect(body).toHaveProperty('version');
        expect(body).toHaveProperty('description');
        expect(body).toHaveProperty('endpoints');
      });
  });

  it('crée une clé API sur POST /mailer/api-keys avec une autorisation valide', async () => {
    await request(app.getHttpServer())
      .post('/mailer/api-keys')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        name: 'Clé Test',
        description: 'Description Test',
        rateLimit: 10,
      })
      .expect(201);
  });

  it("renvoie 401 sur POST /mailer/api-keys sans en-tête d'autorisation", async () => {
    await request(app.getHttpServer())
      .post('/mailer/api-keys')
      .send({
        name: 'Clé Test',
        description: 'Description Test',
        rateLimit: 10,
      })
      .expect(401);
  });

  it('renvoie 400 sur POST /mailer/api-keys avec des données invalides', async () => {
    await request(app.getHttpServer())
      .post('/mailer/api-keys')
      .set('Authorization', 'Bearer valid.jwt.token')
      .send({ name: '', description: 'Description Test' })
      .expect(400);
  });
});
