import { Injectable } from '@nestjs/common';
import * as packageJson from '../package.json';

@Injectable()
export class AppService {
  getApiInfo(): Record<string, any> {
    return {
      name: 'Mailer API',
      author: 'Quentin Sautière',
      contact: 'contact@quentinsautiere.com',
      version: packageJson?.version,
      description: packageJson?.description,

      authentication: {
        publicEndpoints: {
          description: 'API key authentication',
          methods: [
            'Header: x-api-key: <your-api-key>',
            'Query parameter: ?apiKey=<your-api-key>',
          ],
        },
        adminEndpoints: {
          description: 'JWT authentication (for administrators only)',
          method: 'Header: Authorization: Bearer <your-jwt-token>',
        },
      },

      endpoints: {
        base: [
          {
            path: '/mailer',
            method: 'GET',
            description: 'API information',
            auth: 'None',
            response: {
              status: 200,
              body: 'API information',
            },
          },
          {
            path: '/mailer/send',
            method: 'POST',
            description: 'Send an email',
            auth: 'API key required',
            rateLimit: '10 requests per minute',
            body: {
              name: "string (required) - Sender's name",
              email: "string (required) - Sender's email",
              message: 'string (required) - Message content',
              company: 'string (optional) - Company name',
            },
            responses: [
              {
                status: 200,
                description: 'Message sent successfully',
                body: { message: 'Message sent' },
              },
              {
                status: 400,
                description: 'Invalid data',
                body: { message: 'Invalid data', errors: [] },
              },
              {
                status: 401,
                description: 'Missing API key',
                body: { message: 'Missing API key' },
              },
              {
                status: 403,
                description: 'Invalid API key',
                body: { message: 'Invalid or expired API key' },
              },
              {
                status: 429,
                description: 'Too many requests',
                body: { message: 'Too many requests, please try again later' },
              },
              {
                status: 500,
                description: 'Server error',
                body: { message: 'Server error' },
              },
            ],
          },
        ],

        apiKeys: [
          {
            path: '/mailer/api-keys',
            method: 'POST',
            description: 'Create a new API key',
            auth: 'Admin JWT required',
            body: {
              name: 'string (required) - API key name',
              ownerId: 'string (required) - Owner ID',
              expiresInDays: 'number (optional) - Validity period in days',
            },
            responses: [
              {
                status: 201,
                description: 'API key created successfully',
                body: {
                  message: 'API key created successfully',
                  apiKey:
                    'string - The generated API key (displayed only at creation)',
                },
              },
              {
                status: 400,
                description: 'Invalid data',
                body: { message: 'Name and owner ID are required' },
              },
              {
                status: 401,
                description: 'Authentication required',
                body: { message: 'Authentication required' },
              },
              {
                status: 403,
                description: 'Access denied',
                body: {
                  message: 'Access denied: administrator rights required',
                },
              },
              {
                status: 500,
                description: 'Server error',
                body: { message: 'Error creating API key', error: 'string' },
              },
            ],
          },
          {
            path: '/mailer/api-keys/:id',
            method: 'DELETE',
            description: 'Revoke an API key',
            auth: 'Admin JWT required',
            params: {
              id: 'string (required) - API key ID',
            },
            responses: [
              {
                status: 200,
                description: 'API key revoked successfully',
                body: { message: 'API key revoked successfully' },
              },
              {
                status: 401,
                description: 'Authentication required',
                body: { message: 'Authentication required' },
              },
              {
                status: 403,
                description: 'Access denied',
                body: {
                  message: 'Access denied: administrator rights required',
                },
              },
              {
                status: 404,
                description: 'API key not found',
                body: { message: 'API key not found' },
              },
              {
                status: 500,
                description: 'Server error',
                body: { message: 'Error revoking API key', error: 'string' },
              },
            ],
          },
          {
            path: '/mailer/api-keys/owner/:ownerId',
            method: 'GET',
            description: "Retrieve a user's API keys",
            auth: 'Admin JWT required',
            params: {
              ownerId: 'string (required) - Owner ID',
            },
            responses: [
              {
                status: 200,
                description: 'List of API keys',
                body: {
                  apiKeys: [
                    {
                      id: 'string',
                      name: 'string',
                      key: 'string (masked, only first characters visible)',
                      hashedKey: 'string',
                      createdAt: 'Date',
                      ownerId: 'string',
                      isActive: 'boolean',
                      expiresAt: 'Date | null',
                      lastUsedAt: 'Date | null',
                    },
                  ],
                },
              },
              {
                status: 401,
                description: 'Authentication required',
                body: { message: 'Authentication required' },
              },
              {
                status: 403,
                description: 'Access denied',
                body: {
                  message: 'Access denied: administrator rights required',
                },
              },
              {
                status: 500,
                description: 'Server error',
                body: { message: 'Error retrieving API keys', error: 'string' },
              },
            ],
          },
        ],
      },

      errors: {
        authentication: {
          401: 'Authentication required or invalid token',
          403: 'Permission denied',
        },
        validation: {
          400: 'Invalid or missing data',
        },
        server: {
          500: 'Internal server error',
        },
        notFound: {
          404: 'Resource not found',
        },
        rateLimit: {
          429: 'Too many requests in a given time',
        },
      },
    };
  }
}
