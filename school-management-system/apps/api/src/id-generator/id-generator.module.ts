import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { IdGeneratorService } from './id-generator.service';

@Global()
@Module({
    imports: [JwtModule.register({})],
    providers: [IdGeneratorService],
    exports: [IdGeneratorService],
})
export class IdGeneratorModule { }
