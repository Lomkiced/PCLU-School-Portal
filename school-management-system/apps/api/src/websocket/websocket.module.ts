import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppGateway } from './app.gateway';
import { MessagesModule } from '../messages/messages.module';

@Module({
    imports: [JwtModule.register({}), MessagesModule],
    providers: [AppGateway],
    exports: [AppGateway],
})
export class WebsocketModule { }
