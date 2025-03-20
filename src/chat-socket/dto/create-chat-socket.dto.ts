export class CreateChatSocketDto {
  // id: string;
  nickName: string;
  roomId?: string;
}

export class ConnectedServer {
  nickName: string;
}

export class JoinRoom {
  roomId?: string;
}

export class SendPayload {
  roomId: string;
  msg: string;
  type: 'person' | 'group';
}
