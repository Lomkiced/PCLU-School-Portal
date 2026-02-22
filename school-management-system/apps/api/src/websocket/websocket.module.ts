import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppGateway } from './app.gateway';
import { MessagesModule } from '../messages/messages.module';
import { GroupChatsModule } from '../group-chats/group-chats.module';

@Module({
    imports: [JwtModule.register({}), MessagesModule, GroupChatsModule],
    providers: [AppGateway],
})
export class WebsocketModule { }
