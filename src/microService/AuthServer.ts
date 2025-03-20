import { ConfigService } from '@nestjs/config';
import { ClientsProviderAsyncOptions, Transport } from '@nestjs/microservices';

export function AuthServerConfig(): ClientsProviderAsyncOptions {
  return {
    name: 'AUTH_SERVICE',
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      console.log('auth server config', configService.get('AUTH_SERVICE_HOST'));
      console.log('auth server config', configService.get('AUTH_SERVICE_PORT'));
      return {
        transport: Transport.TCP,
        options: {
          host: configService.get('AUTH_SERVICE_HOST'),
          port: Number(configService.get('AUTH_SERVICE_PORT')),
        },
      };
    },
  };
}
