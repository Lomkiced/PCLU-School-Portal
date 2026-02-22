import { Module } from '@nestjs/common';
import { GroupChatsService } from './group-chats.service';
import { GroupChatsController } from './group-chats.controller';

@Module({
    providers: [GroupChatsService],
    controllers: [GroupChatsController],
    exports: [GroupChatsService],
})
export class GroupChatsModule { }
